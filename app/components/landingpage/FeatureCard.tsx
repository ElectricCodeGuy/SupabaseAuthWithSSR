import React from 'react';
import { Box, Grid2, Typography, Divider } from '@mui/material';
import Link from 'next/link';

const features = [
  {
    title: 'Advanced AI Integration',
    description:
      'Leverage state-of-the-art AI capabilities for enhanced NLP features and efficient data retrieval.',
    Icon: '🤖'
  },
  {
    title: 'Real-time Updates',
    description:
      'Stay informed with real-time data sourced from reputable sources, ensuring you have the most recent updates.',
    Icon: '🔄'
  },
  {
    title: 'Deep Insights',
    description:
      'Dive deep into the data, understanding intricate patterns and insights that can help drive informed decisions.',
    Icon: '📚'
  },
  {
    title: 'Guidelines & Protocols',
    description:
      'Stay informed about organizational structures, guidelines, and best practices to ensure smooth operations.',
    Icon: '🔐'
  },
  {
    title: 'Absence Policies',
    description:
      'Know the protocol for leaves, attendance, sick days, and other related matters for smooth workflow.',
    Icon: '📅'
  },
  {
    title: 'Financial Information',
    description: (
      <>
        Stay informed about financial regulations, provisions, and insights.
        Learn more at{' '}
        <Link
          href="#models"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          Financial Info
        </Link>
        .
      </>
    ),
    Icon: '💰'
  }
];

export default function Component() {
  return (
    <Box
      id="models"
      sx={{
        pt: [1, 2, 3, 4],
        pb: [1, 2, 3, 6],
        maxWidth: '1800px',
        mx: 'auto'
      }}
    >
      <Typography
        variant="h2"
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          fontFamily: 'Monospace',
          letterSpacing: '0.1em',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          backgroundGradient: 'linear(to r, white, grey.500)'
        }}
      >
        Discover Our Features
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontWeight: 'bold',
          textAlign: 'center',
          maxWidth: 800,
          mx: 'auto',
          fontFamily: 'Monospace',
          letterSpacing: '0.05em',
          mb: 2
        }}
      >
        Harnessing Advanced AI for Better Insights and Efficient Operations
      </Typography>

      <Grid2 container spacing={4}>
        {features.map((feature, index) => (
          <Grid2
            key={index}
            style={{ display: 'flex' }}
            size={{
              xs: 12,
              sm: 6,
              md: 4
            }}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: '12px',
              borderColor: 'grey.800',
              height: '100%',
              minHeight: 350,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%',
              boxShadow: 3,
              backgroundColor: 'background.paper'
            }}
          >
            <Box sx={{ fontSize: 50, opacity: 0.9 }}>{feature.Icon}</Box>
            <Typography
              variant="h6"
              color="primary"
              gutterBottom
              sx={{
                fontWeight: 'bold'
              }}
            >
              {feature.title}
            </Typography>
            <Divider variant="middle" />
            <Typography
              variant="body2"
              component="div"
              sx={{
                color: 'text.secondary',
                mt: 2
              }}
            >
              {feature.description}
            </Typography>
          </Grid2>
        ))}
      </Grid2>
    </Box>
  );
}
