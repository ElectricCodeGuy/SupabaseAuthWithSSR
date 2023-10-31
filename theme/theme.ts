import { createTheme } from '@mui/material/styles';
import { createPalette } from './create-palette'; // Keep the import path consistent

// Dynamic theme mode setter (can be updated elsewhere in the app if required)
const mode: 'light' | 'dark' = 'light';
const customPalette = createPalette(mode);

const theme = createTheme({
  palette: {
    ...customPalette, // Incorporate the custom palette
    primary: {
      main: '#1976d2' // Blue
    },
    secondary: {
      main: '#f50057' // Pink
    },
    error: {
      main: '#d32f2f' // Dark Red
    },
    warning: {
      main: '#ffa000' // Orange
    },
    info: {
      main: '#1976d2' // Blue
    },
    success: {
      main: '#388e3c' // Green
    }
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    h1: {
      fontSize: '2rem',
      fontWeight: 500,
      letterSpacing: '0.025em'
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 500
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500
    },
    h6: {
      fontSize: '1rem',
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
    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: '8px', // Rounded corners for alerts
          padding: '8px 16px', // Standard padding for alerts
          ...(ownerState.severity === 'info' && {
            backgroundColor: '#60a5fa',
            color: '#fff' // White text for better contrast on info alerts
          })
        })
      }
    }
  }
});

export default theme;
