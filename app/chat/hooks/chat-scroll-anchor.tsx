'use client';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface ChatScrollAnchorProps {
  trackVisibility?: boolean;
  status: 'error' | 'submitted' | 'streaming' | 'ready';
}

export function ChatScrollAnchor({
  trackVisibility,
  status
}: ChatScrollAnchorProps) {
  const [isAtBottom, setIsAtBottom] = useState(false);

  const { ref, entry, inView } = useInView({
    trackVisibility,
    delay: 100,
    rootMargin: '0px 0px -50px 0px'
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsAtBottom(
        window.innerHeight + window.scrollY >= document.body.offsetHeight
      );
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Only auto-scroll if status is "submitted" or "streaming"
    const shouldAutoScroll = status === 'submitted' || status === 'streaming';

    if (isAtBottom && trackVisibility && !inView && shouldAutoScroll) {
      entry?.target.scrollIntoView({
        block: 'start'
      });
    }
  }, [inView, entry, isAtBottom, trackVisibility, status]);

  return (
    <div
      ref={ref}
      style={{
        height: '8px',
        width: '100%'
      }}
    />
  );
}
