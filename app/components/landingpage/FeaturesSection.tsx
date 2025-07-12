'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Zap, Code2, Cloud, Sparkles, Layers } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'Bank-level encryption and security protocols to keep your data safe.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized performance with edge computing and global CDN.',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Code2,
    title: 'Developer First',
    description: 'Beautiful APIs, comprehensive docs, and amazing DX.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Cloud,
    title: 'Cloud Native',
    description:
      'Built for scale with automatic backups and disaster recovery.',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Sparkles,
    title: 'AI Powered',
    description: 'Smart features powered by cutting-edge machine learning.',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    icon: Layers,
    title: 'Composable',
    description: 'Modular architecture that grows with your needs.',
    gradient: 'from-pink-500 to-rose-500'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Powerful Features for Modern Apps
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to build, deploy, and scale your applications
            with confidence.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={item}>
                <Card className="group h-full backdrop-blur-sm bg-background/50 border-muted hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
                  <CardContent className="p-8">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} p-3 mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
