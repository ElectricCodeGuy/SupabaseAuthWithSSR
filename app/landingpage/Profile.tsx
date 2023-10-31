/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Image from 'next/image';
const UserProfileComponent = () => {
  return (
    <Box
      bgcolor="background.default"
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4}
    >
      <Box
        bgcolor="background.paper"
        p={4}
        boxShadow={4}
        borderRadius="8px"
        width={{ xs: '95%', sm: '85%', md: '75%', lg: '65%' }}
      >
        <Grid container spacing={4}>
          <Grid
            item
            xs={12}
            md={4}
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <Image
              src="https://source.unsplash.com/random"
              alt="Support"
              height={140}
              width={140}
            />

            <Typography
              variant="h4"
              color="primary.main"
              mb={2}
              fontWeight="bold"
              align="center"
            >
              DevOps
            </Typography>

            <Box display="flex" gap={2} mb={3} justifyContent="center">
              <IconButton color="primary">
                <Link href="#" target="_blank" rel="noopener noreferrer">
                  <LinkedInIcon fontSize="large" />
                </Link>
              </IconButton>
              <IconButton color="primary">
                <Link href="#" target="_blank" rel="noopener noreferrer">
                  <GitHubIcon fontSize="large" />
                </Link>
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography
              variant="h5"
              color="primary.main"
              mb={1}
              fontWeight="bold"
            >
              About Me
            </Typography>
            <Typography color="text.secondary" mb={3}>
              Based in a vibrant tech hub, we are a team of developers
              passionate about integrating AI into data management solutions.
              Our ongoing project is an innovative chatbot designed to
              streamline the flow of information for users across various
              platforms. Additionally, we are in the process of developing a
              knowledge-based vector database. This database integrates
              cutting-edge technologies from leading AI and database providers.
              With this tool, we aim to revolutionize the way data is accessed,
              making searches faster and more relevant.
            </Typography>

            <Typography
              variant="h6"
              color="primary.main"
              mb={1}
              fontWeight="bold"
            >
              Skills
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {[
                'Data Management with AI',
                'ChatBot Development',
                'Database Development',
                'JavaScript/TypeScript',
                'PostgreSQL and SQL',
                'PineCone Vector Database',
                'Supabase Development',
                'Embeddings',
                'OpenAI',
                'Python',
                'React',
                'Next.js',
                'HuggingFace'
              ].map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default UserProfileComponent;
