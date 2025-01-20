import React from 'react';
import Image from 'next/image';
import { Box, Typography, Grid2, IconButton, Chip } from '@mui/material';
import {
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';
import Link from 'next/link';
import ChikenImage from '@/public/images/chiken image.jpg';

const UserProfileComponent = () => {
  return (
    <Grid2
      container
      spacing={2}
      sx={{
        bgcolor: 'background.paper',
        p: 2,
        boxShadow: 4,
        borderRadius: '8px',
        maxWidth: '1800px',
        mx: 'auto',
        my: 4
      }}
    >
      <Grid2
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
        size={{
          xs: 12,
          md: 4
        }}
      >
        <Image src={ChikenImage} alt="Support" height={140} width={140} />

        <Typography
          variant="h4"
          align="center"
          sx={{
            color: 'primary.main',
            mb: 2,
            fontWeight: 'bold'
          }}
        >
          DevOps
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            justifyContent: 'center'
          }}
        >
          <IconButton color="primary">
            <Link
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <LinkedInIcon fontSize="large" />
            </Link>
          </IconButton>
          <IconButton color="primary">
            <Link
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <GitHubIcon fontSize="large" />
            </Link>
          </IconButton>
        </Box>
      </Grid2>

      <Grid2
        size={{
          xs: 12,
          md: 8
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: 'primary.main',
            mb: 1,
            fontWeight: 'bold'
          }}
        >
          About Me
        </Typography>
        <Typography
          sx={{
            color: 'text.secondary',
            mb: 3
          }}
        >
          Based in a vibrant tech hub, we are a team of developers passionate
          about integrating AI into data management solutions. Our ongoing
          project is an innovative chatbot designed to streamline the flow of
          information for users across various platforms. Additionally, we are
          in the process of developing a knowledge-based vector database. This
          database integrates cutting-edge technologies from leading AI and
          database providers. With this tool, we aim to revolutionize the way
          data is accessed, making searches faster and more relevant.
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: 'primary.main',
            mb: 1,
            fontWeight: 'bold'
          }}
        >
          Skills
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
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
      </Grid2>
    </Grid2>
  );
};

export default UserProfileComponent;
