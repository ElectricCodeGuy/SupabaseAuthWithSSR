import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Mail as EmailIcon,
  User as PersonIcon,
  MapPin as LocationOnIcon,
  Briefcase as WorkIcon,
  GraduationCap as SchoolIcon
} from 'lucide-react';

interface PersonalInfoCardProps {
  userInfo: { email: string };
  userAttributes: {
    location: string;
    company: string;
    education: string;
  };
}

export default function PersonalInfoCard({
  userInfo,
  userAttributes
}: PersonalInfoCardProps) {
  const infoItems = [
    {
      icon: <EmailIcon className="text-primary" size={20} />,
      primary: 'Email',
      secondary: userInfo.email
    },
    {
      icon: <LocationOnIcon className="text-primary" size={20} />,
      primary: 'Location',
      secondary: userAttributes.location
    },
    {
      icon: <WorkIcon className="text-primary" size={20} />,
      primary: 'Company',
      secondary: userAttributes.company
    },
    {
      icon: <SchoolIcon className="text-primary" size={20} />,
      primary: 'Education',
      secondary: userAttributes.education
    }
  ];

  return (
    <Card className="rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm bg-card/90 border-primary/10 pt-0">
      <div className="p-4 bg-gradient-to-r from-primary to-purple-600">
        <h6 className="text-white font-semibold flex items-center gap-2">
          <PersonIcon size={20} /> Personal Information
        </h6>
      </div>

      <CardContent className="pt-4">
        <div className="space-y-4">
          {infoItems.map((item, i) => (
            <div key={i}>
              <div className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="mt-1">{item.icon}</div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{item.primary}</p>
                  <p className="text-base font-semibold text-foreground">
                    {item.secondary}
                  </p>
                </div>
              </div>
              {i < infoItems.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
