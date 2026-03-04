---
description: Build award-worthy, visually exceptional frontend interfaces in HTML/CSS/JS or React. Use this skill whenever the user asks for a high-quality UI, wants to build a web app, dashboard, portfolio, landing page, or any frontend — especially when they mention "Awwwards", "not AI-looking", "professional design", "beautiful UI", "unique aesthetic", or share design reference screenshots. Use it aggressively: if the user is building anything with a visual interface, this skill applies. It produces production-grade, visually distinctive work that passes the "did a human designer make this?" test.
---

# Awwwards UI Skill

Build frontend interfaces that win design awards — visually memorable, architecturally clean, and free from AI/vibe-coded aesthetics.

---

## Phase 1: Design Thinking (Do This Before Writing Any Code)

### 1.1 Understand the User Goal
Answer these before touching code:
- **Who is this for?** What's their mental model and technical literacy?
- **What's the #1 job of this interface?** (e.g., "user understands where their money went at a glance")
- **What feeling should it evoke?** (trust, delight, power, calm, energy?)
- **What should someone remember 1 week after seeing it?**

### 1.2 Choose a Decisive Aesthetic Direction
Pick ONE direction and commit fully. Half-measures produce forgettable work.

| Direction | Signature Elements |
|---|---|
| Brutally minimal | Extreme whitespace, monospace, single accent color, no decoration |
| Editorial/magazine | Oversized type, mixed weights, column grid, pull quotes |
| Luxury/refined | Serif display font, gold/cream palette, generous margins, subtle texture |
| Retro-futuristic | Scan lines, terminal green, pixel fonts mixed with modern sans |
| Organic/natural | Earthy palette, irregular shapes, texture-heavy, handwritten accents |
| Art deco/geometric | Symmetry, ornamental borders, bold geometry, gold + black |
| Industrial/utilitarian | Monospace everything, dense data, muted palette, technical annotations |
| Playful/toy-like | Bold primaries, thick borders, fun shapes, oversized UI elements |

**Articulate your direction** in 1 sentence before coding. e.g. *"This is an editorial finance dashboard — feels like The Economist designed a budgeting tool."*

### 1.3 Anti-AI Checklist (Check Before Finalizing Design)
Before finalizing, ask yourself each of these:

- [ ] Is this font Inter, Space Grotesk, Geist, Sora, or Plus Jakarta Sans? → **Change it.**
- [ ] Do I have purple/teal gradients on dark cards? → **Rethink the palette.**
- [ ] Does every card use `border border-white/10 bg-white/5 backdrop-blur`? → **Glassmorphism is dead. Kill it.**
- [ ] Do 3+ different `<p>` tags have different class names but look identical? → **Consolidate into a type system.**
- [ ] Is the layout hero → 3-col features → CTA? → **Break the pattern.**
- [ ] Is the background a flat solid color with no texture or depth? → **Add atmosphere.**
- [ ] Does everything have `rounded-xl` or `rounded-lg`? → **Vary your border radius intentionally.**
- [ ] Does the layout look like it came from a UI kit? → **Break at least one rule.**

---

## Phase 2: Design System First

**CRITICAL RULE**: Define your design system as CSS variables + utility classes BEFORE building components. This prevents the #1 AI-frontend problem: 10 different class names for the same visual element.

### 2.1 Required CSS Architecture

Always define these in a `<style>` block at the top:

```css
/* ─── DESIGN TOKENS ─────────────────────────────── */
:root {
  /* Color palette — 3-4 colors max */
  --color-bg:        #...;
  --color-surface:   #...;
  --color-border:    #...;
  --color-text:      #...;
  --color-text-muted:#...;
  --color-accent:    #...;
  --color-accent-2:  #...;   /* optional second accent */

  /* Typography scale */
  --font-display:    'YourDisplayFont', serif;
  --font-body:       'YourBodyFont', sans-serif;
  --font-mono:       'YourMonoFont', monospace;

  --text-xs:    0.75rem;
  --text-sm:    0.875rem;
  --text-base:  1rem;
  --text-lg:    1.125rem;
  --text-xl:    1.25rem;
  --text-2xl:   1.5rem;
  --text-3xl:   1.875rem;
  --text-4xl:   2.25rem;
  --text-display: clamp(2.5rem, 6vw, 5rem);

  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;

  /* Layout */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  16px;
  --radius-pill: 9999px;
  --container:  1280px;
  --gutter:     clamp(1rem, 4vw, 3rem);

  /* Motion */
  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.87, 0, 0.13, 1);
  --duration-fast: 150ms;
  --duration-base: 300ms;
  --duration-slow: 600ms;
}
```

