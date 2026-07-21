// PDF generation tool. Renders a polished A4 document with @react-pdf/renderer
// (templates, callouts, tables, images, cover page, table of contents),
// uploads it to the user's folder in the `userfiles` bucket (same path scheme
// as user uploads: <userId>/<base64(fileName)>), and registers it in
// user_documents so it shows up in the file manager at /filer — where the
// built-in PDF viewer can preview it directly.
import 'server-only';
import { tool } from 'ai';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createServerSupabaseClient } from '@/lib/server/server';
import { encodeBase64 } from '@/utils/base64';
import { registerPdfFonts } from './pdf/fonts';
import { PdfDocument } from './pdf/PdfDocument';
import {
  createPdfInputSchema,
  type ResolvedSection,
  type PdfSection
} from './pdf/schema';

// Pre-fetch a remote image into a buffer so a bad URL can never crash the
// render. Only https PNG/JPEG up to 5 MB are accepted.
async function fetchImage(
  url: string
): Promise<{ data: Buffer; format: 'png' | 'jpg' } | undefined> {
  try {
    if (!/^https:\/\//i.test(url)) return undefined;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return undefined;

    const type = (res.headers.get('content-type') || '').toLowerCase();
    const isPng = type.includes('png');
    const isJpg = type.includes('jpeg') || type.includes('jpg');
    if (!isPng && !isJpg) return undefined;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > 5 * 1024 * 1024)
      return undefined;

    return { data: buf, format: isPng ? 'png' : 'jpg' };
  } catch {
    return undefined;
  }
}

async function resolveSections(
  sections: PdfSection[]
): Promise<ResolvedSection[]> {
  return Promise.all(
    sections.map(async (section) => {
      if (!section.imageUrl) return section;
      const imageData = await fetchImage(section.imageUrl);
      return { ...section, imageData };
    })
  );
}

export const createPDF = ({ userId }: { userId: string }) =>
  tool({
    description: `Create a polished, professional PDF document. Use this when the user asks for a PDF report, memo, letter, contract, or any content as a downloadable PDF file.

Capabilities you should use to produce a well-structured document:
- "template": pick "report" (default), "memo", "letter", or "contract" to set the visual style.
- "sections": order content with headings (level 1 for main sections, 2 for sub-sections, 3 for small labels), paragraphs, bulletPoints and numberedList.
- Inline formatting inside any text: **bold**, *italic*, \`code\`, and [link text](https://url).
- "callouts" on a section for highlighted boxes — "info"/"warning"/"success" for notes, "quote" for citations (with an optional "citation" source line).
- "table" on a section (or document-level "tables") with optional "columnWidths".
- "imageUrl" (absolute https PNG/JPEG) with an optional "imageCaption".
- "includeCoverPage" for a dedicated cover, "includeTableOfContents" for longer documents.

IMPORTANT: After creating the document, do NOT put a link to the PDF in your reply text. Just tell the user the PDF is ready and that they can open it from the panel above (or on the Files page).`,

    inputSchema: createPdfInputSchema,

    execute: async (args) => {
      try {
        registerPdfFonts();

        const {
          title,
          subtitle,
          author,
          date,
          template = 'report',
          sections,
          tables,
          includeCoverPage,
          includeTableOfContents,
          headerText,
          includePageNumbers = true
        } = args;

        const resolvedSections = await resolveSections(sections);

        const pdfBuffer = await renderToBuffer(
          React.createElement(PdfDocument, {
            title,
            subtitle,
            author,
            date,
            template,
            sections: resolvedSections,
            tables,
            includeCoverPage,
            includeTableOfContents,
            headerText,
            includePageNumbers
          })
        );

        // Same storage layout as user uploads: <userId>/<base64(fileName)>.
        // The session client is enough — the storage RLS policies allow users
        // to write inside their own folder.
        const supabase = await createServerSupabaseClient();

        // Never overwrite an existing document with the same title — an
        // uploaded PDF may share the name, and clobbering it would leave its
        // OCR embeddings pointing at the wrong content. Uniquify instead:
        // "Report.pdf", "Report (2).pdf", "Report (3).pdf", …
        const { data: existing } = await supabase
          .from('user_documents')
          .select('title')
          .eq('user_id', userId)
          .like('title', `${title}%.pdf`);
        const taken = new Set((existing ?? []).map((d) => d.title));
        let fileName = `${title}.pdf`;
        for (let n = 2; taken.has(fileName); n++) {
          fileName = `${title} (${n}).pdf`;
        }
        const encodedFileName = encodeBase64(fileName);
        const filePath = `${userId}/${encodedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('userfiles')
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: false
          });
        if (uploadError) {
          console.error('createPDF upload error:', uploadError);
          throw uploadError;
        }

        // Register in user_documents so the file manager lists it. Generated
        // PDFs are not OCR-processed, so they have no embeddings and won't be
        // found by searchUserDocument's content search.
        const { error: dbError } = await supabase.from('user_documents').insert(
          {
            user_id: userId,
            title: fileName,
            file_path: filePath,
            total_pages: sections.length
          }
        );
        if (dbError) {
          console.error('createPDF user_documents upsert error:', dbError);
        }

        return {
          success: true as const,
          fileName,
          viewerUrl: `/filer?doc=${encodedFileName}`,
          metadata: {
            title,
            author: author ?? null,
            date: date ?? null,
            template,
            sectionCount: sections.length,
            tableCount:
              (tables?.length || 0) + sections.filter((s) => s.table).length
          },
          message: `PDF "${fileName}" created and saved to the user's files.`
        };
      } catch (error) {
        console.error('createPDF error:', error);
        return {
          success: false as const,
          message: `Failed to create the PDF: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        };
      }
    }
  });
