'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, Globe, Cpu } from 'lucide-react';
import Link from 'next/link';

export const BentoGrid: React.FC = () => {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {/* Large Feature Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="md:col-span-2 md:row-span-2"
          >
            <Card className="h-full overflow-hidden backdrop-blur-sm bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
              <CardContent className="p-8 h-full flex flex-col justify-between">
                <div>
                  <BarChart3 className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-3xl font-bold mb-4">
                    Real-time Analytics
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Get instant insights with our powerful analytics dashboard.
                    Track user behavior, monitor performance, and make
                    data-driven decisions.
                  </p>
                </div>
                <Button asChild className="w-fit group">
                  <Link href="#analytics">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Medium Feature Cards */}
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="h-full backdrop-blur-sm bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-6">
                <Users className="w-10 h-10 text-green-500 mb-3" />
                <h4 className="text-xl font-bold mb-2">Team Collaboration</h4>
                <p className="text-muted-foreground text-sm">
                  Work together seamlessly with real-time sync and collaboration
                  tools.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="h-full backdrop-blur-sm bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-6">
                <Globe className="w-10 h-10 text-blue-500 mb-3" />
                <h4 className="text-xl font-bold mb-2">Global CDN</h4>
                <p className="text-muted-foreground text-sm">
                  Lightning-fast content delivery across 200+ edge locations
                  worldwide.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wide Feature Card */}
          <motion.div whileHover={{ scale: 1.02 }} className="md:col-span-2">
            <Card className="h-full overflow-hidden backdrop-blur-sm bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <Cpu className="w-10 h-10 text-orange-500 mb-3" />
                    <h4 className="text-2xl font-bold mb-2">
                      AI-Powered Automation
                    </h4>
                    <p className="text-muted-foreground">
                      Automate repetitive tasks and workflows with our
                      intelligent AI engine.
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-orange-500 to-red-500 opacity-20 blur-3xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
