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
  100: '#F0F1F3',
  200: '#E1E2E6',
  300: '#C6C8CE',
  350: '#ACB2BA',
  400: '#8F99A3',
  500: '#707885',
  600: '#565E6A',
  700: '#3C4452',
  800: '#2A303C',
  900: '#1A1E24'
};

export const indigo: ColorWithAlphas = withAlphas({
  lightest: '#E3F2FD',
  light: '#90CAF9',
  main: '#1E88E5',
  dark: '#1565C0',
  darkest: '#0D47A1',
  contrastText: '#FFFFFF'
});

export const success: ColorWithAlphas = withAlphas({
  lightest: '#E8F5E9',
  light: '#A5D6A7',
  main: '#43A047',
  dark: '#2E7D32',
  darkest: '#1B5E20',
  contrastText: '#FFFFFF'
});

export const info: ColorWithAlphas = withAlphas({
  lightest: '#E1F5FE',
  light: '#81D4FA',
  main: '#039BE5',
  dark: '#0277BD',
  darkest: '#01579B',
  contrastText: '#FFFFFF'
});

export const warning: ColorWithAlphas = withAlphas({
  lightest: '#FFFDE7',
  light: '#FFF59D',
  main: '#FDD835',
  dark: '#F9A825',
  darkest: '#F57F17',
  contrastText: '#332C26'
});

export const error: ColorWithAlphas = withAlphas({
  lightest: '#FCE4EC',
  light: '#F48FB1',
  main: '#E91E63',
  dark: '#C2185B',
  darkest: '#880E4F',
  contrastText: '#FFFFFF'
});
