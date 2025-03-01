import React, { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Code, Cloud, Code2 } from 'lucide-react';
import { type User } from '@supabase/supabase-js';
import FrontPageImage from '@/public/images/imageauth.jpg';

interface BannerProps {
  session: Promise<User | null>;
}

interface FeatureProps {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ Icon, title, description }) => (
  <div className="flex items-center gap-3 mb-4">
    <Icon className="h-5 w-5 text-secondary" />
    <div>
      <h6 className="font-bold">{title}</h6>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const BannerComponent: React.FC<BannerProps> = ({ session }) => {
  const userSession = use(session);
  const isSessionAvailable = userSession !== null;
  const userEmail = userSession?.email;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 bg-muted/50">
      {/* Image Grid */}
      <div className="md:col-span-8 h-[600px] hidden md:block overflow-hidden rounded-xl">
        <Image
          src={FrontPageImage}
          priority
          alt="Background"
          className="object-cover object-center w-full h-full"
        />
      </div>

      <div className="md:col-span-4">
        <h4 className="text-primary font-bold text-2xl mb-3">
          {isSessionAvailable
            ? `Welcome back, ${userEmail ?? 'User'}!`
            : 'Empower Your Next.js App with Supabase Auth'}
        </h4>
        <p className="mb-6 text-muted-foreground">
          {isSessionAvailable
            ? 'Dive into the enhanced features and capabilities tailored for your development.'
            : 'Our library seamlessly integrates with Next.js 14, offering server-side rendering support and efficient data fetching with React Server Components.'}
        </p>

        <div className="space-y-4 mb-6">
          <Feature
            Icon={Shield}
            title="Enhanced Security"
            description="State-of-the-art security for your apps."
          />
          <Feature
            Icon={Zap}
            title="Blazing Fast"
            description="Optimized for speed, making your apps run smoother."
          />
          <Feature
            Icon={Code}
            title="Developer Friendly"
            description="Easy to use API and thorough documentation."
          />
          <Feature
            Icon={Cloud}
            title="Cloud Integration"
            description="Seamless cloud capabilities with Supabase."
          />
          <Feature
            Icon={Code2}
            title="Easy Integration"
            description="Simple steps to integrate with your Next.js app."
          />
        </div>

        <Button asChild size="lg" className="mt-2">
          <Link href={isSessionAvailable ? '/dashboard' : '#get-started'}>
            {isSessionAvailable ? 'Explore Dashboard' : 'Get Started Now'}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default BannerComponent;
