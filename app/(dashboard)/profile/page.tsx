import 'server-only';
import { getUserInfo } from '@/lib/server/supabase';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';

// Import components
import ProfileHeader from './components/ProfileHeader';
import PersonalInfoCard from './components/PersonalInfoCard';
import AchievementsCard from './components/AchievementsCard';
import SkillsCard from './components/SkillsCard';
import ProjectsCard from './components/ProjectsCard';
import ReactionGame from './components/ReactionGame';
import { AnimatedSection } from './components/ProfilePageWrapper';

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
    <div className="min-h-screen py-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <AnimatedSection delay={0}>
          <ProfileHeader userInfo={userInfo} userAttributes={userAttributes} />
        </AnimatedSection>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-4 space-y-6">
            <AnimatedSection delay={0.1} direction="left">
              <PersonalInfoCard
                userInfo={userInfo}
                userAttributes={userAttributes}
              />
            </AnimatedSection>
            <AnimatedSection delay={0.2} direction="left">
              <AchievementsCard achievements={userAttributes.achievements} />
            </AnimatedSection>

            {/* Mini Game */}
            <AnimatedSection delay={0.3} direction="left">
              <ReactionGame />
            </AnimatedSection>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatedSection delay={0.1}>
              <SkillsCard skills={userAttributes.skills} />
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <ProjectsCard projects={userAttributes.projects} />
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}
