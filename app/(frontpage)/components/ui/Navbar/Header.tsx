'use client';

import Link from 'next/link';
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
  BookOpen,
  Rocket,
  MessageSquare,
  Code2,
  Layers,
  Settings,
  CreditCard,
  FolderOpen,
  BotMessageSquare
} from 'lucide-react';
import Sitemark from './SitemarkIcon';
import { ModeToggle } from '@/components/ui/toggleButton';
import SignOut from './SignOut';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Docs navigation links
const docsLinks = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    description: 'Learn how to get started with the AI chat.',
    icon: Rocket
  },
  {
    title: 'Overview',
    href: '/docs/overview',
    description: 'Understand the AI SDK architecture and concepts.',
    icon: Layers
  },
  {
    title: 'useChat Hook',
    href: '/docs/usechat',
    description: 'Learn about the useChat hook for chat functionality.',
    icon: MessageSquare
  },
  {
    title: 'Core Functions',
    href: '/docs/core-functions',
    description: 'Explore the key AI SDK functions.',
    icon: Code2
  }
];

// Profile menu items
const profileMenuItems = [
  {
    href: '/profile',
    text: 'My Profile',
    description: 'View and edit your profile information',
    icon: User
  },
  {
    href: '/filer',
    text: 'My Files',
    description: 'View your uploaded documents',
    icon: FolderOpen
  },
  {
    href: '/settings',
    text: 'Settings',
    description: 'Manage your settings',
    icon: Settings
  },
  {
    href: '/subscription',
    text: 'Subscription',
    description: 'Manage your subscription and payments',
    icon: CreditCard
  }
];

export default function Header() {
  // Use SWR to fetch user data client-side
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
      text: 'Documentation',
      icon: BookOpen,
      subItems: docsLinks.map((link) => ({
        href: link.href,
        text: link.title,
        description: link.description,
        icon: link.icon
      }))
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
          <Sitemark />
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

              {/* Docs dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger triggerMode="click">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Documentation
                </NavigationMenuTrigger>
                <NavigationMenuContent className="right-0 left-auto">
                  <ul className="grid w-[400px] gap-1 p-2 md:w-[500px] md:grid-cols-2">
                    {docsLinks.map((link) => (
                      <ClientListItem
                        key={link.href}
                        href={link.href}
                        title={link.title}
                        icon={link.icon}
                      >
                        {link.description}
                      </ClientListItem>
                    ))}
                  </ul>
                  <div className="border-t p-2">
                    <Link
                      href="/docs"
                      className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline py-1"
                    >
                      <BookOpen className="h-4 w-4" />
                      View all documentation
                    </Link>
                  </div>
                </NavigationMenuContent>
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
