import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#003366' // A deep navy blue, professional and trustworthy
    },
    secondary: {
      main: '#4D4D4D' // A dark gray for contrast
    },
    error: {
      main: '#d32f2f' // Standard error color for clarity
    },
    warning: {
      main: '#ffa000' // Standard warning color for visibility
    },
    info: {
      main: '#31708E' // A softer blue for informational messages
    },
    success: {
      main: '#388e3c' // Standard success green for positive feedback
    },
    background: {
      default: '#F4F4F4', // A light gray background, less stark than white
      paper: '#FFFFFF' // White for paper elements, clear and clean
    },
    text: {
      primary: '#333333', // Dark gray for primary text, strong and readable
      secondary: '#4D4D4D' // Slightly lighter for secondary text, complementary
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
          margin: '8px 0'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // Subtle shadow for depth
          borderRadius: '8px' // Slightly rounded corners for a modern feel
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          color: '#003366', // Use primary color for links
          '&:hover': {
            textDecoration: 'underline' // Underline on hover for clear interaction
          }
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'collapse',
          '& th, & td': {
            borderColor: '#E0E0E0' // Soft color for table borders
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#4D4D4D', // Dark background for contrast
          color: 'white', // White text for readability
          fontSize: '0.875rem' // Slightly larger font for clarity
        }
      }
    }
    // ... other component customizations
  }
});

export default theme;