### 2.2 Typography Classes (Define Once, Use Everywhere)

```css
/* DEFINE THESE — then use only these for text */
.text-display  { font-family: var(--font-display); font-size: var(--text-display); line-height: 1.05; }
.text-heading  { font-family: var(--font-display); font-size: var(--text-3xl); line-height: 1.2; }
.text-subhead  { font-family: var(--font-body); font-size: var(--text-xl); font-weight: 500; }
.text-body     { font-family: var(--font-body); font-size: var(--text-base); line-height: 1.65; }
.text-small    { font-family: var(--font-body); font-size: var(--text-sm); color: var(--color-text-muted); }
.text-label    { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: 0.08em; text-transform: uppercase; }
.text-mono     { font-family: var(--font-mono); font-size: var(--text-sm); }
```

**Rule**: If you find yourself adding `opacity: 0.6` or `font-size: 0.8rem` inline, that's a sign you're missing a class. Add it to the system instead.

### 2.3 Layout Primitives

```css
.container     { max-width: var(--container); margin: 0 auto; padding: 0 var(--gutter); }
.grid-2        { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-6); }
.grid-3        { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-6); }
.grid-auto     { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-6); }
.stack         { display: flex; flex-direction: column; }
.row           { display: flex; align-items: center; }
.card          { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-6); }
```

---

## Phase 3: Atmosphere & Depth

Flat solid-color backgrounds are the #1 sign of AI-generated UI. **Always add at least one of these:**

### Background Techniques

**Noise texture overlay** (subtle grain, works on any palette):
```css
.bg-noise::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* SVG noise */
  opacity: 0.03;
  pointer-events: none;
  z-index: 9999;
}
```

**Gradient mesh** (organic, non-radial feel):
```css
background: 
  radial-gradient(ellipse 80% 60% at 20% 10%, rgba(var(--accent-rgb), 0.15) 0%, transparent 60%),
  radial-gradient(ellipse 60% 40% at 80% 90%, rgba(var(--accent2-rgb), 0.1) 0%, transparent 50%),
  var(--color-bg);
```

**Subtle grid/dot pattern**:
```css
background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
background-size: 24px 24px;
```

**Rule**: Pick ONE background technique and apply it consistently. Don't stack 3 different effects.

---

## Phase 4: Typography Rules

Typography is where award-winning designs win. Rules:

1. **Never use Inter, Roboto, Arial, or system-ui as a display font.** Use Google Fonts or @font-face for something distinctive.
2. **Pair a display font with a workhorse body font.** Contrast is the point.
3. **Use `clamp()` for responsive type**: `font-size: clamp(2rem, 5vw, 4.5rem)`
4. **Let display text BE display text** — go big. 80px headlines are not scary.
5. **Vary weights dramatically** — light body copy (300-400) next to bold headlines (700-900) creates tension.

**Vetted font pairings** (choose one, or research others):
- Display: `Fraunces` or `DM Serif Display` + Body: `DM Sans` → elegant editorial
- Display: `Bebas Neue` or `Barlow Condensed` + Body: `IBM Plex Sans` → industrial bold
- Display: `Cormorant Garamond` + Body: `Karla` → luxury refined
- Display: `Space Mono` + Body: `Space Grotesk` → technical/terminal (mono-forward)
- Display: `Playfair Display` + Body: `Source Sans 3` → classic magazine
- Display: `Syne` + Body: `Outfit` → contemporary, geometric

**Import from Google Fonts**: `@import url('https://fonts.googleapis.com/css2?family=...')`

---

## Phase 5: Motion & Interaction

Motion should feel intentional, not decorative noise.

### Motion Hierarchy
1. **Page load** — one staggered reveal of key content (CSS `animation-delay` on children)
2. **Hover states** — subtle transforms, color transitions (100–200ms)
3. **Data changes** — smooth number counting, bar growth (500–800ms)
4. **Scroll reveals** — `IntersectionObserver` + CSS class toggle

