// @ts-check
import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettierConfigRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

const patchedConfig = fixupConfigRules([
  ...compat.extends('next/core-web-vitals')
]);

const config = [
  ...patchedConfig,
  ...ts.configs.recommended,
  prettierConfigRecommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: ts.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        project: './tsconfig.json', // Add this line
        tsconfigRootDir: __dirname // Add this line
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      // Original rules
      'react/no-is-mounted': 'error',
      'react/jsx-filename-extension': ['warn', { extensions: ['.tsx'] }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@mui/*/*/*']
        }
      ],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true
        }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/dot-notation': ['error', { allowKeywords: true }],
      '@typescript-eslint/no-empty-function': [
        'error',
        { allow: ['arrowFunctions'] }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': 'error',

      // Additional React recommended rules
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-unknown-property': 'error',
      'react/prop-types': 'off', // Since we're using TypeScript
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      'react/require-render-return': 'error',

      // JSX-specific rules
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/jsx-no-comment-textnodes': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-pascal-case': 'error',

      // Hooks rules
      'react/hook-use-state': 'error',

      // Best practices
      'react/jsx-fragments': ['error', 'syntax'],
      'react/jsx-no-useless-fragment': 'warn',
      'react/no-access-state-in-setstate': 'error',
      'react/no-unused-state': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': [
        'error',
        {
          props: 'never',
          children: 'never'
        }
      ],
      'react/self-closing-comp': [
        'error',
        {
          component: true,
          html: true
        }
      ],

      // Accessibility
      'react/jsx-no-script-url': 'error',
      'react/jsx-no-bind': [
        'warn',
        {
          allowArrowFunctions: true,
          allowFunctions: false,
          allowBind: false
        }
      ],

      // Performance
      'react/jsx-no-constructed-context-values': 'error',

      // TypeScript specific React rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off'
    }
  },
  { ignores: ['.next/*'] }
];

export default config;
