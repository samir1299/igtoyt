# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** ReelFlow
**Generated:** 2026-02-22 17:57:51
**Category:** Video Streaming/OTT

---

## Global Rules

### Color Palette

```css
/* Backgrounds */
--color-background: #080808;
--bg-elevated:      #0f0f0f;
--bg-overlay:       #161616;
--bg-hover:         rgba(255,255,255,0.04);
--bg-selected:      rgba(255,255,255,0.07);

/* Borders */
--border-subtle:    rgba(255,255,255,0.06);
--border-default:   rgba(255,255,255,0.10);
--border-strong:    rgba(255,255,255,0.18);

/* Text */
--text-primary:     rgba(255,255,255,0.95);
--text-secondary:   rgba(255,255,255,0.55);
--text-tertiary:    rgba(255,255,255,0.32);
--text-disabled:    rgba(255,255,255,0.18);

/* Accents */
--color-primary:        #00ff88;
--color-primary-dim:    rgba(0,255,136,0.12);
--color-primary-border: rgba(0,255,136,0.25);
--color-secondary:      #74b9ff;
--color-cta:            #00ff88;
--color-warning:        #ffd93d;
--color-danger:         #ff6b6b;
--color-purple:         #a29bfe;

/* Score colors */
--score-high:   #00ff88;
--score-mid:    #ffd93d;
--score-low:    #ff6b6b;
```

### Typography

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');

/* Headings h1-h3 */
font-family: 'Syne', sans-serif;
font-weight: 700;

/* Data labels, badges, scores, monospace values */
font-family: 'Space Mono', monospace;

/* Body text, paragraphs, descriptions */
font-family: system-ui, -apple-system, sans-serif;
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths (Adjusted for dark bg)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.6)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.8)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.9)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #00ff88;
  color: #000;
  font-weight: 700;
  border-radius: 8px;
  padding: 12px 24px;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary / Ghost Button */
.btn-secondary {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.8);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

/* Danger Button */
.btn-danger {
  background: rgba(255,107,107,0.10);
  border: 1px solid rgba(255,107,107,0.30);
  color: #ff6b6b;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #0f0f0f;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
}

.card:hover {
  border-color: rgba(255,255,255,0.12);
  box-shadow: var(--shadow-lg);
}
```

### Inputs

```css
.input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  color: rgba(255,255,255,0.90);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: rgba(0,255,136,0.40);
  outline: none;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Dark Mode (OLED)

**Keywords:** Dark theme, low light, high contrast, deep black, midnight blue, eye-friendly, OLED, night mode, power efficient

**Best For:** Night-mode apps, coding platforms, entertainment, eye-strain prevention, OLED devices, low-light

**Key Effects:** Minimal glow (text-shadow: 0 0 10px), dark-to-light transitions, low white emission, high readability, visible focus

### Page Pattern

**Pattern Name:** Video-First Hero

- **Conversion Strategy:** 86% higher engagement with video. Add captions for accessibility. Compress video for performance.
- **CTA Placement:** Overlay on video (center/bottom) + Bottom section
- **Section Order:** 1. Hero with video background, 2. Key features overlay, 3. Benefits section, 4. CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ Static layout
- ❌ Slow video player

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
