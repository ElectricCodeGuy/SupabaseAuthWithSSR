import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/server/server';
import { getSession } from '@/lib/server/supabase';
import { isOwnStoragePath, rejectCrossOrigin } from '@/lib/server/security';

// Removes a freshly uploaded object when the follow-up OCR step failed, so a
// half-finished upload doesn't count against the user's storage quota. Runs
// through the session client: storage RLS restricts deletes to the user's
// own folder on top of the explicit path check below.
const bodySchema = z.object({
  filePath: z.string().min(1).max(512)
});

export async function POST(request: NextRequest) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }

  const { filePath } = parsed.data;
  if (!isOwnStoragePath(filePath, session.sub)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.storage.from('userfiles').remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { message: 'Failed to cleanup file' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
