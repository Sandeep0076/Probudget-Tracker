/** Tailwind CSS configuration replacing CDN runtime config.
 * Ensures theme variables (CSS custom properties) are used consistently.
 */
export default {
  content: [
    './index.html',
    './**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'background-start': 'var(--color-background-start)',
        'background-end': 'var(--color-background-end)',
        'surface': 'var(--color-surface)',
        'card-bg': 'var(--color-card-bg)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'brand': 'var(--color-brand)',
        'accent': 'var(--color-accent)',
        'border-highlight': 'var(--color-border-highlight)',
        'border-shadow': 'var(--color-border-shadow)',
        'success': 'var(--color-success)',
        'danger': 'var(--color-danger)',
        'warning': 'var(--color-warning)',
        'button-primary': 'var(--color-button-primary)',
        'button-text': 'var(--color-button-text)',
        'modal-bg': 'var(--color-modal-bg)',
        'input-bg': 'var(--color-input-bg)',
        'input-border': 'var(--color-input-border)',
      }
    }
  },
  plugins: [],
};
