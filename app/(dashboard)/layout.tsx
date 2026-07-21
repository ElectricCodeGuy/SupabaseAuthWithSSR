import React from 'react';
import { AppSidebar } from './components/layout/app-sidebar';
import { DashboardHeader } from './components/layout/dashboard-header';
import { AISettingsModal } from './components/ai-settings/AISettingsModal';
import { getUserData, getAISettingsData } from './fetch';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cookies } from 'next/headers';

export default async function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get('sidebar_state');

  // Default to open if no cookie exists or if cookie is not explicitly 'false'
  const defaultOpen = sidebarCookie?.value !== 'false';

  const [{ isAdmin, user }, aiSettings] = await Promise.all([
    getUserData(),
    getAISettingsData()
  ]);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar isAdmin={isAdmin} user={user} />
      <SidebarInset>
        {/* Shared header — sidebar open/close trigger + breadcrumb — shown on
            every page in this route group. */}
        <DashboardHeader />
        {children}
        {/* Hash-controlled (#ai-settings) — mounted once for the whole
            dashboard; data is server-fetched here and refreshed by the
            settings server actions via revalidatePath. */}
        {aiSettings && <AISettingsModal data={aiSettings} />}
      </SidebarInset>
    </SidebarProvider>
  );
}
