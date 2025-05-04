import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface SourceViewProps {
  source: {
    url?: string;
  };
}

const SourceView: React.FC<SourceViewProps> = ({ source }) => {
  if (!source.url) return null;

  return (
    <div className="mt-4 pt-2 border-t border-border/40">
      <h6 className="font-bold text-foreground/80">Sources:</h6>
      <ul className="space-y-1 mt-2">
        <li className="py-0.5">
          <Link
            href={`?url=${encodeURIComponent(source.url)}`}
            scroll={false}
            prefetch={false}
            className="text-sm text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/100 transition-colors inline-flex items-center gap-0.5 px-2 py-1 rounded-md hover:bg-primary/5"
          >
            <ExternalLink size={14} className="mr-1 flex-shrink-0" />
            <span className="break-all">{source.url}</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default SourceView;
