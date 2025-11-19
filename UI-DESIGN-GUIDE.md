# ProBudget UI Design System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Color System](#color-system)
3. [3D Depth & Shadow System](#3d-depth--shadow-system)
4. [Typography](#typography)
5. [Component Styling](#component-styling)
6. [Layout & Spacing](#layout--spacing)
7. [Interactive States](#interactive-states)
8. [Theme System](#theme-system)
9. [Icons & Graphics](#icons--graphics)
10. [Accessibility](#accessibility)

---

## Overview

ProBudget uses a **neumorphic/glassmorphic 3D design system** with strong depth perception, layered shadows, beveled borders, and translucent surfaces. The UI emphasizes tactile, physical-feeling elements that appear to float above the background.

### Core Design Principles
- **3D Depth**: All cards and surfaces have multi-layered shadows with inset highlights
- **Glassmorphism**: Translucent backgrounds with backdrop blur effects
- **Beveled Borders**: Light borders on top/left, dark borders on bottom/right for 3D effect
- **Layered Shadows**: Multiple shadow layers create realistic depth
- **Smooth Transitions**: All interactive elements have smooth hover/focus states

---

## Color System

### CSS Custom Properties Structure

All colors are defined as CSS custom properties (CSS variables) in the `:root` selector, allowing dynamic theming.

#### Primary Color Variables

```css
--color-background-start    /* Gradient start color */
--color-background-end      /* Gradient end color */
--color-surface            /* Semi-transparent overlay surfaces */
--color-surface-white      /* Opaque white surface (95% opacity) */
--color-surface-light      /* Light white surface (85% opacity) */
```

#### Card Background Variants

```css
--color-card-bg           /* Base card background (15-20% opacity) */
--color-card-bg-light     /* Lighter variant (8-12% opacity) */
--color-card-bg-lighter   /* Lightest variant (5-8% opacity) */
--color-card-bg-dark      /* Darker variant (25-30% opacity) */
--color-card-bg-darker    /* Darkest variant (35-40% opacity) */
```

#### Text Colors

```css
--color-text-primary      /* Main text color (high contrast) */
--color-text-secondary    /* Secondary text (medium contrast) */
--color-text-muted        /* Muted text (low contrast) */
--color-text-dark         /* Dark text for light backgrounds */
```

#### Brand & Accent Colors

```css
--color-brand             /* Primary brand color */
--color-brand-light       /* Lighter brand variant */
--color-brand-lighter     /* Lightest brand variant */
--color-brand-dark        /* Darker brand variant */

--color-accent            /* Accent/highlight color */
--color-accent-light      /* Lighter accent */
--color-accent-lighter    /* Lightest accent */
--color-accent-dark       /* Darker accent */
```

#### Border Colors

```css
--color-border-highlight  /* Light border (top/left for 3D effect) */
--color-border-shadow     /* Dark border (bottom/right for 3D effect) */
```

#### Semantic Colors

```css
--color-success           /* Success/positive actions (#4ade80) */
--color-danger            /* Error/destructive actions (#f87171) */
--color-warning           /* Warning/caution (#facc15) */
```

#### Shadow System Colors

```css
--color-shadow-light           /* Light shadow component */
--color-shadow-dark            /* Dark shadow component */
--color-shadow-light-inner     /* Light inset shadow */
--color-shadow-dark-inner      /* Dark inset shadow */
```

#### Form Elements

```css
--color-button-primary    /* Button background */
--color-button-text       /* Button text color */
--color-modal-bg          /* Modal background */
--color-input-bg          /* Input field background */
--color-input-border      /* Input field border */
```

#### Label Chips

```css
--color-label-bg          /* Label background */
--color-label-border      /* Label border */
--color-label-text        /* Label text */
--color-label-text-muted  /* Label secondary text */
```

---

## 3D Depth & Shadow System

### Shadow Hierarchy

ProBudget uses a **6-level shadow system** for creating depth:

#### 1. Hardcoded Tailwind Shadows (Primary System)

Defined in `tailwind.config.js`:

```javascript
boxShadow: {
  'neu-3d': '0 8px 24px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  'neu-lg': '0 6px 20px rgba(0, 0, 0, 0.25), 0 3px 10px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
  'neu-sm': '0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  'neu-xs': '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
  'inner': 'inset 0 2px 6px rgba(0, 0, 0, 0.15), inset 0 1px 3px rgba(0, 0, 0, 0.1)',
  'card-hover': '0 12px 32px rgba(0, 0, 0, 0.35), 0 6px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
}
```

**Usage:**
- `shadow-neu-3d`: Main cards, sections, important containers
- `shadow-neu-lg`: Large modals, overlays
- `shadow-neu-sm`: Buttons, small cards, list items
- `shadow-neu-xs`: Subtle elements, chips, badges
- `shadow-inner`: Inset/pressed elements
- `shadow-card-hover`: Hover state for cards

#### 2. CSS Variable Shadows (Theme-Aware)

Defined in `utils/theme.ts` and available as CSS variables:

```css
--color-shadow-elevation-sm   /* Small elevation */
--color-shadow-elevation-md   /* Medium elevation */
--color-shadow-elevation-lg   /* Large elevation */
--color-shadow-elevation-xl   /* Extra large elevation */
--color-shadow-hover          /* Hover state shadow */
--color-shadow-3d             /* 3D depth shadow */
--color-shadow-3d-hover       /* 3D hover shadow */
```

#### 3. Custom CSS Classes

Defined in `index.css`:

```css
.shadow-3d-sm      /* Small 3D shadow */
.shadow-3d-md      /* Medium 3D shadow */
.shadow-3d-lg      /* Large 3D shadow */
.shadow-3d-xl      /* Extra large 3D shadow */
.shadow-3d         /* Standard 3D shadow */
.shadow-3d-hover   /* Enhanced 3D hover */
.shadow-elevated   /* Elevated with transform */
```

### Shadow Anatomy

Each shadow consists of **3 layers**:

1. **Outer Shadow (Dark)**: Creates depth below the element
   - Example: `0 8px 24px rgba(0, 0, 0, 0.3)`
   
2. **Mid Shadow (Medium)**: Softens the transition
   - Example: `0 4px 12px rgba(0, 0, 0, 0.2)`
   
3. **Inset Highlight (Light)**: Creates glossy top edge
   - Example: `inset 0 1px 0 rgba(255, 255, 255, 0.8)`

### Border 3D Effects

#### Beveled Borders

```css
.border-3d {
  border-top: 1px solid var(--color-border-highlight);
  border-left: 1px solid var(--color-border-highlight);
  border-bottom: 1px solid var(--color-border-shadow);
  border-right: 1px solid var(--color-border-shadow);
}
```

Creates a **raised/embossed** effect (light top-left, dark bottom-right).

```css
.border-3d-inset {
  border-top: 1px solid var(--color-border-shadow);
  border-left: 1px solid var(--color-border-shadow);
  border-bottom: 1px solid var(--color-border-highlight);
  border-right: 1px solid var(--color-border-highlight);
}
```

Creates a **pressed/debossed** effect (dark top-left, light bottom-right).

#### Inline Border Usage

Most components use inline Tailwind classes:

```tsx
className="border-t border-l border-b border-r 
           border-t-border-highlight 
           border-l-border-highlight 
           border-b-border-shadow 
           border-r-border-shadow"
```

---

## Typography

### Font Family

```css
font-family: 'Inter', sans-serif;
```

Loaded from Google Fonts with weights: 400, 500, 600, 700.

### Text Hierarchy

```tsx
/* Headings */
<h1 className="text-2xl font-bold text-text-primary">
<h2 className="text-xl font-semibold text-text-primary">
<h3 className="text-lg font-semibold text-text-primary">

/* Section Titles */
<h3 className="text-sm font-semibold tracking-wide uppercase text-text-dark">

/* Body Text */
<p className="text-text-secondary">
<span className="text-text-primary font-semibold">

/* Muted/Secondary */
<span className="text-text-muted">
<div className="text-sm text-text-secondary">

/* Small Text */
<span className="text-xs text-text-secondary font-medium">
```

---

## Component Styling

### Cards & Sections

#### Main Card Pattern

```tsx
<div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 
                shadow-neu-3d hover:shadow-card-hover 
                transition-shadow duration-300">
  {/* Content */}
</div>
```

**Breakdown:**
- `bg-card-bg`: Semi-transparent background
- `backdrop-blur-xl`: 24px blur for glassmorphism
- `rounded-xl`: Large border radius (12px)
- `p-5`: Padding (1.25rem)
- `shadow-neu-3d`: Strong 3D shadow
- `hover:shadow-card-hover`: Enhanced shadow on hover
- `transition-shadow duration-300`: Smooth transition

#### Task/List Item Pattern

```tsx
<div className="group flex items-center justify-between px-4 py-3 
                rounded-xl bg-card-bg backdrop-blur-sm 
                shadow-neu-sm hover:shadow-neu-lg 
                transition-shadow duration-200 hover:-translate-y-0.5">
  {/* Content */}
</div>
```

**Breakdown:**
- `group`: Enables group-hover for child elements
- `shadow-neu-sm`: Smaller shadow for list items
- `hover:shadow-neu-lg`: Larger shadow on hover
- `hover:-translate-y-0.5`: Subtle lift effect (2px up)

### Buttons

#### Primary Button

```tsx
<button className="flex items-center gap-1.5 px-3 py-2 
                   text-sm font-medium rounded-md 
                   text-white bg-brand hover:bg-brand/90 
                   transition-all transform hover:scale-105 
                   shadow-neu-sm 
                   border-t border-l border-b border-r 
                   border-t-border-highlight 
                   border-l-border-highlight 
                   border-b-border-shadow 
                   border-r-border-shadow">
  Button Text
</button>
```

#### Secondary Button

```tsx
<button className="px-6 py-3 text-sm font-medium rounded-md 
                   text-text-primary bg-surface hover:bg-surface/80 
                   transition-all shadow-neu-sm 
                   border-t border-l border-b border-r 
                   border-t-border-highlight 
                   border-l-border-highlight 
                   border-b-border-shadow 
                   border-r-border-shadow">
  Cancel
</button>
```

### Modals

```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm 
                flex items-center justify-center z-50 p-4">
  <div className="w-full max-w-md bg-surface backdrop-blur-xl 
                  p-8 rounded-xl shadow-neu-lg 
                  border-t border-l border-b border-r 
                  border-t-border-highlight 
                  border-l-border-highlight 
                  border-b-border-shadow 
                  border-r-border-shadow 
                  relative">
    {/* Modal Content */}
  </div>
</div>
```

### Headers

```tsx
<header className="bg-surface/80 backdrop-blur-xl 
                   border-b border-border-shadow 
                   shadow-neu-lg sticky top-0 z-40">
  <nav className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Navigation */}
  </nav>
</header>
```

### Input Fields

```tsx
<input 
  type="text"
  className="w-full px-4 py-2 rounded-md 
             bg-input-bg border border-input-border 
             text-text-primary 
             focus:outline-none focus:ring-2 focus:ring-accent-light"
/>
```

**Note:** Global styles in `index.css` automatically apply:
```css
input[type="text"], input[type="number"], input[type="date"], 
input[type="email"], input[type="password"], textarea, select {
  background-color: var(--color-input-bg);
  border-color: var(--color-input-border);
  color: var(--color-text-primary);
}
```

### Label Chips

```tsx
<span className="label-chip">
  Label Text
  <button className="label-chip__remove">×</button>
</span>
```

Styled via global CSS:
```css
.label-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.125rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: var(--color-label-bg);
  color: var(--color-label-text);
  border: 1px solid var(--color-label-border);
}
```

---

## Layout & Spacing

### Grid Layouts

#### Dashboard Grid (3 columns on desktop)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className="lg:col-span-1 lg:order-2">{/* Column 1 */}</div>
  <div className="lg:col-span-1 lg:order-1">{/* Column 2 */}</div>
  <div className="lg:col-span-1 lg:order-3">{/* Column 3 */}</div>
  <div className="lg:col-span-3 order-last">{/* Full width */}</div>
</div>
```

### Spacing Scale

```
gap-1    = 0.25rem (4px)
gap-2    = 0.5rem  (8px)
gap-3    = 0.75rem (12px)
gap-4    = 1rem    (16px)
gap-6    = 1.5rem  (24px)
gap-8    = 2rem    (32px)

p-2      = 0.5rem  (8px)
p-3      = 0.75rem (12px)
p-4      = 1rem    (16px)
p-5      = 1.25rem (20px)
p-6      = 1.5rem  (24px)
p-8      = 2rem    (32px)
```

### Border Radius

```
rounded-md  = 0.375rem (6px)
rounded-lg  = 0.5rem   (8px)
rounded-xl  = 0.75rem  (12px)
rounded-2xl = 1rem     (16px)
rounded-full = 9999px  (pill shape)
```

---

## Interactive States

### Hover Effects

#### Card Hover

```tsx
className="shadow-neu-3d hover:shadow-card-hover 
           transition-shadow duration-300"
```

#### Button Hover

```tsx
className="bg-brand hover:bg-brand/90 
           transform hover:scale-105 
           transition-all"
```

#### List Item Hover

```tsx
className="shadow-neu-sm hover:shadow-neu-lg 
           hover:-translate-y-0.5 
           transition-shadow duration-200"
```

### Focus States

Global focus styling in `index.css`:

```css
button:focus, input:focus, textarea:focus, select:focus {
  outline: 2px solid var(--color-accent-light);
  outline-offset: 2px;
}
```

Enhanced 3D element focus:

```css
.shadow-3d:focus-within {
  box-shadow: var(--color-shadow-3d-hover), 
              0 0 0 2px var(--color-accent-light) !important;
}
```

### Group Hover

For revealing actions on hover:

```tsx
<div className="group">
  <button className="opacity-0 group-hover:opacity-100 
                     transition-opacity">
    Edit
  </button>
</div>
```

---

## Theme System

### Available Themes

1. **Dark Blue** (default) - `theme-dark-blue`
2. **Light** - `theme-light`
3. **Dark** - `theme-dark`
4. **Custom** - `theme-custom` (user-defined)

### Theme Application

Themes are applied by setting a class on the `<html>` element:

```javascript
document.documentElement.className = 'theme-dark-blue';
```

### Custom Theme Generation

The `applyCustomTheme()` function in `utils/theme.ts` generates a complete color palette from a single base color:

```typescript
applyCustomTheme('#2563eb'); // Blue base color
```

**Generated Variables:**
- Background gradients (start/end)
- Surface colors (5 variants)
- Card backgrounds (5 opacity levels)
- Text colors (4 levels)
- Brand colors (4 shades)
- Accent colors (4 shades)
- Border colors (highlight/shadow)
- Shadow colors (light/dark + inset variants)
- All elevation shadows (sm/md/lg/xl)
- 3D shadows (standard + hover)
- Label colors
- Button colors
- Input colors

### Theme Color Relationships

```
Base Color (user selected)
  ↓
Background: base color at different lightness
  ↓
Brand: base + 150° hue rotation
  ↓
Accent: base + 180° hue rotation
  ↓
Borders: accent color with low opacity
  ↓
Shadows: black + accent highlights
```

---

## Icons & Graphics

### Icon System

Icons are React components located in `components/icons/`:

```
ActionIcons.tsx       - Edit, Delete, etc.
BellIcon.tsx         - Notifications
CalendarIcon.tsx     - Calendar/date
CardIcons.tsx        - Payment cards
CategoryIcons.tsx    - Budget categories
ChatIcon.tsx         - Chat/messaging
ChevronDownIcon.tsx  - Dropdown arrows
CloseIcon.tsx        - Close/dismiss
DotsVerticalIcon.tsx - More options menu
MenuIcon.tsx         - Hamburger menu
PaletteIcon.tsx      - Theme selector
PlusIcon.tsx         - Add actions
SettingsIcon.tsx     - Settings
SparklesIcon.tsx     - AI/magic features
SpinnerIcon.tsx      - Loading states
TrendIcons.tsx       - Up/down trends
```

### Icon Usage Pattern

```tsx
import { PlusIcon } from './icons/PlusIcon';

<button className="flex items-center gap-2">
  <PlusIcon className="w-5 h-5" />
  Add Item
</button>
```

### Icon Sizing

```
w-4 h-4   = 16px (small icons)
w-5 h-5   = 20px (standard icons)
w-6 h-6   = 24px (large icons)
w-8 h-8   = 32px (extra large icons)
```

---

## Accessibility

### Focus Indicators

All interactive elements have visible focus states:

```css
outline: 2px solid var(--color-accent-light);
outline-offset: 2px;
```

### ARIA Labels

Buttons without text content use `aria-label`:

```tsx
<button aria-label="Close modal">
  <CloseIcon className="w-5 h-5" />
</button>
```

### Color Contrast

- Text on backgrounds meets WCAG AA standards
- `text-primary`: High contrast for main content
- `text-secondary`: Medium contrast for secondary content
- `text-muted`: Low contrast for tertiary content

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows visual layout
- Focus states are clearly visible
- Modal traps focus when open

---

## Responsive Design

### Breakpoints

```
sm:  640px  (mobile landscape)
md:  768px  (tablet)
lg:  1024px (desktop)
xl:  1280px (large desktop)
```

### Mobile Optimizations

Shadow reduction on mobile (in `index.css`):

```css
@media (max-width: 768px) {
  .shadow-3d {
    box-shadow: var(--color-shadow-elevation-sm) !important;
  }
  .shadow-3d-hover {
    box-shadow: var(--color-shadow-elevation-md) !important;
  }
  .shadow-elevated {
    box-shadow: var(--color-shadow-elevation-lg) !important;
    transform: translateY(-1px);
  }
}
```

### Responsive Patterns

```tsx
/* Stack on mobile, grid on desktop */
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

/* Hide on mobile, show on desktop */
<div className="hidden lg:block">

/* Full width on mobile, fixed width on desktop */
<div className="w-full lg:w-64">

/* Smaller padding on mobile */
<div className="p-4 lg:p-8">
```

---

## Quick Reference

### Most Common Patterns

#### Card Component
```tsx
<div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 
                shadow-neu-3d hover:shadow-card-hover 
                transition-shadow duration-300">
```

#### List Item
```tsx
<div className="px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm 
                shadow-neu-sm hover:shadow-neu-lg 
                transition-shadow duration-200 hover:-translate-y-0.5">
```

#### Primary Button
```tsx
<button className="px-4 py-2 text-sm font-medium rounded-md 
                   text-white bg-brand hover:bg-brand/90 
                   transition-all transform hover:scale-105 
                   shadow-neu-sm border-t border-l border-b border-r 
                   border-t-border-highlight border-l-border-highlight 
                   border-b-border-shadow border-r-border-shadow">
```

#### Modal
```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
  <div className="bg-surface backdrop-blur-xl p-8 rounded-xl 
                  shadow-neu-lg border-t border-l border-b border-r 
                  border-t-border-highlight border-l-border-highlight 
                  border-b-border-shadow border-r-border-shadow">
```

---

## File Locations

### Core Styling Files

- **`tailwind.config.js`** - Tailwind configuration, shadow definitions
- **`index.css`** - Global styles, utility classes, 3D effects
- **`utils/theme.ts`** - Theme generation logic, color calculations
- **`index.html`** - Theme CSS variables (in old version)

### Component Files

- **`components/planner/`** - Planner-specific components
- **`components/icons/`** - All icon components
- **`components/*.tsx`** - Main UI components

---

## Troubleshooting

### Shadows Not Appearing

1. Check if dev server was restarted after `tailwind.config.js` changes
2. Verify shadow classes are spelled correctly (`shadow-neu-3d` not `shadow-3d-neu`)
3. Check if element has `position: relative` or `position: absolute` (shadows need layout context)

### Colors Not Updating

1. Verify CSS variables are set on `:root` or `html` element
2. Check theme class is applied to `<html>` element
3. Ensure `applyCustomTheme()` is called after theme selection

### Borders Not Showing 3D Effect

1. Confirm all 4 border classes are present (top, left, bottom, right)
2. Verify `border-highlight` and `border-shadow` variables are defined
3. Check border width is set (`border-t`, `border-l`, etc.)

---

## Best Practices

1. **Always use the shadow hierarchy** - Don't create custom shadows
2. **Maintain 3D borders** - Always include beveled borders on cards
3. **Use backdrop-blur** - Essential for glassmorphism effect
4. **Consistent spacing** - Use Tailwind spacing scale
5. **Theme-aware colors** - Always use CSS variables, never hardcoded colors
6. **Smooth transitions** - Add `transition-*` classes to interactive elements
7. **Group hover patterns** - Use `group` class for revealing actions
8. **Mobile optimization** - Test shadow performance on mobile devices

---

## Version History

- **v1.0** - Initial neumorphic design with hardcoded shadows
- **v2.0** - Migration to CSS variables and theme system
- **v2.1** - Enhanced 3D effects with stronger shadows (current)

---

*Last Updated: 2025-11-19*
*Maintained by: ProBudget Development Team*