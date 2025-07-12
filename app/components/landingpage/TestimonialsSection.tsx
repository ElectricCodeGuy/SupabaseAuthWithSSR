'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'CTO at TechStart',
    content:
      'This platform transformed how we build and deploy applications. The developer experience is unmatched.',
    rating: 5
  },
  {
    name: 'Marcus Johnson',
    role: 'Lead Developer',
    content:
      'The real-time features and authentication system saved us months of development time.',
    rating: 5
  },
  {
    name: 'Elena Rodriguez',
    role: 'Product Manager',
    content:
      'Our team productivity increased by 3x after adopting this solution. Absolutely game-changing.',
    rating: 5
  },
  {
    name: 'David Kim',
    role: 'Startup Founder',
    content:
      'From prototype to production in weeks, not months. This is the future of web development.',
    rating: 5
  },
  {
    name: 'Lisa Wang',
    role: 'Engineering Manager',
    content:
      'The scalability and performance are incredible. We handle millions of requests without breaking a sweat.',
    rating: 5
  },
  {
    name: 'Alex Turner',
    role: 'Full Stack Developer',
    content:
      "Best developer experience I've had. The documentation is comprehensive and the APIs are intuitive.",
    rating: 5
  }
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Loved by Developers
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of teams building amazing products
          </p>
        </motion.div>

        {/* Scrolling Testimonials */}
        <div className="relative">
          <div className="flex overflow-hidden space-x-8">
            <motion.div
              animate={{
                x: [0, -2000]
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 30,
                  ease: 'linear'
                }
              }}
              className="flex space-x-8"
            >
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <Card
                  key={index}
                  className="w-[400px] flex-shrink-0 backdrop-blur-sm bg-background/50"
                >
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-500 text-yellow-500"
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">
                      &quot;{testimonial.content}&quot;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-purple-500" />
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </div>

          {/* Gradient Overlays */}
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-background to-transparent z-10" />
        </div>
      </div>
    </section>
  );
};
