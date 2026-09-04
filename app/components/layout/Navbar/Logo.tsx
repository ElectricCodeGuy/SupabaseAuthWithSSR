// Brand logo — a chat bubble with an AI sparkle, plus a text wordmark.
// The mark is drawn entirely from theme tokens (--primary/--primary-foreground)
// and the wordmark is real text, so the whole logo re-themes with globals.css
// and adapts to dark mode without any asset changes.
export default function Logo({
  withWordmark = true,
  className
}: {
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <svg
        width={28}
        height={28}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Speech bubble with a tail at the bottom-left */}
        <path
          d="M8 3h16a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5h-8.5L10 28.5V23H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Z"
          fill="var(--primary)"
        />
        {/* Four-point AI sparkle */}
        <path
          d="M16 6.6c.94 3.3 2.1 4.96 5.8 6.2-3.7 1.24-4.86 2.9-5.8 6.2-.94-3.3-2.1-4.96-5.8-6.2 3.7-1.24 4.86-2.9 5.8-6.2Z"
          fill="var(--primary-foreground)"
        />
        {/* Small companion star, top-right of the sparkle */}
        <path
          d="M23 5.4c.4 1.4.9 2.1 2.5 2.6-1.6.5-2.1 1.2-2.5 2.6-.4-1.4-.9-2.1-2.5-2.6 1.6-.5 2.1-1.2 2.5-2.6Z"
          fill="var(--primary-foreground)"
          opacity={0.75}
        />
      </svg>
      {withWordmark && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          <span>Supa</span>
          <span className="text-primary">Chat</span>
        </span>
      )}
    </span>
  );
}
