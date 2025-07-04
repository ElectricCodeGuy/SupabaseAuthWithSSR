'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Award as EmojiEventsIcon, Star as StarIcon } from 'lucide-react';

interface AchievementsCardProps {
  achievements: string[];
}

export default function AchievementsCard({
  achievements
}: AchievementsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm bg-card/90 border-primary/10">
        <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-600">
          <h6 className="text-white font-semibold flex items-center gap-2">
            <EmojiEventsIcon size={20} /> Achievements & Awards
          </h6>
        </div>

        <CardContent className="pt-4">
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.5
                    }}
                  >
                    <StarIcon
                      className="text-yellow-500 fill-yellow-500"
                      size={20}
                    />
                  </motion.div>
                  <p className="text-base font-medium text-foreground flex-1">
                    {achievement}
                  </p>
                </div>
                {index < achievements.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
