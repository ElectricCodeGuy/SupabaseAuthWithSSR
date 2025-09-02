// app/chat/components/tools/Reasoning.tsx
import React from 'react';
import MemoizedMarkdown from './MemoizedMarkdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import type { ReasoningUIPart } from 'ai';

interface ReasoningContentProps {
  details: ReasoningUIPart;
  messageId: string;
}

const ReasoningContent: React.FC<ReasoningContentProps> = ({
  details,
  messageId
}) => {
  return (
    <Accordion type="single" collapsible className="w-full mb-4">
      <AccordionItem
        value="reasoning"
        className="bg-background/40 rounded-lg overflow-hidden border border-border shadow-sm"
      >
        <AccordionTrigger className="font-bold text-foreground/80 hover:text-foreground py-2 px-3 cursor-pointer">
          Reasoning
        </AccordionTrigger>
        <AccordionContent className="bg-muted/50 p-3 text-sm text-foreground/90 overflow-x-auto max-h-[300px] overflow-y-auto border-t border-border/40">
          <div className="reasoning-content">
            <MemoizedMarkdown
              content={details.text}
              id={`reasoning-${messageId}`}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ReasoningContent;
