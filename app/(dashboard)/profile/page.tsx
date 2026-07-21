import 'server-only';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server/supabase';
import { fetchProfileData } from './fetch';
import { encodeBase64 } from '@/utils/base64';
import Link from '@/components/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/app/(dashboard)/components/analytics/StatCard';
import {
  OpenAISettingsButton,
  ManageMemoriesButton
} from './components/ProfileActions';
import {
  Brain,
  ChartColumn,
  Coins,
  FileText,
  MessagesSquare,
  Shield
} from 'lucide-react';

const numberFormat = new Intl.NumberFormat('en-US');
const compactFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});
const costFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 4
});
const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
const shortDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric'
});

function initials(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/');

  const data = await fetchProfileData(session.sub);
  if (!data) redirect('/');

  const {
    user,
    createdAt,
    chatCount,
    documentCount,
    memoryCount,
    memories,
    recentChats,
    recentDocuments,
    usage
  } = data;

  const memberSince = createdAt
    ? dateFormat.format(new Date(createdAt))
    : null;
  const displayName = user.full_name || user.email.split('@')[0];

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Identity header */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary"
            aria-hidden
          >
            {initials(user.full_name, user.email)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {displayName}
              </h1>
              {user.is_admin && (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Shield className="h-3 w-3" />
                  <span>Admin</span>
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {memberSince && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {`Member since ${memberSince}`}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <OpenAISettingsButton />
            <Button asChild size="sm" variant="outline">
              <Link href="/usage" prefetch={false}>
                <ChartColumn className="mr-1.5 h-3.5 w-3.5" />
                Usage
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Conversations"
          value={numberFormat.format(chatCount ?? 0)}
          icon={<MessagesSquare className="h-4 w-4" />}
        />
        <StatCard
          label="Documents"
          value={numberFormat.format(documentCount ?? 0)}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Memories"
          value={numberFormat.format(memoryCount ?? 0)}
          icon={<Brain className="h-4 w-4" />}
        />
        <StatCard
          label="Spend (30d)"
          value={costFormat.format(usage.estimatedCostUsd)}
          hint={`${compactFormat.format(usage.inputTokens + usage.outputTokens)} tokens`}
          icon={<Coins className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <Card className="gap-2">
            <CardHeader className="pb-0">
              <h3 className="text-sm font-semibold">Account</h3>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border/60 text-sm">
                {[
                  ['Name', user.full_name || '—'],
                  ['Email', user.email],
                  ['Role', user.is_admin ? 'Admin' : 'Member'],
                  ['Default model', user.selected_model ?? 'Default'],
                  ['Member since', memberSince ?? '—']
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-4 py-2.5"
                  >
                    <dt className="shrink-0 text-xs font-medium text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="min-w-0 truncate text-right font-medium">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">
                Name and default model are edited in AI settings.
              </p>
            </CardContent>
          </Card>

          <Card className="gap-2">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <div>
                <h3 className="text-sm font-semibold">
                  What the AI knows about you
                </h3>
                <p className="text-xs text-muted-foreground">
                  {`${memoryCount ?? 0} memor${(memoryCount ?? 0) === 1 ? 'y' : 'ies'} stored`}
                </p>
              </div>
              <ManageMemoriesButton />
            </CardHeader>
            <CardContent>
              {(memories ?? []).length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No memories yet — tell the assistant{' '}
                  <span className="italic">&quot;remember that …&quot;</span> in
                  a chat.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(memories ?? []).map((memory) => (
                    <li
                      key={memory.id}
                      className="rounded-md border bg-muted/30 px-3 py-2 text-sm leading-snug"
                    >
                      {memory.content}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card className="gap-2">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <h3 className="text-sm font-semibold">Recent conversations</h3>
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                <Link href="/chat/settings" prefetch={false}>
                  View all
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {(recentChats ?? []).length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No conversations yet.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {(recentChats ?? []).map((chat) => (
                    <li key={chat.id}>
                      <Link
                        href={`/chat/${chat.id}`}
                        prefetch={false}
                        className="flex items-baseline justify-between gap-3 py-2 hover:text-primary"
                      >
                        <span className="min-w-0 truncate text-sm font-medium">
                          {chat.chat_title || 'Untitled chat'}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {shortDateFormat.format(new Date(chat.updated_at))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="gap-2">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <h3 className="text-sm font-semibold">Recent documents</h3>
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                <Link href="/filer" prefetch={false}>
                  Manage files
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {(recentDocuments ?? []).length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No documents uploaded yet.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {(recentDocuments ?? []).map((doc) => (
                    <li key={doc.id}>
                      <Link
                        href={`/filer?doc=${encodeBase64(doc.title)}`}
                        prefetch={false}
                        className="flex items-baseline justify-between gap-3 py-2 hover:text-primary"
                      >
                        <span className="min-w-0 truncate text-sm font-medium">
                          {doc.ai_title || doc.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {`${doc.total_pages} p. · ${shortDateFormat.format(new Date(doc.created_at))}`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
