'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Folder as FolderSpecialIcon,
  Code as CodeIcon,
  ExternalLink
} from 'lucide-react';

interface ProjectsCardProps {
  projects: {
    name: string;
    tech: string[];
    description: string;
    color: string;
  }[];
}

export default function ProjectsCard({ projects }: ProjectsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm bg-card/90 border-primary/10">
        <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600">
          <h6 className="text-white font-semibold flex items-center gap-2">
            <FolderSpecialIcon size={20} /> Featured Projects
          </h6>
        </div>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="rounded-2xl shadow-md h-full flex flex-col overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300">
                  <div
                    className="p-4 text-white relative overflow-hidden"
                    style={{ backgroundColor: project.color }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/10"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.5 }}
                    />
                    <h6 className="font-bold text-lg flex items-center justify-between relative z-10">
                      {project.name}
                      <ExternalLink
                        size={18}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </h6>
                  </div>
                  <CardContent className="p-5 flex-grow flex flex-col">
                    <p className="mb-4 flex-grow text-foreground leading-relaxed">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech) => (
                        <Badge
                          key={tech}
                          variant="outline"
                          className="rounded-full font-medium flex items-center gap-1 hover:scale-105 transition-transform"
                          style={{
                            backgroundColor: `${project.color}15`,
                            color: project.color,
                            borderColor: `${project.color}40`
                          }}
                        >
                          <CodeIcon size={12} />
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
