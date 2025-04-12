import React from 'react';
import MemoizedMarkdown from './MemoizedMarkdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import type { ReasoningUIPart } from '@ai-sdk/ui-utils';

interface ReasoningContentProps {
  details: ReasoningUIPart['details'];
  messageId: string;
}

const ReasoningContent: React.FC<ReasoningContentProps> = ({
  details,
  messageId
}) => {
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
            <div className="reasoning-content">
              {details.map((detail, index) => (
                <React.Fragment key={index}>
                  {detail.type === 'text' ? (
                    <div>
                      <MemoizedMarkdown
                        content={detail.text}
                        id={`reasoning-${messageId}-${index}`}
                      />
                    </div>
                  ) : (
                    <div className="p-2 my-1 bg-muted/80 border border-border/60 rounded text-muted-foreground italic">
                      <span className="font-semibold">Redacted content</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ReasoningContent;
