import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/server/server';
import { getCurrentDate } from '@/utils/getBaseUrl';
import { isAfter } from 'date-fns';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const now = getCurrentDate();

    const { data: userData, error } = await supabase
      .from('users')
      .select(
        `
        id,
        subscriptions (
          status,
          stripe_current_period_end,
          name
        )
      `
      )
      .maybeSingle();

    if (error || !userData) {
      return NextResponse.json({
        isLoggedIn: false,
        hasActiveSubscription: false,
        subscriptionType: 'none' as const
      });
    }

    const subscription = userData.subscriptions;
    const hasActiveSubscription = Boolean(
      subscription &&
      (subscription.status === 'active' ||
        subscription.status === 'trialing' ||
        subscription.status === 'canceled') &&
      isAfter(new Date(subscription.stripe_current_period_end), now)
    );

    let subscriptionType: 'none' | 'Basic' | 'Full' = 'none';
    if (hasActiveSubscription && subscription) {
      if (subscription.name === 'Basic') {
        subscriptionType = 'Basic';
      } else if (subscription.name === 'Fuld' || subscription.name === 'Full') {
        subscriptionType = 'Full';
      }
    }

    return NextResponse.json({
      isLoggedIn: true,
      hasActiveSubscription,
      subscriptionType
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
