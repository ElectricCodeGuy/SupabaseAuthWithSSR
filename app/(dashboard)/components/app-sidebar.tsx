'use client';

import { usePathname } from 'next/navigation';
import { Plus, Upload, Settings2, Home } from 'lucide-react';
import { NavChats } from './nav-chats';
import { NavUser } from './nav-user';
import { NavAdmin } from './nav-admin';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import Link from '@/components/link';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isAdmin?: boolean;
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
}

export function AppSidebar({
  isAdmin = false,
  user = {
    name: 'User',
    email: 'user@example.com',
    avatar: '/avatars/user.jpg'
  }
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="sticky w-[280px] md:w-[180px] lg:w-[240px] xl:w-[270px]"
    >
      <SidebarContent>
        {/* Top nav — always visible (collapses to icons + tooltips). */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="New chat"
                  isActive={pathname === '/chat'}
                >
                  <Link href="/chat">
                    <Plus />
                    <span>New chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="File Management"
                  isActive={pathname.startsWith('/filer')}
                >
                  <Link href="/filer">
                    <Upload />
                    <span>File Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Manage conversations"
                  isActive={pathname.startsWith('/chat/settings')}
                >
                  <Link href="/chat/settings">
                    <Settings2 />
                    <span>Manage conversations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Favorites + chat history */}
        <NavChats />

        {isAdmin && <NavAdmin />}
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to Home">
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span>Back to Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
