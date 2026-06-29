'use client';

import React from 'react';
import Link from '@/components/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, MessageSquare, HelpCircle, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Conversations',
    href: '/chat/settings',
    icon: MessageSquare
  },
  {
    title: 'AI Models',
    href: '/chat/settings/models',
    icon: Bot
  },
  {
    title: 'Guide',
    href: '/chat/settings/guide',
    icon: HelpCircle
  }
];

export default function ChatSettingsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Link
          href="/chat"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to chat
        </Link>
      </div>

      <h1 className="text-2xl font-semibold">Chat settings</h1>

      <nav className="flex gap-1 overflow-x-auto border-b">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
