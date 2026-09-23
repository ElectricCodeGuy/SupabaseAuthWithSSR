// app/api/chat/tools/ImageGenerationTool.ts
//
// Text-to-image generation via a local Qwen-Image-2.1 server. The model only
// writes a prompt (plus an aspect ratio / transparency flag); the tool calls
// the server's OpenAI-compatible POST /v1/images/generations endpoint
// (IMAGE_GEN_BASE_URL, default http://localhost:8004/v1), re-encodes the raw
// PNG to a lossy WebP with sharp and stores the bytes directly in the
// generated_images table — no storage bucket.
//
// The tool OUTPUT only carries the image id + URL, never the bytes: tool
// outputs are persisted in message_parts, re-sent by the client on every
// request and replayed into model context, so base64 in there would bloat
// all three. The browser loads the image from GET /api/images/[id].
import 'server-only';
import { tool, generateImage } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';
import sharp, { type OutputInfo } from 'sharp';
import { createServerSupabaseClient } from '@/lib/server/server';

// `name` is the providerOptions routing key used in generateImage below.
const imageServer = createOpenAICompatible({
  name: 'imagegen',
  baseURL: process.env.IMAGE_GEN_BASE_URL ?? 'http://localhost:8004/v1',
  apiKey: process.env.IMAGE_GEN_API_KEY ?? 'not-needed'
});
const IMAGE_MODEL = process.env.IMAGE_GEN_MODEL ?? 'Qwen/Qwen-Image-2.1';
// Optional sampler override — only sent when set, so servers that don't
// accept extra body fields keep working with their own default.
const INFERENCE_STEPS = Number(process.env.IMAGE_GEN_STEPS) || undefined;
// A 2K image at 40 steps can take several minutes on a single GPU.
const GENERATION_TIMEOUT_MS =
  Number(process.env.IMAGE_GEN_TIMEOUT_MS) || 600_000;

// Qwen-Image-2.1's supported resolutions (from the model card).
const IMAGE_ASPECT_RATIOS = {
  '1:1': [2048, 2048],
  '4:3': [2400, 1792],
  '3:4': [1792, 2400],
  '3:2': [2528, 1696],
  '2:3': [1696, 2528],
  '16:9': [2752, 1536],
  '9:16': [1536, 2752]
} as const satisfies Record<string, readonly [number, number]>;
type AspectRatio = keyof typeof IMAGE_ASPECT_RATIOS;

// Stored/displayed size: the long edge is capped here before WebP encoding.
// 2K originals are ~5-8 MB PNGs; 1536 px WebP at q82 lands around 150-400 KB
// while still looking sharp on a retina chat column.
const MAX_STORED_EDGE = 1536;
const WEBP_QUALITY = 82;

// Model-card prompt format for native RGBA output.
function transparentPrompt(prompt: string): string {
  return `This is an RGBA image with transparency. ${prompt.trim()} The image has alpha channel and the background is transparent.`;
}

interface ImageGenerationToolProps {
  userId: string;
  chatSessionId: string;
}

export const generateImageTool = ({
  userId,
  chatSessionId
}: ImageGenerationToolProps) =>
  tool({
    description: `Generate an image from a text prompt (Qwen-Image-2.1 text-to-image). Use when the user asks you to create, draw, render, design or illustrate an image, picture, logo, sticker, poster, icon or photo. Write a detailed, concrete English prompt: subject, composition, style/medium, lighting, colours, mood — and put any text that must appear in the image in double quotes. The image is shown to the user automatically; afterwards reply with one short sentence, never a markdown image link.`,
    inputSchema: z.object({
      prompt: z
        .string()
        .min(1)
        .max(4000)
        .describe(
          'Detailed description of the image to generate. Text to render in the image goes in double quotes, e.g. a neon sign that reads "OPEN".'
        ),
      aspectRatio: z
        .enum(
          Object.keys(IMAGE_ASPECT_RATIOS) as [AspectRatio, ...AspectRatio[]]
        )
        .default('1:1')
        .describe(
          'Aspect ratio: 1:1 (default), 4:3/3:2/16:9 landscape, 3:4/2:3/9:16 portrait'
        ),
      transparent: z
        .boolean()
        .default(false)
        .describe(
          'true for a transparent background (RGBA) — stickers, logos, icons, cut-out subjects'
        )
    }),
    execute: async ({ prompt, aspectRatio, transparent }, { abortSignal }) => {
      const [width, height] = IMAGE_ASPECT_RATIOS[aspectRatio];

      let raw: Uint8Array;
      try {
        const signals = [AbortSignal.timeout(GENERATION_TIMEOUT_MS)];
        if (abortSignal) signals.push(abortSignal);
        const { image } = await generateImage({
          model: imageServer.imageModel(IMAGE_MODEL),
          prompt: transparent ? transparentPrompt(prompt) : prompt,
          n: 1,
          size: `${width}x${height}`,
          // One generation is minutes of GPU time — don't silently multiply
          // it; the model can retry deliberately if it wants.
          maxRetries: 0,
          abortSignal: AbortSignal.any(signals),
          providerOptions: {
            imagegen: {
              response_format: 'b64_json',
              ...(INFERENCE_STEPS
                ? { num_inference_steps: INFERENCE_STEPS }
                : {})
            }
          }
        });
        raw = image.uint8Array;
      } catch (error) {
        // A user stop aborts the whole turn — nothing to report or log.
        if (abortSignal?.aborted) {
          return { error: 'Image generation was stopped by the user.' };
        }
        console.error('Image generation failed:', error);
        return {
          error:
            error instanceof Error && error.name === 'TimeoutError'
              ? 'The image server took too long to respond. Tell the user the image could not be generated this time.'
              : 'The image server is unavailable or returned an error. Tell the user the image could not be generated right now.'
        };
      }

      // Lossy WebP (alpha preserved for transparent images), long edge
      // capped. sharp throws on bytes that aren't a decodable image (e.g. a
      // misconfigured server answering with something else).
      let webp: Buffer;
      let info: OutputInfo;
      try {
        ({ data: webp, info } = await sharp(raw)
          .resize({
            width: MAX_STORED_EDGE,
            height: MAX_STORED_EDGE,
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: WEBP_QUALITY, alphaQuality: 90, effort: 4 })
          .toBuffer({ resolveWithObject: true }));
      } catch (error) {
        console.error('Could not encode the generated image:', error);
        return {
          error:
            'The image server returned data that is not a valid image. Tell the user the image could not be generated right now.'
        };
      }

      const supabase = await createServerSupabaseClient();

      // The image row references the chat session, but on a brand-new chat
      // the session row is only created when the step is saved — after this
      // tool runs. Same minimal upsert saveMessagesToDB does.
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .upsert(
          {
            id: chatSessionId,
            user_id: userId,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );
      if (sessionError) {
        console.error('Error upserting chat session for image:', sessionError);
        return { error: 'The image was generated but could not be saved.' };
      }

      const { data: row, error: insertError } = await supabase
        .from('generated_images')
        .insert({
          user_id: userId,
          chat_session_id: chatSessionId,
          prompt,
          width: info.width,
          height: info.height,
          media_type: 'image/webp',
          size_bytes: info.size,
          data_base64: webp.toString('base64')
        })
        .select('id')
        .single();
      if (insertError || !row) {
        console.error('Error saving generated image:', insertError);
        return { error: 'The image was generated but could not be saved.' };
      }

      return {
        imageId: row.id,
        url: `/api/images/${row.id}`,
        width: info.width,
        height: info.height,
        aspectRatio,
        transparent,
        message:
          'Image generated and shown to the user above your reply. Do not embed or link it again.'
      };
    }
  });
