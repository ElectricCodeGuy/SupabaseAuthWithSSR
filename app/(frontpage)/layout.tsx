import { type ReactNode } from 'react';
import Footer from '@/app/(frontpage)/components/ui/Footer/Footer';
import NavBar from '@/app/(frontpage)/components/ui/Navbar/Header';

export default async function RootLayout({
  children,
  modal
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <>
      <NavBar />
      <main>{children}</main>
      {modal}
      <Footer />
    </>
  );
}
