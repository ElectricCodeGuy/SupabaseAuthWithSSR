'use client';

import { usePathname } from 'next/navigation';
import {
  GalleryVerticalEnd,
  MessageSquare,
  Upload,
  Home
} from 'lucide-react';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { NavAdmin } from './nav-admin';
import { NavProfile } from './nav-profile';
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
import Link from 'next/link';

function getSidebarData(isAdmin: boolean) {
  const baseNavItems = [
    {
      title: 'Chat',
      url: '/chat',
      icon: MessageSquare
    },
    {
      title: 'File Management',
      url: '/filer',
      icon: Upload
    }
  ];

  return {
    user: {
      name: 'User',
      email: 'user@example.com',
      avatar: '/avatars/user.jpg'
    },
    teams: [
      {
        name: 'Lovguiden',
        logo: GalleryVerticalEnd,
        plan: isAdmin ? 'Admin' : 'User'
      }
    ],
    navMain: baseNavItems,
    projects: []
  };
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isAdmin?: boolean;
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
  hasActiveSubscription?: boolean;
}

export function AppSidebar({
  isAdmin = false,
  user = {
    name: 'User',
    email: 'user@example.com',
    avatar: '/avatars/user.jpg'
  },
  hasActiveSubscription = false
}: AppSidebarProps) {
  const pathname = usePathname();
  const data = getSidebarData(isAdmin);

  return (
    <Sidebar className="sticky w-[280px] md:w-[180px] lg:w-[240px] xl:w-[270px]">
      <SidebarContent>
        <NavProfile pathname={pathname} />
        <NavMain items={data.navMain} pathname={pathname} />

        {isAdmin && <NavAdmin />}
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span>Back to Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavUser user={user} hasActiveSubscription={hasActiveSubscription} />
      </SidebarFooter>
    </Sidebar>
  );
}
