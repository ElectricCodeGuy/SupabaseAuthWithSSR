import 'server-only';
import React from 'react';
import { Stack } from '@mui/material';
import SignInCard from '../SignInCard';
import SignUpCard from '../SignUpCard';
import Content from '../Content';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/client/supabase';

/*
 * The AuthPage component requires a rewrite configuration in next.config.js
 * to handle the case when no slug is provided in the URL. If there is no slug,
 * the rewrite rule will redirect to the default '/auth/signin' route.
 *
 * Add the following rewrite configuration in next.config.js:
 *
 * module.exports = {
 *   async rewrites() {
 *     return [
 *       {
 *         source: '/auth',
 *         destination: '/auth/signin'
 *       }
 *     ];
 *   }
 * };
 */

export default async function AuthPage({
  params
}: {
  params: { slug?: string };
}) {
  const session = await getSession();
  if (session) {
    redirect('/');
  }

  const authState = params.slug || 'signin';

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      sx={{ pt: 4, height: { xs: 'auto', md: '100vh' } }}
    >
      <Stack
        direction={{ xs: 'column-reverse', md: 'row' }}
        justifyContent="center"
        gap={{ xs: 6, sm: 6 }}
        sx={{ height: { xs: '100%', md: '100vh' }, p: 1 }}
      >
        <Content />
        {authState === 'signin' ? (
          <SignInCard />
        ) : authState === 'signup' ? (
          <SignUpCard />
        ) : null}
      </Stack>
    </Stack>
  );
}
