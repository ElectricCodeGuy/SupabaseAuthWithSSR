import React, { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { NavigationMenuLink } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ClientListItemProps {
  href: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  beta?: boolean;
  icon?: LucideIcon;
}

export function ClientListItem({
  href,
  title,
  children,
  className,
  beta,
  icon: Icon
}: ClientListItemProps) {
  const pathname = usePathname();

  const isActive = useCallback(() => {
    if (!href) return false;
    if (href.startsWith('/information/')) {
      return pathname === href;
    }
    if (href === '/profil') {
      return pathname.startsWith('/profil');
    }
    return href === '/' ? pathname === href : pathname.startsWith(href);
  }, [pathname, href]);

  return (
    <li className={className}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            'block select-none p-2 rounded-md leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            isActive() ? 'font-semibold text-primary bg-accent' : ''
          )}
        >
          <div className="text-sm leading-none font-medium flex items-center gap-2 text-foreground">
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            {title}
            {beta && (
              <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-300/10">
                Beta
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-sm leading-snug pb-0 pt-1">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
