import { type Metadata } from 'next';
import {
  Brain,
  ChartColumn,
  FileSearch,
  FileText,
  Globe,
  History,
  Lightbulb,
  MessageSquarePlus,
  PanelRight,
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
      'The assistant searches your uploaded PDFs on its own when the question calls for it — or be explicit ("search my documents for…") to trigger it.'
  },
  {
    icon: Globe,
    title: 'Web search',
    description:
      'Real-time web search grounds answers in up-to-date information, with sources you can open.'
  },
  {
    icon: PanelRight,
    title: 'Artifacts',
    description:
      'Ask for a document ("write a checklist / report / draft") and it opens in a side panel, streaming in live — with a full version history when you ask for revisions.'
  },
  {
    icon: ChartColumn,
    title: 'Charts',
    description:
      'Ask for a comparison or trend and the assistant renders an interactive chart — with a data table behind it.'
  },
  {
    icon: FileText,
    title: 'PDF reports',
    description:
      'Ask for a PDF and the assistant writes a polished, styled document straight into your files, ready to preview and download.'
  },
  {
    icon: Brain,
    title: 'Memory',
    description:
      'Say "remember that…" and the assistant keeps it across all your chats. View and edit memories in AI settings.'
  },
  {
    icon: History,
    title: 'Conversation search',
    description:
      'Ask "what did we discuss about…" and the assistant searches your past conversations and links you back to them.'
  },
  {
    icon: Star,
    title: 'Favorites & sharing',
    description:
      'Star a conversation to pin it to the sidebar, or create a public link so others can read it — revoke any time.'
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
