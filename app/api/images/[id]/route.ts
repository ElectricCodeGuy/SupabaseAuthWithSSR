// Serves an image produced by the generateImage chat tool. The encoded WebP
// lives base64-encoded in generated_images (see ImageGenerationTool.ts);
// RLS plus the explicit user_id filter keep every image private to its owner.
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/images/[id]'>
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) {
    return new NextResponse('Not found', { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('generated_images')
    .select('data_base64, media_type')
    .eq('id', id)
    .eq('user_id', session.sub)
    .maybeSingle();

  if (error || !data) {
    return new NextResponse('Not found', { status: 404 });
  }

  const extension = data.media_type.split('/')[1] ?? 'webp';
  return new NextResponse(Buffer.from(data.data_base64, 'base64'), {
    headers: {
      'Content-Type': data.media_type,
      // Images are immutable once stored — let the browser keep them, but
      // never a shared cache (the response is per-user).
      'Cache-Control': 'private, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="image-${id}.${extension}"`,
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
