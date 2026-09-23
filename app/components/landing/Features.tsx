import {
  Brain,
  ChartColumn,
  FileSearch,
  FileText,
  Globe,
  ImageIcon,
  PanelRight
} from 'lucide-react';

// Every feature here actually exists in this codebase — no filler.
const features = [
  {
    icon: FileSearch,
    title: 'Chat with your documents',
    description:
      'Upload PDFs, OCR them with Mistral, and let the AI search them autonomously — hybrid vector + keyword retrieval with page-level citations.'
  },
  {
    icon: PanelRight,
    title: 'Artifacts workspace',
    description:
      'Documents draft live in a side panel with streaming text, full version history, and one-click export — the canvas pattern, built in.'
  },
  {
    icon: Brain,
    title: 'Long-term memory',
    description:
      'Ask the assistant to remember things and it persists across every conversation — with a settings surface to review, edit, and delete what it knows.'
  },
  {
    icon: ChartColumn,
    title: 'Interactive visualizations',
    description:
      'The AI builds charts, dashboards, diagrams and small interactive tools from real conversation data — rendered in a sandboxed iframe, inline or in the side panel.'
  },
  {
    icon: FileText,
    title: 'PDF generation',
    description:
      'One-shot polished PDFs — style templates, cover pages, tables of contents, callouts — saved straight to the user’s file library.'
  },
  {
    icon: Globe,
    title: 'Web search built in',
    description:
      'Exa-powered search with relevance-ranked highlights, inline source citations, and links that open where they should: in a new tab.'
  },
  {
    icon: ImageIcon,
    title: 'Image generation',
    description:
      'Text-to-image on your own GPU with Qwen-Image-2.1 — any aspect ratio, transparent backgrounds, compressed to WebP with sharp and stored right in Postgres.'
  }
];

export function Features() {
  return (
    <section id="features" className="border-b bg-muted/20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            A complete AI tool suite, wired end to end
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Every tool ships with its server definition, typed UI component,
            and persistence — the full pattern, not a demo stub.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            // Odd count (7): the last card spans the final row at both
            // breakpoints, so the bg-border gaps never show as empty cells.
            <div
              key={title}
              className="bg-card p-6 sm:p-7 sm:last:col-span-2 lg:last:col-span-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
