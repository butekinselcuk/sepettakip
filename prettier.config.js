/** @type {import('prettier').Config} */
module.exports = {
  endOfLine: 'lf',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  importOrder: [
    '^(react/(.*)$)|^(react$)',
    '^(next/(.*)$)|^(next$)',
    '<THIRD_PARTY_MODULES>',
    '^@/components/(.*)$',
    '^@/app/(.*)$',
    '^@/lib/(.*)$',
    '^@/hooks/(.*)$',
    '^@/store/(.*)$',
    '^@/utils/(.*)$',
    '^@/types/(.*)$',
    '^@/styles/(.*)$',
    '^[./]'
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  printWidth: 80,
  plugins: [
    'prettier-plugin-tailwindcss'
  ],
}; 