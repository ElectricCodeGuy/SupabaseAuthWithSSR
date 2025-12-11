import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  User as PersonIcon,
  Briefcase as WorkIcon,
  Github as GitHubIcon,
  Linkedin as LinkedInIcon,
  Code as CodeIcon,
  Calendar as CalendarTodayIcon,
  Sparkles
} from 'lucide-react';
import { FloatingShapes } from './FloatingShapes';

interface ProfileHeaderProps {
  userInfo: { full_name: string };
  userAttributes: {
    position: string;
    company: string;
    joinDate: string;
    bio: string;
    socialLinks: {
      github: string;
      linkedin: string;
      website: string;
    };
  };
}

export default function ProfileHeader({
  userInfo,
  userAttributes
}: ProfileHeaderProps) {
  return (
    <Card className="rounded-3xl shadow-xl mb-8 overflow-visible backdrop-blur-sm bg-card/90 border-primary/10 pt-0">
      {/* Animated Background Header */}
      <div className="h-[240px] relative rounded-t-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-purple-600">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 animate-pulse" />

          {/* Floating shapes - client component */}
          <FloatingShapes />
        </div>
      </div>

      <CardContent className="pt-0 pb-6 relative z-10">
        <div className="-mt-24 flex flex-col md:flex-row items-center md:items-end mb-6 gap-6">
          <Avatar className="w-48 h-48 border-[8px] border-background shadow-2xl bg-gradient-to-br from-primary to-purple-600 text-5xl hover:scale-105 transition-transform">
            {userInfo.full_name ? (
              <AvatarFallback className="text-5xl text-white font-bold">
                {userInfo.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            ) : (
              <AvatarFallback className="text-white">
                <PersonIcon size={80} />
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-2 justify-center md:justify-start">
              {userInfo.full_name}
              <Sparkles className="text-primary" size={24} />
            </h1>
            <p className="text-xl text-muted-foreground flex items-center gap-2 justify-center md:justify-start">
              <WorkIcon size={18} className="text-primary" />
              {userAttributes.position} at {userAttributes.company}
            </p>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2 justify-center md:justify-start">
              <CalendarTodayIcon size={16} className="text-primary" />
              Member since {userAttributes.joinDate}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              <Link
                href={userAttributes.socialLinks.linkedin}
                className="flex items-center gap-2"
              >
                <LinkedInIcon size={18} />
                <span>LinkedIn</span>
              </Link>
            </Button>
            <Button
              asChild
              className="bg-gray-800 hover:bg-gray-900 text-white rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              <Link
                href={userAttributes.socialLinks.github}
                className="flex items-center gap-2"
              >
                <GitHubIcon size={18} />
                <span>GitHub</span>
              </Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              <Link
                href={userAttributes.socialLinks.website}
                className="flex items-center gap-2"
              >
                <CodeIcon size={18} />
                <span>Portfolio</span>
              </Link>
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="text-center">
          <p className="max-w-4xl mx-auto text-lg leading-relaxed text-muted-foreground italic">
            &quot;{userAttributes.bio}&quot;
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
