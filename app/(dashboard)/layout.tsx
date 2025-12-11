import 'server-only';
import React from 'react';
import { type Metadata } from 'next';
import { AppSidebar } from './components/app-sidebar';
import { createServerSupabaseClient } from '@/lib/server/server';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { isAfter } from 'date-fns';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false
  }
};

async function getUserData() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        role,
        full_name,
        email,
        subscriptions (
          status,
          stripe_current_period_end
        )
      `
      )
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return null;
    }

    const isAdmin = userData?.role === 'admin';

    // Check for active subscription
    const subscription = userData?.subscriptions;
    const hasActiveSubscription = Boolean(
      subscription &&
      (subscription.status === 'active' ||
        subscription.status === 'trialing' ||
        subscription.status === 'canceled') &&
      isAfter(new Date(subscription.stripe_current_period_end), new Date())
    );

    const user = {
      name: userData?.full_name || userData?.email?.split('@')[0] || 'User',
      email: userData?.email || '',
      avatar: '/avatars/user.jpg'
    };

    return {
      isAdmin,
      user,
      hasActiveSubscription
    };
  } catch (error) {
    console.error('Error checking user data:', error);
    return null;
  }
}

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  const userData = await getUserData();

  if (!userData) {
    return <>{children}</>;
  }

  const { isAdmin, user, hasActiveSubscription } = userData;

  return (
    <SidebarProvider className="flex">
      <AppSidebar
        isAdmin={isAdmin}
        user={user}
        hasActiveSubscription={hasActiveSubscription}
      />
      <SidebarInset>{children}</SidebarInset>
      <div className="fixed bottom-4 right-4 z-50 sm:hidden">
        <SidebarTrigger />
      </div>
    </SidebarProvider>
  );
}
