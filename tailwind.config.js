/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
      },
      colors: {
        cream: '#FBF9F4',
        ink: '#1A1F1C',
        sage: {
          50: '#F1F5F0',
          100: '#E2EBDF',
          200: '#C5D6BF',
          300: '#9CB893',
          400: '#74996A',
          500: '#557A4D',
          600: '#3F5C39',
        },
        coral: '#E66E5A',
        butter: '#F5C56B',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(26,31,28,0.04), 0 8px 24px rgba(26,31,28,0.06)',
      },
    },
  },
  plugins: [],
};
