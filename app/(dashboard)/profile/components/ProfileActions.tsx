'use client';

// Client-side buttons for the (server-rendered) profile page that open the
// hash-controlled AI settings modal.
import { Bot, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openAISettings } from '@/app/(dashboard)/components/ai-settings/AISettingsModal';

export function OpenAISettingsButton() {
  return (
    <Button size="sm" variant="outline" onClick={() => openAISettings()}>
      <Bot className="mr-1.5 h-3.5 w-3.5" />
      AI settings
    </Button>
  );
}

export function ManageMemoriesButton() {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 text-xs"
      onClick={() => openAISettings('memories')}
    >
      <Brain className="mr-1 h-3 w-3" />
      Manage
    </Button>
  );
}
