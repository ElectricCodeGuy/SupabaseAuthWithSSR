import { alpha } from '@mui/material/styles';

interface ColorWithAlphas {
  lightest: string;
  light: string;
  main: string;
  dark: string;
  darkest: string;
  contrastText: string;
  alpha4?: string;
  alpha8?: string;
  alpha12?: string;
  alpha30?: string;
  alpha50?: string;
}

const withAlphas = (
  color: Omit<
    ColorWithAlphas,
    'alpha4' | 'alpha8' | 'alpha12' | 'alpha30' | 'alpha50'
  >
): ColorWithAlphas => {
  return {
    ...color,
    alpha4: alpha(color.dark, 0.04),
    alpha8: alpha(color.dark, 0.08),
    alpha12: alpha(color.dark, 0.12),
    alpha30: alpha(color.dark, 0.3),
    alpha50: alpha(color.dark, 0.5)
  };
};

export const neutral = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  350: '#B0B7BC',
  400: '#9EAAAF',
  500: '#6E7478',
  600: '#4F5961',
  700: '#323F4B',
  800: '#1F2933',
  900: '#111827'
};

export const indigo: ColorWithAlphas = withAlphas({
  lightest: '#E0E7FF',
  light: '#C7D2FE',
  main: '#5B67E2',
  dark: '#4C55C0',
  darkest: '#383F9F',
  contrastText: '#FFFFFF'
});

export const success: ColorWithAlphas = withAlphas({
  lightest: '#D9F7E0',
  light: '#A9E6B2',
  main: '#2FC974',
  dark: '#28A745',
  darkest: '#207D39',
  contrastText: '#FFFFFF'
});

export const info: ColorWithAlphas = withAlphas({
  lightest: '#D6F6FC',
  light: '#A8E4F2',
  main: '#00A3C4',
  dark: '#007A93',
  darkest: '#00565B',
  contrastText: '#FFFFFF'
});

export const warning: ColorWithAlphas = withAlphas({
  lightest: '#FFF4D6',
  light: '#FFEBB7',
  main: '#FFAA00',
  dark: '#CC8800',
  darkest: '#995500',
  contrastText: '#332C26'
});

export const error: ColorWithAlphas = withAlphas({
  lightest: '#FFD6D6',
  light: '#FFADAD',
  main: '#FF4747',
  dark: '#CC3737',
  darkest: '#991B1B',
  contrastText: '#FFFFFF'
});
