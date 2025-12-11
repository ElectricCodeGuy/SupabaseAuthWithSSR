'use client';

import { Settings2, CreditCard } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import Link from 'next/link';

interface NavProfileProps {
  pathname: string;
}

export function NavProfile({ pathname }: NavProfileProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Profil</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === '/profile'}>
            <Link href="/profile">
              <Settings2 />
              <span>Min Profil</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === '/abonnement'}>
            <Link href="/abonnement">
              <CreditCard />
              <span>Abonnement</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