### Patterns That Work
```css
/* Fade up reveal */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.reveal { animation: fadeUp 0.6s var(--ease-out) both; }
.reveal:nth-child(2) { animation-delay: 0.1s; }
.reveal:nth-child(3) { animation-delay: 0.2s; }

/* Hover card lift */
.card { transition: transform var(--duration-base) var(--ease-out), box-shadow var(--duration-base) var(--ease-out); }
.card:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
```

**Anti-patterns to avoid**:
- `transition: all 0.3s ease` — too vague, catches unexpected properties
- Animations on page scroll that stutter on mobile
- Loading spinners as decorative elements

---

## Phase 6: Responsive Design

### Breakpoint System
```css
/* Mobile-first */
/* Base styles → mobile */
@media (min-width: 640px)  { /* sm — large phone */ }
@media (min-width: 768px)  { /* md — tablet portrait */ }
@media (min-width: 1024px) { /* lg — tablet landscape / small laptop */ }
@media (min-width: 1280px) { /* xl — desktop */ }
@media (min-width: 1536px) { /* 2xl — large desktop */ }
```

### Responsive Rules
- **Text**: Always use `clamp()` for display text. Body text: 16px base, never less than 14px
- **Grids**: Stack to single column on mobile. `grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr))`
- **Navigation**: Hamburger menu on mobile. Fixed header must not block content
- **Touch targets**: Minimum 44×44px on mobile
- **Data tables/dashboards**: Horizontal scroll on mobile OR collapse to card layout
- **Images**: Always `max-width: 100%; height: auto`

### The Resize Test
Before finishing: drag the browser from 320px to 2560px wide. Every breakpoint should feel intentional — not broken content that "survives."

---

## Phase 7: Common Component Patterns

### Dashboard/Data-heavy UIs
- Lead with the most important number (hero metric) — make it huge
- Use color to encode meaning, not decoration (red=bad, green=good, etc.)
- Provide context: "vs last month," "above average," — numbers alone are meaningless
- Progressive disclosure: summary first, detail on click/hover
- Empty states: design them intentionally

### Navigation
- Fixed or sticky nav: add a backdrop/blur when scrolled (`scroll` event listener)
- Active state must be obvious — not just a subtle color change
- Mobile: slide-in drawer, not a full-page takeover

### Forms
- Label above input, always
- Error states: red border + message below (not tooltip)
- Success states: green checkmark, not just color change
- Disable submit until valid

---

## Phase 8: Final QA Checklist

Before delivering, verify:

**Visual**
- [ ] No inline styles that should be CSS classes
- [ ] Consistent use of design tokens (no magic hex values scattered in CSS)
- [ ] Font imports are loading correctly
- [ ] Background has depth/atmosphere, not flat solid color
- [ ] At least 2 distinct font weights/styles are in use
- [ ] Hover states exist on all interactive elements

**Responsive**
- [ ] Tested at 375px, 768px, 1024px, 1440px
- [ ] No horizontal overflow at any breakpoint
- [ ] Touch targets are ≥44px on mobile
- [ ] Typography scales gracefully

**Motion**
- [ ] Page load animation exists (even subtle)
- [ ] No `transition: all` in CSS
- [ ] Animations respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

**Code quality**
- [ ] CSS variables used for all colors, spacing, fonts
- [ ] No more than 2–3 class name variants for the same visual treatment
- [ ] `<p>` tags use `.text-body` or `.text-small` — not ad-hoc inline styles
- [ ] All images have `alt` attributes

---

## Quick Reference: What Makes It Look Human-Designed

| AI/Vibe-coded | Human-designed |
|---|---|
| Inter + purple gradient | Fraunces + warm cream + deep forest green |
| `backdrop-blur` glassmorphism cards | Solid surface colors with intentional shadow depth |
| Equal spacing everywhere | Deliberate tension: tight in some areas, generous in others |
| 3-column grid for everything | Asymmetric layout, full-bleed sections, overlapping elements |
| `rounded-xl` on every element | Varied radius with intent: sharp for data, round for actions |
| Color used decoratively | Color used semantically |
| Animations on every element | 1-2 moments of choreographed motion |
| 8 shades of gray | 3-4 purposeful colors with clear roles |
