import React from 'react';
import { AI } from './action';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AI>{children}</AI>;
}
