'use client';

// Admin users table: client-side search + inline profile editing (rename,
// admin toggle). All mutations go through server actions that re-verify the
// caller is an admin.
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Check, Pencil, Search, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateUserName, setUserAdmin } from '../actions';

export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  isAdmin: boolean;
  selectedModel: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheHitRate: number;
  steps: number;
  costUsd: number;
}

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

function initials(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function UserRow({ user, isSelf }: { user: AdminUserRow; isSelf: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.fullName);
  const [isPending, startTransition] = useTransition();

  const saveName = () => {
    startTransition(async () => {
      const result = await updateUserName(user.id, name);
      if (result.success) {
        toast.success('Name updated');
        setEditing(false);
      } else {
        toast.error(result.message ?? 'Update failed');
      }
    });
  };

  const toggleAdmin = () => {
    startTransition(async () => {
      const result = await setUserAdmin(user.id, !user.isAdmin);
      if (result.success) {
        toast.success(
          user.isAdmin ? 'Admin access removed' : 'Admin access granted'
        );
      } else {
        toast.error(result.message ?? 'Update failed');
      }
    });
  };

  return (
    <tr className="border-b border-border/50 hover:bg-muted/40">
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            aria-hidden
          >
            {initials(user.fullName, user.email)}
          </span>
          <div className="min-w-0">
            {editing ? (
              <span className="flex items-center gap-1">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-7 w-36 rounded-md border bg-background px-2 text-sm"
                  disabled={isPending}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={saveName}
                  disabled={isPending}
                  title="Save name"
                >
                  <Check className="h-3.5 w-3.5 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setName(user.fullName);
                    setEditing(false);
                  }}
                  disabled={isPending}
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium">
                  {user.fullName || '—'}
                </span>
                {user.isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                    <Shield className="h-3 w-3" />
                    <span>Admin</span>
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover/row:opacity-60 hover:!opacity-100 focus-visible:opacity-100"
                  onClick={() => setEditing(true)}
                  title="Edit name"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </span>
            )}
            <span className="block truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>
      </td>
      <td className="py-2.5 pr-4 text-xs text-muted-foreground">
        {user.selectedModel ?? '—'}
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums">
        {compactFormat.format(user.inputTokens + user.outputTokens)}
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
        {`${user.cacheHitRate.toFixed(0)}%`}
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums">
        {numberFormat.format(user.steps)}
      </td>
      <td className="py-2.5 pr-4 text-right tabular-nums font-medium">
        {costFormat.format(user.costUsd)}
      </td>
      <td className="py-2.5 text-right">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={toggleAdmin}
          disabled={isPending || isSelf}
          title={
            isSelf
              ? 'You cannot change your own admin access'
              : user.isAdmin
                ? 'Remove admin access'
                : 'Grant admin access'
          }
        >
          {user.isAdmin ? 'Revoke' : 'Make admin'}
        </Button>
      </td>
    </tr>
  );
}

export function UsersTable({
  users,
  currentUserId
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    : users;

  return (
    <div>
      <div className="relative mb-3 max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm [&_tr]:group/row">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">User</th>
              <th className="py-2 pr-4 font-medium">Model</th>
              <th className="py-2 pr-4 text-right font-medium">Tokens</th>
              <th className="py-2 pr-4 text-right font-medium">Cached</th>
              <th className="py-2 pr-4 text-right font-medium">Steps</th>
              <th className="py-2 pr-4 text-right font-medium">Est. cost</th>
              <th className="py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUserId}
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No users match &quot;{query}&quot;.
          </p>
        )}
      </div>
    </div>
  );
}
