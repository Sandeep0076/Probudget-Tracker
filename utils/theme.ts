// utils/theme.ts

/**
 * Converts a hex color string to an HSL array.
 * @param {string} H - The hex color string (e.g., "#RRGGBB").
 * @returns {[number, number, number]} - An array representing [hue, saturation, lightness].
 */
export const hexToHSL = (H: string): [number, number, number] => {
  let r = 0, g = 0, b = 0;
  if (H.length === 4) {
    r = parseInt(H[1] + H[1], 16);
    g = parseInt(H[2] + H[2], 16);
    b = parseInt(H[3] + H[3], 16);
  } else if (H.length === 7) {
    r = parseInt(H[1] + H[2], 16);
    g = parseInt(H[3] + H[4], 16);
    b = parseInt(H[5] + H[6], 16);
  }
  
  r /= 255;
  g /= 255;
  b /= 255;

  let cmin = Math.min(r,g,b),
      cmax = Math.max(r,g,b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  
  return [h, s, l];
}


/**
 * Converts an HSL color value to a hex string.
 * @param {number} h - Hue (0-360).
 * @param {number} s - Saturation (0-1).
 * @param {number} l - Lightness (0-1).
 * @returns {string} - The hex color string.
 */
export const hslToHex = (h: number, s: number, l: number): string => {
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; }
  else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; }
  else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; }
  else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; }
  else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; }
  else if (300 <= h && h < 360) { [r, g, b] = [c, 0, x]; }

  const toHex = (c: number) => {
    const hex = Math.round((c + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generates and applies a full theme palette based on a single color.
 * @param baseColor - The base hex color selected by the user.
 */
export const applyCustomTheme = (baseColor: string) => {
  const [h, s, l] = hexToHSL(baseColor);

  const labelS = Math.min(1, s + 0.15);
  const labelBgLightness = l > 0.5 ? Math.max(0.18, l - 0.25) : Math.min(0.86, l + 0.22);
  const labelBorderLightness = l > 0.5 ? Math.max(0.12, l - 0.32) : Math.min(0.72, l + 0.12);
  const labelText = l > 0.6 ? '#0f172a' : '#f8fafc';
  const labelTextMuted = l > 0.6
    ? 'rgba(15, 23, 42, 0.62)'
    : 'rgba(248, 250, 252, 0.7)';

  const saturationPercent = Math.round(labelS * 100);
  const labelBgLightnessPercent = Math.round(labelBgLightness * 100);
  const labelBorderLightnessPercent = Math.round(labelBorderLightness * 100);

  const theme = {
    '--color-background-start': hslToHex(h, s, Math.max(0, l - 0.1)),
    '--color-background-end': hslToHex((h + 20) % 360, s, Math.max(0, l - 0.2)),
    '--color-surface': `hsla(${h}, ${Math.round(s * 80)}%, ${Math.round(Math.max(0, l - 0.05) * 100)}%, 0.4)`,
    '--color-surface-white': 'rgba(255, 255, 255, 0.95)',
    '--color-surface-light': 'rgba(255, 255, 255, 0.85)',
    '--color-text-primary': hslToHex(h, Math.min(1, s * 0.2), 0.95),
    '--color-text-secondary': hslToHex(h, Math.min(1, s * 0.15), 0.85),
    '--color-text-muted': hslToHex(h, Math.min(1, s * 0.1), 0.65),
    '--color-text-dark': '#1e293b',
    '--color-brand': hslToHex((h + 150) % 360, 1, 0.6),
    '--color-accent': hslToHex((h + 180) % 360, 1, 0.7),
    '--color-border-highlight': `hsla(${(h + 180) % 360}, 100%, 70%, 0.2)`,
    '--color-border-shadow': `hsla(0, 0%, 0%, 0.3)`,
    '--color-success': '#4ade80',
    '--color-danger': '#f87171',
    '--color-warning': '#facc15',
    '--color-shadow-light': `hsla(${(h + 180) % 360}, 100%, 70%, 0.1)`,
    '--color-shadow-dark': `hsla(0, 0%, 0%, 0.5)`,
    '--color-label-bg': `hsla(${h}, ${saturationPercent}%, ${labelBgLightnessPercent}%, 0.26)`,
    '--color-label-border': `hsla(${h}, ${saturationPercent}%, ${labelBorderLightnessPercent}%, 0.6)`,
    '--color-label-text': labelText,
    '--color-label-text-muted': labelTextMuted,
  };

  for (const [key, value] of Object.entries(theme)) {
    document.documentElement.style.setProperty(key, value);
  }
};