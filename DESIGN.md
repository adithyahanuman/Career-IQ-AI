---
name: Midnight Slate & Neon Cobalt
colors:
  surface: '#0f1417'
  surface-dim: '#0f1417'
  surface-bright: '#353a3d'
  surface-container-lowest: '#0a0f12'
  surface-container-low: '#171c1f'
  surface-container: '#1b2023'
  surface-container-high: '#262b2e'
  surface-container-highest: '#313539'
  on-surface: '#dfe3e7'
  on-surface-variant: '#c5c6ca'
  inverse-surface: '#dfe3e7'
  inverse-on-surface: '#2c3134'
  outline: '#8f9194'
  outline-variant: '#44474a'
  surface-tint: '#c6c6c9'
  primary: '#c6c6c9'
  on-primary: '#2f3133'
  primary-container: '#1a1c1e'
  on-primary-container: '#838486'
  inverse-primary: '#5d5e61'
  secondary: '#afc6ff'
  on-secondary: '#002d6c'
  secondary-container: '#005ed0'
  on-secondary-container: '#d5e0ff'
  tertiary: '#ffb3b0'
  on-tertiary: '#68000f'
  tertiary-container: '#410006'
  on-tertiary-container: '#e05456'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e5'
  primary-fixed-dim: '#c6c6c9'
  on-primary-fixed: '#1a1c1e'
  on-primary-fixed-variant: '#454749'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#afc6ff'
  on-secondary-fixed: '#001a43'
  on-secondary-fixed-variant: '#004398'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#410006'
  on-tertiary-fixed-variant: '#8c1520'
  background: '#0f1417'
  on-background: '#dfe3e7'
  surface-variant: '#313539'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  mono-label:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  unit-1: 4px
  unit-2: 8px
  unit-4: 16px
  unit-6: 24px
  unit-8: 32px
  unit-12: 48px
  margin-desktop: 24px
  margin-mobile: 16px
  gutter: 16px
---

## Brand & Style
The design system is engineered for high-fidelity 3D architecture and motion graphics environments. The brand personality is precise, technical, and high-performance, evoking the feel of a premium digital workstation. It blends **Modernism** with **Glassmorphism** to create a structured, architectural depth that feels both physical and digital.

The target audience consists of architects, motion designers, and technical directors who require a UI that stays out of the way of their creative work while remaining highly legible and responsive. The emotional response should be one of "controlled power"—a sophisticated, dark environment where the tools feel as sharp as the output they produce.

## Colors
The palette is built on a high-contrast foundation to ensure technical data remains legible in dark environments.

- **Primary (Deep Slate):** The bedrock of the interface. Used for large surface areas and background layers to reduce eye strain.
- **Action (Neon Cobalt):** The primary interactive color. It signifies motion, selection, and active states. It should appear to "glow" against the Deep Slate.
- **Highlight (Accent Ember):** Used sparingly for destructive actions, critical alerts, or key performance indicators that require immediate attention.
- **Text/Borders (Glass White):** A slightly cool, high-luminance white. Used for primary content and structural dividers with varying levels of opacity.

## Typography
The system utilizes **Hanken Grotesk** for its sharp, contemporary geometry and professional clarity. For technical data, coordinates, and code-based inputs, **Geist** provides a developer-friendly monospaced alternative that ensures character distinction (e.g., 0 vs O).

Headlines should use tight tracking to emphasize the structural nature of the brand. Body text maintains generous line height for readability against dark backgrounds. Labels and metadata should always be uppercase when using the monospaced font to differentiate them from interactive UI elements.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for utility panels and a **Fluid Grid** for the primary viewport. This mimics professional creative software where tools are docked and the canvas expands.

- **Desktop:** A 12-column system with fixed-width sidebars (typically 280px or 320px).
- **Tablet:** A 12-column system with collapsible sidebars.
- **Mobile:** A 4-column fluid system with simplified toolbars.

Spacing is strictly based on a 4px baseline grid to maintain architectural precision. All component margins and paddings must be multiples of 4.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Glassmorphism**, rather than traditional drop shadows.

1.  **Base Layer (Deep Slate):** The application canvas.
2.  **Surface Layer:** Panels and sidebars use a slightly lighter slate with a 1px Glass White border at 10% opacity.
3.  **Floating Layer:** Modals and tooltips use a backdrop blur (20px) and a semi-transparent background to maintain context of the 3D space behind them.
4.  **Active State:** Elements in focus or "selected" gain a 1px outer glow in Neon Cobalt, creating a sense of electronic activation.

## Shapes
Shapes are governed by "Soft" geometry (0.25rem / 4px). This small radius maintains a professional, engineered look while avoiding the aggressive sharpness of pure 90-degree angles. 

Buttons and input fields should strictly adhere to the `rounded-sm` (4px) or `rounded-md` (8px) rules. Circles are reserved exclusively for status indicators and user avatars.

## Components
- **Buttons:** Primary buttons use a solid Neon Cobalt fill with Glass White text. Secondary buttons are "Ghost" style with a 1px Glass White border.
- **Inputs:** Darker than the surface layer with a 1px bottom border. On focus, the border transitions to Neon Cobalt with a subtle 2px blur "neon" underline.
- **Chips:** Used for scene tags or layer properties. They feature a monospaced font and a semi-transparent Neon Cobalt background.
- **Lists/Trees:** Essential for layer management. Use 16px indentations per level. Active layers are highlighted with a vertical Neon Cobalt stripe on the left edge.
- **Cards:** Used for asset libraries. Cards feature a 1px internal border and no shadows. Hovering over a card increases the border opacity from 10% to 40%.
- **Timeline/Playhead:** A custom component specific to motion graphics. The playhead is a 2px Neon Cobalt vertical line with an Accent Ember "needle" head for high visibility.