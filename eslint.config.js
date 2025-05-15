import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports'
import eslintPluginImport from 'eslint-plugin-import';

export default tseslint.config(
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: eslintPluginPrettier,
      import: eslintPluginImport,
      'unused-imports': eslintPluginUnusedImports,
    },
    rules: {
      // TypeScriptルール例
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Prettier統合（警告ではなくエラーにする）
      'prettier/prettier': 'error',
      'max-len': ['error', { code: 100 }],
      'object-curly-newline': [
        'error',
        {
          ObjectExpression: { multiline: true, minProperties: 2 },
          ObjectPattern: { multiline: true, minProperties: 2 },
          ImportDeclaration: { multiline: true, minProperties: 2 },
          ExportDeclaration: { multiline: true, minProperties: 2 },
        },
      ],
      'import/extensions': ['error', 'always', {
        js: 'always',
        ts: 'never',
        tsx: 'never',
      }],
      'unused-imports/no-unused-imports': 'error',
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.ts', '.tsx'],
        },
      },
    },

  },
  eslintConfigPrettier,
);
