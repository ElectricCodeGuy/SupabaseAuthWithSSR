import Link from 'next/link';
import type { ComponentProps } from 'react';

// Drop-in replacement for `next/link` with prefetching disabled by default.
//
// Why this exists: Next.js prefetches every <Link> in the viewport automatically.
// On an app with many links that means a flood of background requests, and since
// each prefetch renders the target route on the server, it drives up serverless
// invocations/compute and can lead to surprisingly expensive bills. The default
// prefetch behavior also tends to be buggy (stale/over-eager fetches).
//
// Rather than remember to pass `prefetch={false}` on every single link, we import
// THIS component as our Link everywhere. Prefetch is off by default here, but you
// can still opt back in per-link by passing `prefetch` explicitly (it's spread
// after, so `<PrefetchLink prefetch href=... />` re-enables it for that one link).
export default function PrefetchLink(props: ComponentProps<typeof Link>) {
  return <Link prefetch={false} {...props} />;
}
