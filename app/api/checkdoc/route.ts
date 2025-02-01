import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      console.error('LLAMA_CLOUD_API_KEY is not configured');
      return NextResponse.json(
        {
          error: 'Server configuration error: LLAMA_CLOUD_API_KEY is missing'
        },
        { status: 500 }
      );
    }
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      );
    }

    const { jobId } = await req.json();

    const statusResponse = await fetch(
      `https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`,
          Accept: 'application/json'
        }
      }
    );

    if (!statusResponse.ok) {
      console.error('Failed to check job status:', statusResponse.statusText);
      return NextResponse.json(
        { error: `Failed to check job status: ${statusResponse.statusText}` },
        { status: 500 }
      );
    }

    const statusData = await statusResponse.json();

    if (statusData.status === 'PENDING') {
      return NextResponse.json({ status: 'PENDING' });
    } else if (statusData.status === 'ERROR') {
      console.error('Parsing job failed:', statusData.error_message);
      return NextResponse.json(
        { error: `Parsing job failed: ${statusData.error_message}` },
        { status: 500 }
      );
    } else if (statusData.status === 'SUCCESS') {
      return NextResponse.json({ status: 'SUCCESS' });
    }

    return NextResponse.json({ status: 'UNKNOWN' });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
