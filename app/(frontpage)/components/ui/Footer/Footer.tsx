'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Linkedin, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  const pathname = usePathname();

  // If the current pathname is '/chat'  do not render the component
  if (pathname === '/chat' || /^\/chat\/[^/]+$/.test(pathname)) {
    return null;
  }

  return (
    <footer className="bg-gray-800 text-white mt-auto pt-4">
      <div className="max-w-[1600px] mx-auto px-4 flex flex-wrap justify-center items-start gap-4">
        {/* Contact Section */}
        <div className="w-[48%] sm:w-[48%] md:w-[21%] lg:w-[21%] xl:w-[30%] flex flex-col gap-3 p-0">
          <h5 className="text-xl font-bold">Contact</h5>
          <p className="text-sm text-white">Example Company Name</p>
          <p className="text-sm text-white">123 Example Street, City 12345</p>
          <p className="text-sm text-white mb-1">ID: 12345678</p>
          <Link href="#" className="text-sky-300 hover:text-sky-200">
            Privacy Policy
          </Link>
          <Link href="#" className="text-sky-300 hover:text-sky-200">
            Terms of Service
          </Link>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block">
          <div className="h-auto w-px bg-white" />
        </div>

        {/* Information Section */}
        <div className="w-[42%] sm:w-[42%] md:w-[23%] lg:w-[23%] xl:w-[23%] flex flex-col gap-3 p-0">
          <h5 className="text-xl font-bold">Information:</h5>
          <Link href="#" className="text-sky-300 hover:text-sky-200">
            About Us
          </Link>
          <Link href="#" className="text-sky-300 hover:text-sky-200">
            Services
          </Link>
          <Link href="#" className="text-sky-300 hover:text-sky-200">
            FAQ
          </Link>
          <Link href="#" className="text-sky-300 hover:text-sky-200">
            How It Works
          </Link>
          <Link href="#" className="text-sky-300 hover:text-sky-200">
            Support
          </Link>
        </div>

        {/* Horizontal Divider for Mobile */}
        <div className="w-full block sm:block md:hidden">
          <Separator className="bg-white my-2" />
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block">
          <div className="h-auto w-px bg-white" />
        </div>

        {/* Newsletter Section */}
        <div className="w-full sm:w-full md:w-[41%] lg:w-[41%] xl:w-[41%] flex flex-col gap-3 px-1">
          <h5 className="text-xl font-bold">Subscribe to Our Newsletter</h5>
          <p className="text-base text-white">
            📧 Regular updates about our services
          </p>
          <p className="text-base text-white">
            🔔 Special offers and promotions
          </p>
          <p className="text-base text-white">💼 Industry news and insights</p>

          <Button
            className="mt-4 max-w-[200px] self-center md:self-start"
            asChild
          >
            <Link href="#">Subscribe Now</Link>
          </Button>
        </div>
      </div>

      <Separator className="mt-4 bg-white max-w-[1580px] mx-auto" />

      <div className="max-w-[1600px] mx-auto px-4 flex justify-between items-center py-2">
        <div className="flex-grow">
          <Link href="#" className="text-white hover:text-gray-200">
            Example Company &copy; {new Date().getFullYear()}
          </Link>
        </div>
        <div className="flex items-center">
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/10"
            asChild
          >
            <Link href="#" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/10"
            asChild
          >
            <Link href="#" aria-label="YouTube">
              <Youtube className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
