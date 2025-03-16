import 'server-only';
import { getUserInfo } from '@/lib/server/supabase';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// Import ShadCN UI components
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Import Lucide icons (ShadCN's preferred icon set)
import {
  Mail as EmailIcon,
  User as PersonIcon,
  MapPin as LocationOnIcon,
  Briefcase as WorkIcon,
  GraduationCap as SchoolIcon,
  Github as GitHubIcon,
  Linkedin as LinkedInIcon,
  Code as CodeIcon,
  Award as EmojiEventsIcon,
  Calendar as CalendarTodayIcon,
  Folder as FolderSpecialIcon,
  Star as StarIcon
} from 'lucide-react';

export default async function ProtectedPage() {
  const userInfo = await getUserInfo();
  if (!userInfo) {
    redirect('/signin');
  }

  // Extended user attributes
  const userAttributes = {
    location: 'New York, USA',
    joinDate: format(new Date(), 'PPP'),
    bio: 'Senior Full Stack Developer with 5+ years of experience. Passionate about creating scalable web applications and mentoring junior developers.',
    position: 'Senior Software Engineer',
    company: 'Tech Innovations Inc.',
    education: 'M.S. Computer Science, Stanford University',
    skills: [
      { name: 'React', level: 90 },
      { name: 'Node.js', level: 85 },
      { name: 'TypeScript', level: 88 },
      { name: 'Python', level: 75 },
      { name: 'AWS', level: 80 }
    ],
    projects: [
      {
        name: 'E-commerce Platform',
        tech: ['React', 'Node.js', 'MongoDB'],
        description:
          'A full-featured e-commerce solution with real-time inventory, payment processing, and admin dashboard.',
        color: '#4CAF50'
      },
      {
        name: 'AI Chat Application',
        tech: ['Python', 'TensorFlow', 'React'],
        description:
          'Intelligent chatbot platform that leverages machine learning to provide natural conversations and support.',
        color: '#2196F3'
      },
      {
        name: 'Portfolio Manager',
        tech: ['TypeScript', 'Next.js', 'PostgreSQL'],
        description:
          'Financial portfolio tracker with real-time data, performance analytics, and investment recommendations.',
        color: '#9C27B0'
      }
    ],
    socialLinks: {
      github: 'https://github.com/username',
      linkedin: 'https://linkedin.com/in/username',
      website: 'https://personal-website.com'
    },
    achievements: [
      'Lead Developer on award-winning fintech project',
      'Published 3 research papers on scalable architecture',
      'Speaker at ReactConf 2023'
    ]
  };

  return (
    <div className="min-h-screen py-6 bg-background">
      <div className="container mx-auto px-4">
        {/* Profile Header Card */}
        <Card className="rounded-2xl shadow-md mb-5 overflow-visible">
          {/* Background Header */}
          <div className="h-[200px] bg-primary/90 rounded-t-2xl relative overflow-hidden">
            {/* Decorative circles */}
            {[
              { size: 80, top: '20%', left: '10%' },
              { size: 120, bottom: '-30px', right: '15%' },
              { size: 50, top: '40%', right: '30%' }
            ].map((circle, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-primary-foreground/10"
                style={{
                  width: circle.size,
                  height: circle.size,
                  top: circle.top,
                  left: circle.left,
                  right: circle.right,
                  bottom: circle.bottom
                }}
              />
            ))}
          </div>

          <CardContent className="pt-0 pb-3 relative z-10">
            <div className="-mt-20 flex flex-col md:flex-row items-center md:items-end mb-3">
              <Avatar className="w-40 h-40 border-[6px] border-background shadow-lg bg-primary text-4xl">
                {userInfo.full_name ? (
                  <AvatarFallback className="text-4xl text-primary-foreground">
                    {userInfo.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className="text-primary-foreground">
                    <PersonIcon size={80} />
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="md:ml-3 mt-2 md:mt-0 text-center md:text-left">
                <h3 className="text-3xl font-bold text-foreground mb-2">
                  {userInfo.full_name}
                </h3>
                <h5 className="text-xl text-foreground flex items-center gap-1">
                  <WorkIcon size={16} className="text-primary" />{' '}
                  {userAttributes.position}
                </h5>
                <p className="text-muted-foreground mt-1 flex items-center gap-1">
                  <CalendarTodayIcon size={16} className="text-primary" />{' '}
                  Joined {userAttributes.joinDate}
                </p>
              </div>

              <div className="md:ml-auto mt-3 md:mt-0 flex gap-1.5 flex-wrap justify-center">
                {[
                  {
                    icon: <LinkedInIcon size={16} />,
                    label: 'LinkedIn',
                    href: userAttributes.socialLinks.linkedin,
                    variant: 'default'
                  },
                  {
                    icon: <GitHubIcon size={16} />,
                    label: 'GitHub',
                    href: userAttributes.socialLinks.github,
                    variant: 'outline'
                  },
                  {
                    icon: <WorkIcon size={16} />,
                    label: 'Portfolio',
                    href: userAttributes.socialLinks.website,
                    variant: 'outline'
                  }
                ].map((link, i) => (
                  <Badge
                    key={i}
                    variant={link.variant === 'outline' ? 'outline' : 'default'}
                    className="px-3 py-2.5 text-sm font-medium rounded-full"
                  >
                    <Link
                      href={link.href}
                      className="flex items-center gap-1.5"
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  </Badge>
                ))}
              </div>
            </div>

            <Separator className="my-3" />

            <p className="max-w-[900px] mx-auto text-center text-lg leading-7 text-muted-foreground italic">
              &quot;{userAttributes.bio}&quot;
            </p>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column */}
          <div className="md:col-span-4">
            {/* Personal Info Card */}
            <Card className="rounded-2xl shadow-md mb-4 overflow-hidden">
              <div className="p-2 bg-primary">
                <h6 className="text-primary-foreground font-semibold flex items-center gap-1">
                  <PersonIcon size={18} /> Personal Information
                </h6>
              </div>

              <CardContent className="pt-3">
                <ul className="p-0">
                  {[
                    {
                      icon: <EmailIcon className="text-primary" size={18} />,
                      primary: 'Email',
                      secondary: userInfo.email
                    },
                    {
                      icon: (
                        <LocationOnIcon className="text-primary" size={18} />
                      ),
                      primary: 'Location',
                      secondary: userAttributes.location
                    },
                    {
                      icon: <WorkIcon className="text-primary" size={18} />,
                      primary: 'Company',
                      secondary: userAttributes.company
                    },
                    {
                      icon: <SchoolIcon className="text-primary" size={18} />,
                      primary: 'Education',
                      secondary: userAttributes.education
                    }
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex px-0 py-1.5">
                        <div className="mr-4 mt-1">{item.icon}</div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {item.primary}
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {item.secondary}
                          </p>
                        </div>
                      </div>
                      {i < 3 && <Separator />}
                    </div>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Achievements Card */}
            <Card className="rounded-2xl shadow-md overflow-hidden">
              <div className="p-2 bg-primary">
                <h6 className="text-primary-foreground font-semibold flex items-center gap-1">
                  <EmojiEventsIcon size={18} /> Achievements & Awards
                </h6>
              </div>

              <CardContent className="pt-3">
                <ul className="p-0">
                  {userAttributes.achievements.map((achievement, index) => (
                    <div key={index}>
                      <div className="flex items-start px-0 py-1.5">
                        <div className="mr-4 mt-1">
                          <StarIcon className="text-amber-400" size={18} />
                        </div>
                        <p className="text-base font-medium text-foreground">
                          {achievement}
                        </p>
                      </div>
                      {index < userAttributes.achievements.length - 1 && (
                        <Separator />
                      )}
                    </div>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="md:col-span-8">
            {/* Skills Card */}
            <Card className="rounded-2xl shadow-md mb-4 overflow-hidden">
              <div className="p-2 bg-primary">
                <h6 className="text-primary-foreground font-semibold flex items-center gap-1">
                  <CodeIcon size={18} /> Technical Skills
                </h6>
              </div>

              <CardContent className="pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userAttributes.skills.map((skill) => (
                    <Card
                      key={skill.name}
                      className="p-2 text-center rounded-xl border border-border/60 h-full flex flex-col items-center justify-center"
                    >
                      <div className="relative inline-flex mb-1">
                        {/* We use hsl with opacity to ensure the colors work in both light and dark modes */}
                        <svg className="w-[90px] h-[90px]" viewBox="0 0 36 36">
                          {/* Background circle */}
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            className="stroke-muted"
                            strokeWidth="2"
                          />
                          {/* Progress circle - we rotate to start from top */}
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            className="stroke-primary"
                            strokeWidth="2"
                            strokeDasharray={`${skill.level} 100`}
                            strokeLinecap="round"
                            style={{
                              transformOrigin: 'center',
                              transform: 'rotate(-90deg)'
                            }}
                          />
                          {/* Circle text */}
                          <text
                            x="18"
                            y="20"
                            textAnchor="middle"
                            className="fill-primary text-lg font-bold"
                            style={{ fontSize: '8px' }}
                          >
                            {skill.level}%
                          </text>
                        </svg>
                      </div>
                      <h6 className="text-xl font-medium text-foreground">
                        {skill.name}
                      </h6>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projects Section */}
            <Card className="rounded-2xl shadow-md overflow-hidden">
              <div className="p-2 bg-primary">
                <h6 className="text-primary-foreground font-semibold flex items-center gap-1">
                  <FolderSpecialIcon size={18} /> Featured Projects
                </h6>
              </div>

              <CardContent className="pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userAttributes.projects.map((project) => (
                    <Card
                      key={project.name}
                      className="rounded-xl shadow-sm h-full flex flex-col overflow-hidden"
                    >
                      <div
                        className="p-1.5 text-white"
                        style={{ backgroundColor: project.color }}
                      >
                        <h6 className="font-bold">{project.name}</h6>
                      </div>
                      <CardContent className="p-3 flex-grow">
                        <p className="mb-2 flex-grow text-foreground">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-0.8">
                          {project.tech.map((tech) => (
                            <Badge
                              key={tech}
                              variant="outline"
                              className="m-0.5 font-medium flex items-center gap-1 opacity-80 hover:opacity-100"
                              style={{
                                backgroundColor: `${project.color}20`,
                                color: project.color,
                                borderColor: `${project.color}40`
                              }}
                            >
                              <CodeIcon size={14} />
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
