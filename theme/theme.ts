'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#003366'
    },
    secondary: {
      main: '#4D4D4D'
    },
    error: {
      main: '#d32f2f'
    },
    warning: {
      main: '#ffa000'
    },
    info: {
      main: '#31708E'
    },
    success: {
      main: '#388e3c'
    },
    background: {
      default: '#F4F4F4',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#333333',
      secondary: '#4D4D4D'
    }
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontSize: '2.125rem',
      fontWeight: 500,
      letterSpacing: '0.00735em'
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 500
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 500
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 500
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 500
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 400
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none'
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          textTransform: 'none',
          fontWeight: 500,
          padding: '6px 16px'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backgroundColor: '#003366'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          margin: '2px 0'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '2px'
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          color: '#003366',
          '&:hover': {
            textDecoration: 'underline'
          }
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'collapse',
          '& th, & td': {
            borderColor: '#E0E0E0'
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#4D4D4D',
          color: 'white',
          fontSize: '0.875rem'
        }
      }
    },
    MuiInputBase: {
      defaultProps: {
        disableInjectingGlobalStyles: true
      }
    }
  }
});

export default theme;
