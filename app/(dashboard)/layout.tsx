import React from 'react';
import { AppSidebar } from './components/app-sidebar';
import { DashboardHeader } from './components/dashboard-header';
import { createServerSupabaseClient } from '@/lib/server/server';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cookies } from 'next/headers';

async function getUserData() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        full_name,
        email
      `
      )
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return null;
    }

    const user = {
      name: userData?.full_name || userData?.email?.split('@')[0] || 'User',
      email: userData?.email || '',
      avatar: '/avatars/user.jpg'
    };

    // This template has no admin (role) table, so isAdmin is always false.
    // Add a `role` column and restore the check here if you build that feature.
    return {
      isAdmin: false,
      user
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
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get('sidebar_state');

  // Default to open if no cookie exists or if cookie is not explicitly 'false'
  const defaultOpen = sidebarCookie?.value !== 'false';

  const userData = await getUserData();

  if (!userData) {
    return <>{children}</>;
  }

  const { isAdmin, user } = userData;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar isAdmin={isAdmin} user={user} />
      <SidebarInset>
        {/* Shared header — sidebar open/close trigger + breadcrumb — shown on
            every page in this route group. */}
        <DashboardHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
