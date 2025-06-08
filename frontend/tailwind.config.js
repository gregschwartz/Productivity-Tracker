/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-text': 'var(--color-primary-text)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        'background-hover': 'var(--color-background-hover)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'status-success': 'var(--color-status-success)',
        'status-warning': 'var(--color-status-warning)',
        'status-error': 'var(--color-status-error)',
        'status-info': 'var(--color-status-info)',
        'focus-low': 'var(--color-focus-low)',
        'focus-medium': 'var(--color-focus-medium)',
        'focus-high': 'var(--color-focus-high)',
        accent: 'var(--color-accent)',
      },
      fontFamily: {
        primary: 'var(--font-primary)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        small: 'var(--border-radius-small)',
        medium: 'var(--border-radius-medium)',
        large: 'var(--border-radius-large)',
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-small)',
        'theme-md': 'var(--shadow-medium)',
        'theme-lg': 'var(--shadow-large)',
        glow: {
          small: 'var(--glow-small)',
          medium: 'var(--glow-medium)',
          large: 'var(--glow-large)',
        }
      },
    },
  },
  plugins: [
  ],
}
