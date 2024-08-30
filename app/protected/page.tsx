import 'server-only';
import { getUserInfo, getSession } from '@/lib/server/supabase';
import {
  Typography,
  Box,
  Container,
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
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export default async function ProtectedPage() {
  const session = await getSession();
  if (!session) return redirect('/login');

  const userInfo = await getUserInfo(session.id);
  if (!userInfo) {
    return (
      <Container>
        <Typography
          variant="h6"
          align="center"
          sx={{
            color: 'error',
            my: 4
          }}
        >
          Error fetching user information.
        </Typography>
      </Container>
    );
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
    <Container>
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent>
            <Box
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
                  <ListItemText
                    primary={`Joined: ${userAttributes.joinDate}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText primary={userAttributes.bio} />
                </ListItem>
              </List>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
