import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'

export default [
  // Configuración base
  js.configs.recommended,

  // Configuración para archivos TypeScript
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // Usamos la regla de TypeScript
      'no-undef': 'off', // Desactivamos para variables globales de Nuxt
      'prefer-const': 'error',
      'no-var': 'error',
      'prettier/prettier': 'error',
    },
  },

  // Configuración para archivos JavaScript
  {
    files: ['**/*.js'],
    plugins: {
      prettier: prettier,
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-undef': 'off', // Desactivamos para variables globales de Nuxt
      'prefer-const': 'error',
      'no-var': 'error',
      'prettier/prettier': 'error',
    },
  },

  // Archivos a ignorar
  {
    ignores: [
      'node_modules/**',
      '.nuxt/**',
      '.output/**',
      'dist/**',
      'build/**',
      '*.min.js',
      'coverage/**',
      '.nyc_output/**',
      '**/*.vue', // Temporalmente ignoramos archivos Vue hasta arreglar el parser
      '**/*.json', // Ignoramos JSON por ahora
    ],
  },
]
