import React from 'react';
import MemoizedMarkdown from './MemoizedMarkdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

interface ReasoningContentProps {
  details: any[];
  messageId: string;
}

const ReasoningContent: React.FC<ReasoningContentProps> = ({
  details,
  messageId
}) => {
  // Extract text from details
  const reasoningText = details
    ?.map((detail) => (detail.type === 'text' ? detail.text : '<redacted>'))
    .join('');

  return (
    <div className="mt-4 pt-2 border-t border-border/40">
      <Accordion
        type="single"
        defaultValue="reasoning"
        collapsible
        className="w-full"
      >
        <AccordionItem
          value="reasoning"
          className="bg-background/40 rounded-lg overflow-hidden border border-border shadow-sm"
        >
          <AccordionTrigger className="font-bold text-foreground/80 hover:text-foreground py-2 px-3 cursor-pointer">
            Reasoning
          </AccordionTrigger>
          <AccordionContent className="bg-muted/50 p-3 text-sm text-foreground/90 overflow-x-auto max-h-[300px] overflow-y-auto border-t border-border/40">
            <MemoizedMarkdown
              content={reasoningText}
              id={`reasoning-${messageId}`}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ReasoningContent;
