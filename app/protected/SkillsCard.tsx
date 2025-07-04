'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Code as CodeIcon } from 'lucide-react';

interface SkillsCardProps {
  skills: { name: string; level: number }[];
}

export default function SkillsCard({ skills }: SkillsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm bg-card/90 border-primary/10">
        <div className="p-4 bg-gradient-to-r from-primary to-purple-600">
          <h6 className="text-white font-semibold flex items-center gap-2">
            <CodeIcon size={20} /> Technical Skills
          </h6>
        </div>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill, index) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <Card className="p-6 text-center rounded-2xl border-2 border-border/50 hover:border-primary/50 transition-all duration-300 h-full backdrop-blur-sm bg-card/50">
                  <div className="relative inline-flex mb-3">
                    <svg className="w-24 h-24" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        className="stroke-muted"
                        strokeWidth="2"
                      />
                      <motion.circle
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
                        initial={{ strokeDasharray: '0 100' }}
                        animate={{ strokeDasharray: `${skill.level} 100` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      />
                      <text
                        x="18"
                        y="22"
                        textAnchor="middle"
                        className="fill-primary text-xl font-bold"
                        style={{ fontSize: '8px' }}
                      >
                        {skill.level}%
                      </text>
                    </svg>
                  </div>
                  <h6 className="text-lg font-semibold text-foreground">
                    {skill.name}
                  </h6>
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-600/5 opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
