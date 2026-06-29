import { type Metadata } from 'next';
import {
  FileSearch,
  Globe,
  Lightbulb,
  MessageSquarePlus,
  Share2,
  Star
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Guide - Chat settings'
};

const tools = [
  {
    icon: FileSearch,
    title: 'Document search',
    description:
      'Ask the assistant to look things up in the documents you have uploaded. Be explicit ("search my documents for…") to trigger it.'
  },
  {
    icon: Globe,
    title: 'Website search',
    description:
      'The assistant can fetch and read web pages to ground its answers in up-to-date information.'
  },
  {
    icon: Star,
    title: 'Favorites',
    description:
      'Star a conversation from its menu to pin it to the top of the sidebar for quick access.'
  },
  {
    icon: Share2,
    title: 'Sharing',
    description:
      'Create a public link to a conversation so others can read it. Stop sharing at any time to revoke the link.'
  }
];

const tips = [
  {
    title: 'Be specific',
    good: 'Summarise the termination clause in the contract I uploaded.',
    bad: 'Tell me about the contract.'
  },
  {
    title: 'Name your sources',
    good: 'Search my documents and the web, then compare the results.',
    bad: 'What do you know?'
  },
  {
    title: 'Give context',
    good: 'I am preparing for a client meeting tomorrow — draft 3 talking points.',
    bad: 'Help me prepare.'
  }
];

export default function ChatGuidePage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <MessageSquarePlus className="h-5 w-5" />
          What you can do
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tools.map((tool) => (
            <div
              key={tool.title}
              className="rounded-lg border p-4 transition-colors hover:bg-accent/50"
            >
              <div className="mb-2 flex items-center gap-2">
                <tool.icon className="h-4 w-4 text-primary" />
                <h3 className="font-medium">{tool.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Lightbulb className="h-5 w-5" />
          Tips for better answers
        </h2>
        <div className="space-y-3">
          {tips.map((tip) => (
            <div key={tip.title} className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">{tip.title}</h3>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="rounded bg-green-500/10 px-3 py-2 text-green-700 dark:text-green-400">
                  ✓ {tip.good}
                </p>
                <p className="rounded bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-400">
                  ✗ {tip.bad}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
