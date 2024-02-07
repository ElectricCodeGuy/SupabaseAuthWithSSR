import React, { ReactNode } from 'react';
import SideBarServer from '@/app/components/ui/Navbar/SideBarServer';
import Footer from '@/app/components/ui/Footer/Footer';
import ThemeRegistry from '@/theme/ThemeRegistry';
import Box from '@mui/material/Box';
import RootErrorBoundary from '@/app/components/errorBoundary/ErrorBoundaryPage';
interface RootLayoutProps {
  children: ReactNode;
}
export const metadata = {
  metadataBase: new URL('http://localhost:3000/'),
  title: 'Supabase SSR Auth Example',
  description:
    'An example demonstrating server-side rendering with authentication using Supabase.'
};

// RootLayout.tsx
const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <ThemeRegistry>
        <RootErrorBoundary>
          <body
            style={{
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh'
            }}
          >
            <SideBarServer />
            <Box sx={{ flexGrow: 1 }}>{children}</Box>
            <Footer />
          </body>
        </RootErrorBoundary>
      </ThemeRegistry>
    </html>
  );
};

export default RootLayout;
