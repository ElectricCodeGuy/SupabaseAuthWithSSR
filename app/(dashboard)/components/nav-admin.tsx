'use client';

import { Shield } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavAdmin() {
  const pathname = usePathname();
  const adminItems = [
    {
      title: 'Brugeradministration',
      url: '/profil/admin/user-profile'
    },
    {
      title: 'Firmaopdateringer',
      url: '/profil/admin/firma-update'
    },
    {
      title: 'Kursusoversigt',
      url: '/profil/admin/course-overview'
    },
    {
      title: 'Send E-mails',
      url: '/profil/admin/send-email'
    },
    {
      title: 'Cache Administration',
      url: '/profil/admin/revalidate'
    }
  ];

  const isAdminActive = pathname === '/profil/admin';

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible asChild defaultOpen className="group/collapsible">
          <SidebarMenuItem>
            <div className="flex items-center">
              <SidebarMenuButton
                asChild
                isActive={isAdminActive}
                className="flex-1"
              >
                <Link href="/profil/admin" prefetch={false}>
                  <Shield />
                  <span>Admin Panel</span>
                </Link>
              </SidebarMenuButton>
              <CollapsibleTrigger asChild>
                <button className="px-2 hover:bg-accent rounded-md">
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <SidebarMenuSub>
                {adminItems.map((item, index) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuSubItem key={index}>
                      <SidebarMenuSubButton asChild isActive={isActive}>
                        <Link href={item.url} prefetch={false}>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}