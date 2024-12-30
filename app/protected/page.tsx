import 'server-only';
import { getUserInfo } from '@/lib/server/supabase';
import {
  Typography,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoIcon from '@mui/icons-material/Info';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const userInfo = await getUserInfo();
  if (!userInfo) {
    redirect('/auth/signin');
  }

  // Hypothetical user attributes (example)
  // In a real application, this information would be retrieved from a Supabase schema
  // along with other user details. Here, it's included as a static example.
  const userAttributes = {
    location: 'New York, USA',
    joinDate: format(new Date(), 'MMMM d, yyyy'),
    bio: 'Developer with a passion for web technologies and open source. Loves exploring new techniques and collaborating on global projects.'
  };

  return (
    <Card
      sx={{
        maxWidth: 600,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        mt: 'auto',
        mx: 'auto',
        borderRadius: 1
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Avatar
          sx={{ bgcolor: 'secondary.main', mb: 2, width: 56, height: 56 }}
        >
          <PersonIcon />
        </Avatar>
        <Typography variant="h5" component="h2" gutterBottom>
          Welcome, {userInfo.full_name}
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <EmailIcon />
            </ListItemIcon>
            <ListItemText primary={userInfo.email} />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <LocationOnIcon />
            </ListItemIcon>
            <ListItemText primary={userAttributes.location} />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CalendarTodayIcon />
            </ListItemIcon>
            <ListItemText primary={`Joined: ${userAttributes.joinDate}`} />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <InfoIcon />
            </ListItemIcon>
            <ListItemText primary={userAttributes.bio} />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
}
