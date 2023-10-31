import { alpha } from '@mui/material/styles';
import { error, indigo, info, neutral, success, warning } from './colors';
import { PaletteMode } from '@mui/material';
interface ColorSet {
  lightest?: string;
  light?: string;
  main: string;
  dark?: string;
  darkest?: string;
  contrastText?: string;
  alpha4?: string;
  alpha8?: string;
  alpha12?: string;
  alpha30?: string;
  alpha50?: string;
}

interface Palette {
  action: {
    active: string;
    disabled: string;
    disabledBackground: string;
    focus: string;
    hover: string;
    selected: string;
  };
  background: {
    default: string;
    paper: string;
  };
  divider: string;
  error: ColorSet;
  info: ColorSet;
  mode: PaletteMode;
  neutral: {
    [key: string]: string;
  };
  primary: ColorSet;
  success: ColorSet;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  warning: ColorSet;
}

export const getDesignTokens = (mode: PaletteMode) => {
  const isDarkMode = mode === 'dark';

  return {
    palette: {
      mode,
      primary: indigo,
      background: {
        default: isDarkMode ? neutral[800] : neutral[50],
        paper: isDarkMode ? neutral[900] : neutral[100] // Adjusted to neutral[100]
      },
      text: {
        default: isDarkMode
          ? 'rgba(255, 255, 255, 0.87)'
          : 'rgba(0, 0, 0, 0.87)',
        primary: isDarkMode
          ? 'rgba(255, 255, 255, 0.87)'
          : 'rgba(0, 0, 0, 0.87)',
        secondary: isDarkMode
          ? 'rgba(255, 255, 255, 0.6)'
          : 'rgba(0, 0, 0, 0.6)'
      },
      components: {
        MuiTypography: {
          styleOverrides: {
            root: {
              color: isDarkMode
                ? 'rgba(255, 255, 255, 0.87)'
                : 'rgba(0, 0, 0, 0.87)'
            }
          }
        },
        MuiBox: {
          variants: [
            {
              props: { variant: 'themeSensitive' },
              style: {
                backgroundColor: isDarkMode ? neutral[800] : neutral[50],
                color: isDarkMode
                  ? 'rgba(255, 255, 255, 0.87)'
                  : 'rgba(0, 0, 0, 0.87)'
              }
            }
          ]
        },
        MuiContainer: {
          variants: [
            {
              props: { variant: 'themeSensitive' },
              style: {
                backgroundColor: isDarkMode ? neutral[900] : neutral[100], // Adjusted to neutral[100]
                color: isDarkMode
                  ? 'rgba(255, 255, 255, 0.87)'
                  : 'rgba(0, 0, 0, 0.87)'
              }
            }
          ]
        }
      }
    }
  };
};

export function createPalette(mode: PaletteMode = 'light'): Palette {
  const designTokens = getDesignTokens(mode);

  return {
    ...designTokens.palette,
    action: {
      active: neutral[700],
      disabled: alpha(neutral[700], 0.38),
      disabledBackground: alpha(neutral[700], 0.12),
      focus: alpha(indigo.main, 0.24),
      hover: alpha(indigo.main, 0.08),
      selected: alpha(indigo.main, 0.16)
    },
    divider: neutral[200],
    error,
    info,
    neutral,
    success,
    warning,
    text: {
      ...designTokens.palette.text,
      disabled: alpha(neutral[700], 0.38)
    }
  };
}
