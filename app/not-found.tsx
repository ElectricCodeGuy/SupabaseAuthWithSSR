import { Button } from '@/components/ui/button';
import { FileX, Home } from 'lucide-react';
import Link from '@/components/link';
import NavBar from '@/app/components/layout/Navbar/Header';
import Footer from '@/app/components/layout/Footer/Footer';

// Rendered inside the root layout for any unknown route — fonts, theme and
// providers come from there, so no separate document is needed.
export default function NotFound() {
  return (
    <>
      <NavBar />
      <main className="container max-w-sm mx-auto text-center py-20 md:py-40 min-h-[60vh]">
        <div className="mb-8">
          <FileX className="h-20 w-20 md:h-36 md:w-36 text-primary mx-auto" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Oops! We couldn&apos;t find that page.
        </h2>

        <p className="text-muted-foreground mb-2">
          It looks like the page you&apos;re looking for doesn&apos;t exist or
          has been moved.
        </p>

        <p className="text-sm text-muted-foreground mb-8">
          You can try searching for what you need or go back to the homepage.
        </p>

        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </main>
      <Footer />
    </>
  );
}
