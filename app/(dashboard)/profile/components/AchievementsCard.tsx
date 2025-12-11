import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Award as EmojiEventsIcon, Star as StarIcon } from 'lucide-react';

interface AchievementsCardProps {
  achievements: string[];
}

export default function AchievementsCard({
  achievements
}: AchievementsCardProps) {
  return (
    <Card className="rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm bg-card/90 border-primary/10 pt-0">
      <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-600">
        <h6 className="text-white font-semibold flex items-center gap-2">
          <EmojiEventsIcon size={20} /> Achievements & Awards
        </h6>
      </div>

      <CardContent className="pt-4">
        <div className="space-y-4">
          {achievements.map((achievement, index) => (
            <div key={index}>
              <div className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <StarIcon
                  className="text-yellow-500 fill-yellow-500"
                  size={20}
                />
                <p className="text-base font-medium text-foreground flex-1">
                  {achievement}
                </p>
              </div>
              {index < achievements.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
