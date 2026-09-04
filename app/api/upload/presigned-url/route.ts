import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/server/server';
import { encodeBase64 } from '@/utils/base64';
import { getSession } from '@/lib/server/supabase';
import { rejectCrossOrigin } from '@/lib/server/security';

// Per-user storage quota (sum of every object in the user's folder) and the
// cap for one upload — the latter matches the file manager's dropzone limit
// and the bucket-level file_size_limit in database/setup.sql.
const MAX_TOTAL_SIZE = 150 * 1024 * 1024; // 150 MB
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const bodySchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .refine((name) => !/[/\\]|[\x00-\x1f]/.test(name), 'Invalid file name')
    .refine(
      (name) => name.toLowerCase().endsWith('.pdf'),
      'Only PDF files are allowed'
    ),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
  fileType: z.string().max(100).optional()
});

export async function POST(request: NextRequest) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.sub;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }
  const { fileName, fileSize } = parsed.data;

  try {
    // Session client: storage RLS confines both the listing and the signed
    // upload URL to the caller's own folder.
    const supabase = await createServerSupabaseClient();

    const { data: files, error: listError } = await supabase.storage
      .from('userfiles')
      .list(userId, { limit: 1000 });

    if (listError) {
      console.error('List error:', listError);
      return NextResponse.json(
        { message: 'Error checking storage limits' },
        { status: 500 }
      );
    }

    const currentTotalSize = (files ?? []).reduce(
      (total, file) => total + (file.metadata?.size || 0),
      0
    );

    if (currentTotalSize + fileSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          message: `Upload would exceed the maximum allowed total size of ${
            MAX_TOTAL_SIZE / (1024 * 1024)
          } MB`
        },
        { status: 400 }
      );
    }

    const filePath = `${userId}/${encodeBase64(fileName)}`;

    const { data, error } = await supabase.storage
      .from('userfiles')
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json(
        { message: 'Failed to create upload URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      filePath,
      totalSize: currentTotalSize,
      maxSize: MAX_TOTAL_SIZE
    });
  } catch (error) {
    console.error('Unexpected error in presigned URL endpoint:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
