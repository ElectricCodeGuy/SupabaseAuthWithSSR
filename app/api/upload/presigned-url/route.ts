// app/api/upload/presigned-url/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/server/admin';
import { encodeBase64 } from '@/utils/base64';
import { getSession } from '@/lib/server/supabase';

const MAX_TOTAL_SIZE = 150 * 1024 * 1024; // 150 MB

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileSize } = body;

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.sub;
    const supabase = createAdminClient();

    // Check current total size
    const { data: files, error: listError } = await supabase.storage
      .from('userfiles')
      .list(userId);

    if (listError) {
      console.error('List error:', listError);
      return NextResponse.json(
        { message: 'Error checking storage limits', error: listError.message },
        { status: 500 }
      );
    }

    const currentTotalSize =
      files?.reduce((total, file) => total + (file.metadata?.size || 0), 0) ||
      0;

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

    const encodedFileName = encodeBase64(fileName);

    const filePath = `${userId}/${encodedFileName}`;

    const { data, error } = await supabase.storage
      .from('userfiles')
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json(
        { message: 'Failed to create upload URL', error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.error('No data returned from createSignedUploadUrl');
      return NextResponse.json(
        { message: 'Failed to create upload URL - no data returned' },
        { status: 500 }
      );
    }

    const response = {
      uploadUrl: data.signedUrl,
      filePath,
      totalSize: currentTotalSize,
      maxSize: MAX_TOTAL_SIZE
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in presigned URL endpoint:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    );
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
