import { useState, useCallback, Fragment } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, LucideIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { ModeToggle } from '@/components/ui/toggleButton';
import { cn } from '@/lib/utils';
import Sitemark from './SitemarkIcon';
import SignOut from './SignOut';

interface MobileSubItem {
  href: string;
  text: string;
  description?: string;
  external?: boolean;
  icon?: LucideIcon;
}

interface MobileMenuItem {
  href?: string;
  text: string;
  external?: boolean;
  icon?: LucideIcon;
  subItems?: MobileSubItem[];
}

interface ClientMobileNavProps {
  menuItems: MobileMenuItem[];
  isLoggedIn?: boolean;
}

export function ClientMobileNav({
  menuItems,
  isLoggedIn
}: ClientMobileNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const isActive = useCallback(
    (href: string) => {
      if (!href) return false;
      if (href === '/') return pathname === href;
      return pathname.startsWith(href);
    },
    [pathname]
  );

  return (
    <div className="flex md:hidden items-center gap-2">
      <ModeToggle />
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full overflow-x-hidden">
            <div className="p-4 flex items-center justify-between border-b">
              <Link
                href="/"
                className="flex items-center"
                onClick={() => setDrawerOpen(false)}
              >
                <Sitemark />
              </Link>
            </div>
            <nav className="flex-grow overflow-y-auto py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;

                return (
                  <Fragment key={index}>
                    {hasSubItems ? (
                      <Collapsible>
                        <CollapsibleTrigger className="group flex items-center justify-between w-full px-4 py-3 text-base font-medium hover:bg-accent transition-colors">
                          <div className="flex items-center gap-3">
                            {Icon && <Icon className="w-5 h-5 shrink-0" />}
                            {item.text}
                          </div>
                          <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="bg-muted/30">
                            {item.subItems!.map((subItem, subIndex) => {
                              const SubIcon = subItem.icon;
                              return (
                                <Fragment key={subIndex}>
                                  <SheetClose asChild>
                                    <Link
                                      href={subItem.href}
                                      prefetch={false}
                                      title={subItem.text}
                                      target={
                                        subItem.external ? '_blank' : undefined
                                      }
                                      rel={
                                        subItem.external
                                          ? 'noopener noreferrer'
                                          : undefined
                                      }
                                      className={cn(
                                        'flex items-start gap-3 px-4 pl-12 py-3 text-sm hover:bg-accent transition-colors',
                                        isActive(subItem.href)
                                          ? 'bg-accent text-accent-foreground font-medium'
                                          : ''
                                      )}
                                    >
                                      {SubIcon && (
                                        <SubIcon className="w-4 h-4 shrink-0 mt-0.5" />
                                      )}
                                      <div className="flex-1">
                                        <div className="font-medium">
                                          {subItem.text}
                                        </div>
                                        {subItem.description && (
                                          <div className="text-xs text-muted-foreground mt-0.5">
                                            {subItem.description}
                                          </div>
                                        )}
                                      </div>
                                    </Link>
                                  </SheetClose>
                                </Fragment>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SheetClose asChild>
                        <Link
                          href={item.href!}
                          prefetch={false}
                          title={item.text}
                          target={item.external ? '_blank' : undefined}
                          rel={
                            item.external ? 'noopener noreferrer' : undefined
                          }
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 text-base font-medium hover:bg-accent transition-colors',
                            isActive(item.href!)
                              ? 'bg-accent text-accent-foreground'
                              : ''
                          )}
                        >
                          {Icon && <Icon className="w-5 h-5 shrink-0" />}
                          {item.text}
                        </Link>
                      </SheetClose>
                    )}
                    {index < menuItems.length - 1 && (
                      <Separator className="my-1" />
                    )}
                  </Fragment>
                );
              })}

              {/* Sign out at bottom for logged in users */}
              {isLoggedIn && (
                <>
                  <Separator className="my-1" />
                  <div className="px-4 py-3 flex items-center gap-3 text-destructive">
                    <SignOut />
                  </div>
                </>
              )}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
