import { Card, CardContent } from '@/components/ui/card';
import { Code as CodeIcon } from 'lucide-react';

interface SkillsCardProps {
  skills: { name: string; level: number }[];
}

export default function SkillsCard({ skills }: SkillsCardProps) {
  return (
    <Card className="rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm bg-card/90 border-primary/10 pt-0">
      <div className="p-4 bg-gradient-to-r from-primary to-purple-600">
        <h6 className="text-white font-semibold flex items-center gap-2">
          <CodeIcon size={20} /> Technical Skills
        </h6>
      </div>

      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <div key={skill.name} className="relative group">
              <Card className="p-6 text-center rounded-2xl border-2 border-border/50 hover:border-primary/50 transition-all duration-300 h-full backdrop-blur-sm bg-card/50 hover:scale-105">
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
              </Card>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
