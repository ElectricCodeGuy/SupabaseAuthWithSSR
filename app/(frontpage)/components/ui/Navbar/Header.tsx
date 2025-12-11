'use client';

import Link from 'next/link';
import useSWR from 'swr';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
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
  LogOut
} from 'lucide-react';
import Sitemark from './SitemarkIcon';
import { ModeToggle } from '@/components/ui/toggleButton';
import SignOut from './SignOut';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Docs navigation links
const docsLinks = [
  {
    title: 'Kom i gang',
    href: '/docs/getting-started',
    description: 'Lær hvordan du kommer i gang med AI-chatten.',
    icon: Rocket
  },
  {
    title: 'Oversigt',
    href: '/docs/overview',
    description: 'Forstå AI SDK arkitekturen og koncepterne.',
    icon: Layers
  },
  {
    title: 'useChat Hook',
    href: '/docs/usechat',
    description: 'Lær om useChat hook til chat-funktionalitet.',
    icon: MessageSquare
  },
  {
    title: 'Core Functions',
    href: '/docs/core-functions',
    description: 'Udforsk de vigtigste AI SDK funktioner.',
    icon: Code2
  }
];

// Profile menu items
const profileMenuItems = [
  {
    href: '/profile',
    text: 'Min profil',
    description: 'Se og rediger dine profiloplysninger',
    icon: User
  },
  {
    href: '/filer',
    text: 'Mine filer',
    description: 'Se dine uploadede dokumenter',
    icon: FolderOpen
  },
  {
    href: '/settings',
    text: 'Indstillinger',
    description: 'Administrer dine indstillinger',
    icon: Settings
  },
  {
    href: '/subscription',
    text: 'Abonnement',
    description: 'Administrer dit abonnement og betalinger',
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
      text: 'Dokumentation',
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
            text: 'Min Konto',
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
            text: 'Log ind',
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
                <NavigationMenuLink asChild>
                  <Link href="/chat" className={navigationMenuTriggerStyle()}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    AI Chat
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Docs dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Dokumentation
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
                      Se al dokumentation
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
                  <NavigationMenuTrigger className="w-[100px]">
                    <User className="w-4 h-4 mr-2" />
                    Profil
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
                        <LogOut className="h-4 w-4" />
                        <SignOut />
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/signin" className={navigationMenuTriggerStyle()}>
                      <LogIn className="w-4 h-4 mr-2" />
                      Log ind
                    </Link>
                  </NavigationMenuLink>
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
