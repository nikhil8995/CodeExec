export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dce6ff',
          200: '#b8ccff',
          300: '#85a8ff',
          400: '#4d7bff',
          500: '#2d5ff5',
          600: '#1a3fea',
          700: '#162fd4',
          800: '#1828ab',
          900: '#1a2787',
        },
        dark: {
          900: '#0a0c14',
          800: '#0f1221',
          700: '#151929',
          600: '#1c2235',
          500: '#242b40',
          400: '#2e3650',
        }
      }
    }
  },
  plugins: []
}
