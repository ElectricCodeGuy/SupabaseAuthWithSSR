// @ts-check

import { defineConfig, globalIgnores } from 'eslint/config';
import ts from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactGoogleTranslate from 'eslint-plugin-react-google-translate';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  ts.configs.recommendedTypeChecked,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    plugins: {
      '@next/next': nextPlugin,
      'react-google-translate': reactGoogleTranslate
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'off'
    }
  },
  {
    rules: {
      'react-google-translate/no-conditional-text-nodes-with-siblings': 'error',
      'react-google-translate/no-return-text-nodes': 'error',
      // Type imports
      '@typescript-eslint/consistent-type-imports': 'error',

      // Allow any — Supabase responses, JSONB columns, etc.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // Useful but too many hits in existing code — warn for now
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-deprecated': 'off',

      // Off — generated types trigger this
      '@typescript-eslint/no-redundant-type-constituents': 'off',

      // Relaxed
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/require-await': 'off',

      // Strict
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true }
      ],
      '@typescript-eslint/no-empty-function': [
        'error',
        { allow: ['arrowFunctions'] }
      ],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error'
    }
  },
  {
    files: ['next-env.d.ts'],
    rules: { '@typescript-eslint/triple-slash-reference': 'off' }
  },
  {
    files: ['components/ui/**'],
    rules: {
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-deprecated': 'off'
    }
  },
  {
    // E-mails renderes af react-email og åbnes i mailklienter — Google
    // Translate manipulerer aldrig deres DOM, så reglerne er falske
    // positiver her.
    files: ['components/emails/**'],
    rules: {
      'react-google-translate/no-conditional-text-nodes-with-siblings': 'off',
      'react-google-translate/no-return-text-nodes': 'off'
    }
  },
  globalIgnores(['.next/**', '**/*.mjs'])
]);
