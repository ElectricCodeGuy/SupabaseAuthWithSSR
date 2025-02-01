'use client';

import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface ChatScrollAnchorProps {
  trackVisibility?: boolean;
}

export function ChatScrollAnchor({ trackVisibility }: ChatScrollAnchorProps) {
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
    if (isAtBottom && trackVisibility && !inView) {
      entry?.target.scrollIntoView({
        block: 'start'
      });
    }
  }, [inView, entry, isAtBottom, trackVisibility]);

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
