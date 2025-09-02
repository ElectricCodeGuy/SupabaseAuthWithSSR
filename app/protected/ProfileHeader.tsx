'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  User as PersonIcon,
  Briefcase as WorkIcon,
  Github as GitHubIcon,
  Linkedin as LinkedInIcon,
  Code as CodeIcon,
  Calendar as CalendarTodayIcon,
  Sparkles
} from 'lucide-react';

interface ProfileHeaderProps {
  userInfo: any;
  userAttributes: any;
}

export default function ProfileHeader({
  userInfo,
  userAttributes
}: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="rounded-3xl shadow-xl mb-8 overflow-visible backdrop-blur-sm bg-card/90 border-primary/10 pt-0">
        {/* Animated Background Header */}
        <div className="h-[240px] relative rounded-t-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-purple-600">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 animate-pulse" />

            {/* Floating shapes */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/10 backdrop-blur-md"
                style={{
                  width: Math.random() * 100 + 50,
                  height: Math.random() * 100 + 50,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
                animate={{
                  y: [0, -20, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 5 + Math.random() * 5,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        </div>

        <CardContent className="pt-0 pb-6 relative z-10">
          <div className="-mt-24 flex flex-col md:flex-row items-center md:items-end mb-6 gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Avatar className="w-48 h-48 border-[8px] border-background shadow-2xl bg-gradient-to-br from-primary to-purple-600 text-5xl">
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
            </motion.div>

            <div className="flex-1 text-center md:text-left">
              <motion.h1
                className="text-4xl font-bold text-foreground mb-2 flex items-center gap-2 justify-center md:justify-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {userInfo.full_name}
                <Sparkles className="text-primary" size={24} />
              </motion.h1>
              <motion.p
                className="text-xl text-muted-foreground flex items-center gap-2 justify-center md:justify-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <WorkIcon size={18} className="text-primary" />
                {userAttributes.position} at {userAttributes.company}
              </motion.p>
              <motion.p
                className="text-sm text-muted-foreground mt-2 flex items-center gap-2 justify-center md:justify-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <CalendarTodayIcon size={16} className="text-primary" />
                Member since {userAttributes.joinDate}
              </motion.p>
            </div>

            <motion.div
              className="flex gap-3 flex-wrap justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[
                {
                  icon: <LinkedInIcon size={18} />,
                  label: 'LinkedIn',
                  href: userAttributes.socialLinks.linkedin,
                  color: 'bg-blue-600 hover:bg-blue-700 text-white'
                },
                {
                  icon: <GitHubIcon size={18} />,
                  label: 'GitHub',
                  href: userAttributes.socialLinks.github,
                  color: 'bg-gray-800 hover:bg-gray-900 text-white'
                },
                {
                  icon: <CodeIcon size={18} />,
                  label: 'Portfolio',
                  href: userAttributes.socialLinks.website,
                  color:
                    'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white'
                }
              ].map((link, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    asChild
                    className={`${link.color} rounded-full shadow-lg`}
                  >
                    <Link href={link.href} className="flex items-center gap-2">
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <Separator className="my-6" />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <p className="max-w-4xl mx-auto text-lg leading-relaxed text-muted-foreground italic">
              &quot;{userAttributes.bio}&quot;
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
