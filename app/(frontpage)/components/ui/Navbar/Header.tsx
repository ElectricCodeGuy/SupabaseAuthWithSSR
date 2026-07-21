'use client';

import Link from '@/components/link';
import useSWR from 'swr';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientListItem } from './ClientListItem';
import { ClientMobileNav } from './ClientMobileNav';
import {
  User,
  LogIn,
  MessageSquare,
  FolderOpen,
  ChartColumn,
  Settings2,
  BotMessageSquare
} from 'lucide-react';
import { Github } from '@/components/brand-icons';
import Logo from './Logo';
import { ModeToggle } from '@/components/ui/toggleButton';
import SignOut from './SignOut';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const GITHUB_URL = 'https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR';

// Profile menu items — every entry is a real route in this app.
const profileMenuItems = [
  {
    href: '/profile',
    text: 'My Profile',
    description: 'Your account, activity and memories',
    icon: User
  },
  {
    href: '/filer',
    text: 'My Files',
    description: 'View and manage uploaded documents',
    icon: FolderOpen
  },
  {
    href: '/usage',
    text: 'Usage',
    description: 'Token usage, cache hits and cost',
    icon: ChartColumn
  },
  {
    href: '/chat/settings',
    text: 'Manage Chats',
    description: 'Rename, share or delete conversations',
    icon: Settings2
  }
];

export default function Header() {
  // Use SWR to fetch user data client-side.
  // We could also pass this data from a parent layout via props, but this would force every single children of the layout to become dynamicly rendered at run time.
  // We do this so the children of the layout can be statically optimized.
  const { data: userData, isLoading } = useSWR<{
    isLoggedIn: boolean;
    hasActiveSubscription: boolean;
    subscriptionType: 'none' | 'Basic' | 'Full';
  }>('/api/user-data', fetcher);

  const isLoggedIn = userData?.isLoggedIn ?? false;

  // Mobile menu items
  const mobileMenuItems = [
    {
      href: '/chat',
      text: 'AI Chat',
      icon: MessageSquare
    },
    {
      href: GITHUB_URL,
      text: 'GitHub',
      icon: Github
    },
    ...(isLoggedIn
      ? [
          {
            text: 'My Account',
            icon: User,
            subItems: profileMenuItems.map((item) => ({
              href: item.href,
              text: item.text,
              description: item.description,
              icon: item.icon
            }))
          }
        ]
      : [
          {
            href: '/signin',
            text: 'Sign In',
            icon: LogIn
          }
        ])
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg shadow-sm h-14">
      <div className="flex items-center justify-between h-full px-4 xl:px-8 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-end gap-1">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              {/* AI Chat link */}
              <NavigationMenuItem>
                <Link
                  href="/chat"
                  className={`${navigationMenuTriggerStyle()} flex items-center`}
                >
                  <BotMessageSquare className="w-4 h-4 mr-2" />
                  AI Chat
                </Link>
              </NavigationMenuItem>

              {/* GitHub */}
              <NavigationMenuItem>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${navigationMenuTriggerStyle()} flex items-center`}
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              </NavigationMenuItem>

              {/* Profile Menu / Login */}
              {isLoading ? (
                <NavigationMenuItem className="flex flex-col justify-center gap-1.5 h-9 w-[100px] px-4">
                  <Skeleton className="h-1 w-full rounded-full" />
                  <Skeleton className="h-1 w-full rounded-full" />
                  <Skeleton className="h-1 w-full rounded-full" />
                </NavigationMenuItem>
              ) : isLoggedIn ? (
                <NavigationMenuItem>
                  <NavigationMenuTrigger triggerMode="click">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="right-0 left-auto">
                    <ul className="grid w-[300px] gap-1 p-2 md:w-[400px] md:grid-cols-2">
                      {profileMenuItems.map((item) => (
                        <ClientListItem
                          key={item.href}
                          href={item.href}
                          title={item.text}
                          icon={item.icon}
                        >
                          {item.description}
                        </ClientListItem>
                      ))}
                    </ul>
                    <div className="border-t p-2">
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-destructive py-1">
                        <SignOut />
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem>
                  <Link
                    href="/signin"
                    className={`${navigationMenuTriggerStyle()} flex items-center`}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Theme Toggle */}
          <ModeToggle />
        </div>

        {/* Mobile Navigation */}
        <ClientMobileNav menuItems={mobileMenuItems} isLoggedIn={isLoggedIn} />
      </div>
    </header>
  );
}
