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
  ListItemText,
  Box,
  Chip,
  Grid2,
  Paper,
  Divider,
  LinearProgress
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import CodeIcon from '@mui/icons-material/Code';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProtectedPage() {
  const userInfo = await getUserInfo();
  if (!userInfo) {
    redirect('/signin');
  }

  // Extended user attributes
  const userAttributes = {
    location: 'New York, USA',
    joinDate: format(new Date(), 'PPP'),
    bio: 'Senior Full Stack Developer with 5+ years of experience. Passionate about creating scalable web applications and mentoring junior developers.',
    position: 'Senior Software Engineer',
    company: 'Tech Innovations Inc.',
    education: 'M.S. Computer Science, Stanford University',
    skills: [
      { name: 'React', level: 90 },
      { name: 'Node.js', level: 85 },
      { name: 'TypeScript', level: 88 },
      { name: 'Python', level: 75 },
      { name: 'AWS', level: 80 }
    ],
    projects: [
      { name: 'E-commerce Platform', tech: ['React', 'Node.js', 'MongoDB'] },
      { name: 'AI Chat Application', tech: ['Python', 'TensorFlow', 'React'] },
      {
        name: 'Portfolio Manager',
        tech: ['TypeScript', 'Next.js', 'PostgreSQL']
      }
    ],
    socialLinks: {
      github: 'https://github.com/username',
      linkedin: 'https://linkedin.com/in/username'
    }
  };

  return (
    <Grid2 container spacing={2} sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Left Column - Basic Info */}
      <Grid2 size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main'
              }}
            >
              <PersonIcon sx={{ fontSize: 60 }} />
            </Avatar>
            <Typography variant="h4" gutterBottom>
              {userInfo.full_name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              {userAttributes.position}
            </Typography>
            <Box sx={{ mt: 2, mb: 3 }}>
              <Chip
                icon={<LinkedInIcon />}
                component={Link}
                label="LinkedIn"
                href={'#'}
                clickable
                sx={{ mr: 1 }}
              />
              <Chip
                icon={<GitHubIcon />}
                label="GitHub"
                component={Link}
                href={'#'}
                clickable
              />
            </Box>
            <Divider sx={{ my: 2 }} />
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
                  <WorkIcon />
                </ListItemIcon>
                <ListItemText primary={userAttributes.company} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText primary={userAttributes.education} />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid2>

      {/* Right Column - Skills & Projects */}
      <Grid2 size={{ xs: 12, md: 8 }}>
        {/* About Me Section */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            About Me
          </Typography>
          <Typography>{userAttributes.bio}</Typography>
        </Paper>

        {/* Skills Section */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Technical Skills
          </Typography>
          <Grid2 container spacing={2}>
            {userAttributes.skills.map((skill) => (
              <Grid2 size={12} key={skill.name}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">{skill.name}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={skill.level}
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                </Box>
              </Grid2>
            ))}
          </Grid2>
        </Paper>

        {/* Projects Section */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Projects
          </Typography>
          <Grid2 container spacing={2}>
            {userAttributes.projects.map((project) => (
              <Grid2
                size={{ xs: 12, sm: 4, md: 6 }}
                key={project.name}
                sx={{
                  border: '1px solid #ccc', // Add a light gray border
                  borderRadius: '4px', // Optional: rounds the corners
                  p: 2, // Add more padding
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)' // Optional: adds subtle shadow
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  {project.name}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {project.tech.map((tech) => (
                    <Chip
                      key={tech}
                      label={tech}
                      size="small"
                      icon={<CodeIcon />}
                    />
                  ))}
                </Box>
              </Grid2>
            ))}
          </Grid2>
        </Paper>
      </Grid2>
    </Grid2>
  );
}
