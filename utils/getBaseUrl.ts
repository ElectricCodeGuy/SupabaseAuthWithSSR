import { TZDate } from '@date-fns/tz';

export function getBaseUrl(): string {
  let baseUrl =
    process?.env?.NEXT_PUBLIC_SITE_URL &&
    process.env.NEXT_PUBLIC_SITE_URL.trim() !== ''
      ? process.env.NEXT_PUBLIC_SITE_URL
      : process?.env?.NEXT_PUBLIC_VERCEL_URL &&
          process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ''
        ? process.env.NEXT_PUBLIC_VERCEL_URL
        : 'http://localhost:3000';

  if (!baseUrl.endsWith('/')) {
    baseUrl += '/';
  }

  return baseUrl;
}

export function getCurrentDate() {
  const now = new TZDate(new Date(), 'Europe/Copenhagen');
  return now;
}
