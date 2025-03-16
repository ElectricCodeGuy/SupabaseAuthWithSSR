'use client';

import React, { useState, useCallback, use } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, ChevronDown } from 'lucide-react';
import { type User } from '@supabase/supabase-js';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Sitemark from './SitemarkIcon';
import SignOut from './SignOut';
import { ModeToggle } from '@/components/ui/toggleButton';

interface HeaderProps {
  session: Promise<User | null>;
}

const Header: React.FC<HeaderProps> = ({ session }) => {
  const userData = use(session);
  const isLoggedIn = !!userData;
  const [sheetOpen, setSheetOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const isActive = useCallback(
    (href: string) => {
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const navigationItems = [
    { href: '/protected', text: 'Protected' },
    { href: '/aichat', text: 'AI Chat' },
    { href: '/actionchat', text: 'Action Chat' }
  ];

  return (
    <>
      {/* Desktop navigation */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border h-12 hidden md:flex shadow-sm">
        <div className="flex items-center w-full h-full px-8 mx-auto">
          <div className="flex items-center mr-8">
            <Link href="/" passHref>
              <Sitemark />
            </Link>
          </div>

          <div className="flex items-center justify-end flex-1">
            {navigationItems.map((item) => (
              <Button
                key={item.href}
                variant={isActive(item.href) ? 'secondary' : 'ghost'}
                className={`font-semibold text-base mx-1 rounded-md ${
                  isActive(item.href)
                    ? 'text-primary font-bold bg-primary/10'
                    : 'text-foreground hover:bg-muted'
                }`}
                asChild
                onMouseEnter={() => router.prefetch(item.href)}
              >
                <Link href={item.href} prefetch={false}>
                  {item.text}
                </Link>
              </Button>
            ))}

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="font-semibold text-base mx-1 rounded-md"
                  >
                    Profile <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/protected"
                      className="w-full cursor-pointer"
                      prefetch={false}
                      onMouseEnter={() => router.prefetch('/protected')}
                    >
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <SignOut />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant={isActive('/signin') ? 'secondary' : 'ghost'}
                className={`font-semibold text-base mx-1 rounded-md ${
                  isActive('/signin')
                    ? 'text-primary font-bold bg-primary/10'
                    : 'text-foreground'
                }`}
                asChild
              >
                <Link href="/signin" prefetch={false}>
                  Sign in
                </Link>
              </Button>
            )}

            {/* Theme Toggle Button - Desktop */}
            <div className="ml-2">
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 right-4 z-50 md:hidden bg-background/90 rounded-full"
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-6">
              <Link href="/" className="cursor-pointer">
                <Sitemark />
              </Link>
              {/* Theme Toggle Button - Mobile */}
              <ModeToggle />
            </div>

            <Separator />

            <nav className="flex-1 overflow-auto">
              <ul className="py-0 w-full">
                {navigationItems.map((item, index) => (
                  <React.Fragment key={item.href}>
                    <li>
                      <Link
                        href={item.href}
                        className={`flex py-4 px-6 font-semibold text-lg ${
                          isActive(item.href)
                            ? 'bg-muted text-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSheetOpen(false)}
                        prefetch={false}
                      >
                        {item.text}
                      </Link>
                    </li>
                    {index < navigationItems.length - 1 && <Separator />}
                  </React.Fragment>
                ))}

                {isLoggedIn && (
                  <>
                    <Separator />
                    <li className="py-4 px-6">
                      <SignOut />
                    </li>
                  </>
                )}

                {!isLoggedIn && (
                  <>
                    <Separator />
                    <li>
                      <Link
                        href="/signin"
                        className="flex py-4 px-6 font-semibold text-lg hover:bg-muted/50"
                        onClick={() => setSheetOpen(false)}
                        prefetch={false}
                      >
                        Sign in
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Header;
