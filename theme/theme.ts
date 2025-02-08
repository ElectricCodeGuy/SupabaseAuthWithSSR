'use client';
import { createTheme } from '@mui/material/styles';

const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0'); // convert to Hex and add leading zero
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const theme = createTheme({
  palette: {
    primary: {
      main: hslToHex(221.2, 83.2, 53.3) // --primary
    },
    secondary: {
      main: hslToHex(210, 70, 40) // Updated secondary color
    },
    error: {
      main: hslToHex(0, 84.2, 60.2) // --destructive
    },
    warning: {
      main: '#ffa000' // keep as is
    },
    info: {
      main: '#31708E' // keep as is
    },
    success: {
      main: '#388e3c' // keep as is
    },
    background: {
      default: hslToHex(0, 0, 100), // --background
      paper: hslToHex(0, 0, 100) // --card
    },
    text: {
      primary: hslToHex(222.2, 84, 4.9), // --foreground
      secondary: hslToHex(215.4, 16.3, 46.9) // --muted-foreground
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 2
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: 2
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backgroundColor: hslToHex(221.2, 83.2, 53.3), // --primary
          borderRadius: 2
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 2
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          color: hslToHex(221.2, 83.2, 53.3), // --primary
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
            borderColor: hslToHex(214.3, 31.8, 91.4) // --border
          }
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          top: '44px', // Match your AppBar height
          height: 'calc(100% - 44px)', // Subtract AppBar height from total height
          '@media (max-width: 900px)': {
            top: 0, // Reset for mobile
            height: '100%' // Full height for mobile
          }
        },
        modal: {
          top: '44px', // Match your AppBar height
          '@media (max-width: 900px)': {
            top: 0 // Reset for mobile
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: hslToHex(217.2, 32.6, 17.5), // --secondary
          color: 'white',
          fontSize: '0.875rem',
          borderRadius: 2
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
