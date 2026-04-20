/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#004ac6',
        'primary-container': '#2563eb',
        'primary-fixed': '#dbe1ff',
        'on-primary': '#ffffff',
        'on-primary-container': '#eeefff',
        'on-primary-fixed': '#00174b',
        secondary: '#006c49',
        'secondary-container': '#6cf8bb',
        'on-secondary-container': '#00714d',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        surface: '#f9f9ff',
        'surface-container': '#e7eefe',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f0f3ff',
        'surface-container-high': '#e2e8f8',
        'surface-container-highest': '#dce2f3',
        'surface-variant': '#dce2f3',
        'on-surface': '#151c27',
        'on-surface-variant': '#434655',
        outline: '#737686',
        'outline-variant': '#c3c6d7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
