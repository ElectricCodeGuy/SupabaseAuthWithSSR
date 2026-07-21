'use client';

import { usePathname } from 'next/navigation';
import {
  Plus,
  Upload,
  Settings2,
  Home,
  ChartColumn,
  Bot,
  Lock,
  LogIn,
  Shield
} from 'lucide-react';
import { openAISettings } from '../ai-settings/AISettingsModal';
import { NavChats } from './nav-chats';
import { NavUser } from './nav-user';
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
  /** null = visitor is not signed in — the sidebar renders its guest state. */
  user?: {
    name: string;
    email: string;
    avatar: string;
  } | null;
}

export function AppSidebar({ isAdmin = false, user = null }: AppSidebarProps) {
  const pathname = usePathname();
  const signedOut = !user;

  // Account-bound destinations: signed-out visitors see them (so the product
  // surface is visible) but with a lock, and clicking leads to sign-in.
  const accountNav = [
    {
      title: 'File Management',
      href: '/filer',
      icon: Upload,
      isActive: pathname.startsWith('/filer')
    },
    {
      title: 'Manage conversations',
      href: '/chat/settings',
      icon: Settings2,
      isActive: pathname.startsWith('/chat/settings')
    },
    {
      title: 'Usage',
      href: '/usage',
      icon: ChartColumn,
      isActive: pathname.startsWith('/usage')
    }
  ];

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
              {accountNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={
                      signedOut ? `Sign in to use ${item.title}` : item.title
                    }
                    isActive={!signedOut && item.isActive}
                    className={signedOut ? 'opacity-60' : undefined}
                  >
                    <Link href={signedOut ? '/signin' : item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                      {signedOut && (
                        <Lock className="ml-auto h-3 w-3 text-muted-foreground" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                {/* Hash-controlled modal — a plain button (history.replaceState),
                    deliberately NOT a Next.js navigation. */}
                <SidebarMenuButton
                  asChild={signedOut}
                  tooltip={signedOut ? 'Sign in to use AI settings' : 'AI settings'}
                  className={signedOut ? 'opacity-60' : undefined}
                  onClick={signedOut ? undefined : () => openAISettings()}
                >
                  {signedOut ? (
                    <Link href="/signin">
                      <Bot />
                      <span>AI settings</span>
                      <Lock className="ml-auto h-3 w-3 text-muted-foreground" />
                    </Link>
                  ) : (
                    <>
                      <Bot />
                      <span>AI settings</span>
                    </>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Favorites + chat history (or the guest preview when signed out) */}
        <NavChats signedOut={signedOut} />
      </SidebarContent>

      <SidebarFooter>
        {/* Secondary destinations — one flat menu directly above the profile
            button so Admin / Home / profile share the footer's spacing. */}
        <SidebarMenu>
          {isAdmin && !signedOut && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Admin dashboard"
                isActive={pathname.startsWith('/admin')}
              >
                <Link href="/admin">
                  <Shield />
                  <span>Admin dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to Home">
              <Link href="/">
                <Home />
                <span>Back to Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {signedOut && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Sign in">
                <Link href="/signin">
                  <LogIn />
                  <span>Sign in</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
