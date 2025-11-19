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
      },
      boxShadow: {
        'neu-3d': '0 8px 24px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        'neu-lg': '0 6px 20px rgba(0, 0, 0, 0.25), 0 3px 10px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        'neu-sm': '0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        'neu-xs': '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        'inner': 'inset 0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 12px 32px rgba(0, 0, 0, 0.35), 0 6px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
      },
      backdropBlur: {
        'xl': '24px',
      }
    }
  },
  plugins: [],
};
