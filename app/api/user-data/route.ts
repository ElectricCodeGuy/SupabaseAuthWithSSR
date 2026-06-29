import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // This template has no subscriptions table, so we only report login state.
    // The subscription fields are kept (always "none"/false) so existing
    // consumers of this endpoint don't need to change.
    const { data: userData, error } = await supabase
      .from('users')
      .select('id')
      .maybeSingle();

    if (error || !userData) {
      return NextResponse.json({
        isLoggedIn: false,
        hasActiveSubscription: false,
        subscriptionType: 'none' as const
      });
    }

    return NextResponse.json({
      isLoggedIn: true,
      hasActiveSubscription: false,
      subscriptionType: 'none' as const
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({
      isLoggedIn: false,
      hasActiveSubscription: false,
      subscriptionType: 'none' as const
    });
  }
}
