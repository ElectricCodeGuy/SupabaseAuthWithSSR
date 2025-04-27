import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
});

const config = tseslint.config(
  {
    ignores: ['.next', 'node_modules', '**/*.d.ts', 'components/**/*']
  },
  // Base configs
  js.configs.recommended,
  //Remove this if you don't want the optional stylistic rules liek the type and interface
  ...tseslint.configs.stylisticTypeChecked,

  // Next.js config
  ...compat.extends('next/core-web-vitals'),
  ...compat.extends('next/typescript'),

  {
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['**/*.d.ts'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.json'], // Specify the path to your tsconfig.json
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    settings: {
      next: {
        rootDir: './'
      }
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' }
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      // Next.js specific rules
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',
      '@next/next/no-head-element': 'error',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/google-font-display': 'error',
      '@next/next/google-font-preconnect': 'error',

      // React hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Turn off rules that conflict with Next.js
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Performance rules
      'react/jsx-no-constructed-context-values': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/self-closing-comp': [
        'error',
        {
          component: true,
          html: true
        }
      ]
    }
  },

  // CommonJS files config
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', 'eslint.config.mjs'],
    ...tseslint.configs.disableTypeChecked
  },

  // CommonJS files config
  {
    files: ['**/*.cjs', '**/*.cts'],
    languageOptions: {
      sourceType: 'commonjs'
    }
  },

  prettierConfig
);

export default config;
