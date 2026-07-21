'use client';

import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';

const fetcher = (url: string): Promise<{ title: string }> =>
  fetch(url).then((r) => r.json());

// Fallback label derived from the URL for non-chat pages.
function labelFromPath(pathname: string): string {
  const seg = pathname.split('/').filter(Boolean).pop() ?? '';
  if (!seg) return 'Home';
  return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DashboardHeader() {
  const pathname = usePathname();

  // Derive the conversation id from the pathname (NOT useParams): a brand-new
  // chat updates the URL via history.replaceState, which updates the pathname
  // but not the matched route params. On /chat/[id] fetch the title; otherwise
  // the breadcrumb is derived from the pathname.
  const segments = pathname.split('/').filter(Boolean);
  const chatId =
    segments[0] === 'chat' &&
    segments.length === 2 &&
    segments[1] !== 'settings'
      ? segments[1]
      : null;

  const { data } = useSWR(
    chatId ? `/api/chat-title/${chatId}` : null,
    fetcher
  );

  const label = chatId ? (data?.title ?? 'Chat') : labelFromPath(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger className="text-muted-foreground" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
