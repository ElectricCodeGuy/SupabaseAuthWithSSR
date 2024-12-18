'use client';

import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '90vh',
            p: {
              xs: 0.2,
              sm: 0.5,
              md: 1,
              lg: 2
            },
            textAlign: 'center'
          }}
        >
          <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
            Sorry - something went wrong
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            If you are using Google Translate, it may crash the page. Please
            disable it.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
          >
            Reload the page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
