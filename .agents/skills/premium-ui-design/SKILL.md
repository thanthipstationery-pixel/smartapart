---
name: premium-ui-design
description: Enforces premium, high-quality, modern, and non-AI-looking CSS UI/UX design guidelines for web applications. Apply this skill whenever editing, styling, or creating user interfaces (HTML/CSS/JS) to ensure stunning, professional aesthetics.
---

# Premium UI/UX Design System Guidelines

This skill guides the AI to write front-end styles (CSS, HTML) that look clean, modern, and professionally designed by humans. It prevents generic "AI-like" layouts and color treatments.

## 1. Visual Polish & Aesthetic Guidelines

### Typography
- Never use default browser sans-serif styles without proper weighting.
- Preferred font stacks: `Outfit`, `Inter`, or `Roboto`.
- Keep clean hierarchy:
  - Titles (`h1`, `h2`): Large, semi-bold or bold, with tight letter-spacing (`letter-spacing: -0.02em`).
  - Body text: Neutral color (`var(--text-secondary)`), optimal line-height (`1.5` to `1.6`) for reading.

### Color Palette (No Boring Primary Colors)
- Refuse default red, blue, green, and yellow.
- Use curated HSL palette overrides:
  - **Primary**: Slate/Indigo blend (`#4f46e5` to `#3b82f6`).
  - **Backgrounds**: Slate base (`#0f172a` for dark, `#f8fafc` for light) rather than pure black or pure white.
  - **Status Indicators**:
    - Vacant: Emerald Mint (`#10b981` with soft light-green background).
    - Occupied: Soft Indigo Blue (`#3b82f6` with light-blue background).
    - Overdue/Unpaid: Crimson Rose (`#f43f5e` with light-pink background).
    - Maintenance: Cool Gray/Slate (`#64748b` with soft gray background).

### Soft Shadows & Borders (Depth)
- Use thin, high-contrast borders:
  - Light mode: `1px solid rgba(0, 0, 0, 0.06)`
  - Dark mode: `1px solid rgba(255, 255, 255, 0.08)`
- Shadows should be soft, large-radius, and semi-transparent rather than solid and dark:
  - `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`

### Glassmorphism
- Apply glass effects for floating panels, headers, and modal overlays:
  - `background: rgba(var(--card-bg-rgb), 0.7)`
  - `backdrop-filter: blur(12px)`

---

## 2. Dynamic Interactions & Micro-Animations

- Every interactive element (buttons, cards, links, tabs) **MUST** have smooth transition rules:
  - `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);`
- **Hover effects**:
  - Buttons: Slight brightness increase, subtle shift (`transform: translateY(-1px)`).
  - Cards: Soft elevation raise (`box-shadow` expands, `transform: translateY(-2px)`).
- **Active / Click state**:
  - Direct feedback on click: `transform: scale(0.98)` or `transform: scale(0.97)` for buttons.
- **Focus Rings**:
  - Reframe text input focus state with soft outer glow:
    - `border-color: var(--primary-color)`
    - `box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15)`

---

## 3. Responsive Fluid Layouts

- Always ensure form inputs and layouts wrap gracefully without pixel-perfect hardcoding.
- Prefer `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` to let containers scale naturally.
- Shrink paddings and gaps on mobile:
  - Desktop: `padding: 1.5rem` or `2rem`, `gap: 1.5rem`.
  - Mobile: `padding: 1rem` or `0.75rem`, `gap: 0.75rem`.
- In scrollable elements (like tables), always style scrollbars to match the light/dark theme:
  - `scrollbar-width: thin;`
  - `scrollbar-color: var(--border-color) transparent;`
