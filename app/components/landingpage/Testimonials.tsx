import React from 'react';
import {
  Box,
  Container,
  Grid2,
  Typography,
  Paper,
  Avatar
} from '@mui/material';
import ChikenImage from '@/public/images/chiken image.jpg';

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  content: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Johnson',
    role: 'HR Manager',
    avatar: ChikenImage.src,
    content:
      "The AI integration has revolutionized our HR processes. We're now able to handle employee queries more efficiently than ever before."
  },
  {
    name: 'Michael Chen',
    role: 'Financial Analyst',
    avatar: ChikenImage.src,
    content:
      "The real-time updates feature has been a game-changer for our financial forecasting. We're always working with the most current data."
  },
  {
    name: 'Emily Rodriguez',
    role: 'Operations Director',
    avatar: ChikenImage.src,
    content:
      "The deep insights provided by this platform have helped us identify and resolve operational bottlenecks we didn't even know existed."
  },
  {
    name: 'David Kim',
    role: 'Compliance Officer',
    avatar: ChikenImage.src,
    content:
      "Having all our guidelines and protocols in one place has significantly improved our compliance rates. It's user-friendly and always up-to-date."
  },
  {
    name: 'Lisa Patel',
    role: 'Team Lead',
    avatar: ChikenImage.src,
    content:
      "The absence management features have streamlined our leave approval process. It's made my job as a team lead much easier."
  },
  {
    name: 'Robert Taylor',
    role: 'CFO',
    avatar: ChikenImage.src,
    content:
      "The financial information section is comprehensive and well-organized. It's become an indispensable tool for our finance department."
  }
];

const TestimonialCard: React.FC<Testimonial> = ({
  name,
  role,
  avatar,
  content
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: '12px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          mb: 2,
          flexGrow: 1
        }}
      >
        &ldquo;{content}&rdquo;
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar src={avatar} alt={name} sx={{ width: 48, height: 48, mr: 2 }} />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {role}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

const Testimonials: React.FC = () => {
  return (
    <Box
      id="testimonials"
      sx={{ width: '100%', pt: [1, 2, 3, 6], pb: [4, 6, 8, 12] }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            textAlign: 'center',
            mb: 10
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 'bold',
              fontFamily: 'Monospace',
              letterSpacing: '0.1em',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              backgroundGradient: 'linear(to r, white, grey.500)'
            }}
          >
            What Our Users Say
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              maxWidth: 800,
              mx: 'auto',
              fontFamily: 'Monospace',
              letterSpacing: '0.05em'
            }}
          >
            Real Experiences from Satisfied Customers
          </Typography>
        </Box>
        <Grid2 container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid2
              size={{
                xs: 12,
                sm: 6,
                md: 4
              }}
              key={index}
              sx={{ display: 'flex' }}
            >
              <TestimonialCard {...testimonial} />
            </Grid2>
          ))}
        </Grid2>
      </Container>
    </Box>
  );
};

export default Testimonials;
