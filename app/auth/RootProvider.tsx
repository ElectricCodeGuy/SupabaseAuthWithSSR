'use client';
import { FC, ReactNode } from 'react';
import AuthProvider from './supabase-provider';
import ThemeRegistry from '@/theme/ThemeRegistry';

interface RootProviderProps {
  children: ReactNode;
}

const RootProvider: FC<RootProviderProps> = ({ children }) => {
  return (
    <ThemeRegistry>
      <AuthProvider>{children}</AuthProvider>
    </ThemeRegistry>
  );
};

export default RootProvider;
