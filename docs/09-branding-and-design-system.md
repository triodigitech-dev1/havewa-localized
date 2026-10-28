# 09. Branding, Visual Identity & Design System Guide

This guide details Localea's visual identity, color architecture, full logo presentation, typography standards, and user experience rules.

---

## 1. Visual Identity & Brand Philosophy

Localea is engineered for professional property managers, private landlords, and institutional condominium administrators. The visual language conveys institutional trust, financial precision, and effortless clarity.

### Color Architecture

| Token | Theme Value (Light) | Theme Value (Dark) | Role / Context |
| :--- | :--- | :--- | :--- |
| **Primary (Forest Emerald)** | `oklch(0.38 0.12 165)` | `oklch(0.75 0.15 160)` | Core brand identity, primary CTA buttons, active navigation states, financial credit indicators. |
| **Accent / Brass** | `oklch(0.68 0.16 75)` | `oklch(0.75 0.16 75)` | Premium indicators, advisory badges, highlights. |
| **Success (Guthaben)** | `oklch(0.45 0.14 150)` | `oklch(0.65 0.16 150)` | Tenant credit balances, overpayments, completed work orders. |
| **Destructive / Arrears** | `oklch(0.55 0.22 25)` | `oklch(0.65 0.22 25)` | Overdue rents, dunning warnings, emergency maintenance. |
| **Background / Canvas** | `oklch(0.985 0.005 160)` | `oklch(0.14 0.02 160)` | Crisp, clean contrast background with subtle emerald-tinted warmth. |

---

## 2. Logo Presentation & The Full Crest

To maintain brand dignity, Localea avoids cropping the official 2K crest into tiny circular cutouts:

- **Component**: `<BrandLogo size="sm" | "md" | "lg" | "xl" showSubtitle={boolean} />` (`src/components/brand-logo.tsx`).
- **Aspect Ratio & Framing**:
  - Employs `rounded-xl` or `rounded-2xl` squircle framing with an subtle golden brass ring border (`ring-amber-500/20`).
  - Uses `object-cover` with high-resolution source assets (`/assets/aistudio/Localea_Rental_Management_logo_d__df7299e3_2K_46e38a94.jpg`).
  - Displays the full **Localea** wordmark alongside the descriptive tag: *"Rental & Property Management"*.
- **Sidebar Integration**: The navigation sidebar presents the full uncropped emblem and title prominently at the top of the viewport.

---

## 3. Login & Setup Screen Experience

Previous mobile views presented a floating cinema control stack along the bottom of the screen, which obscured inputs and cluttered the view.

### Clean Top-Right Toggle & Pure CSS Auto-Responsive Videos
- **Floating Bottom Stack Removed**: The redundant bottom playback dock has been disabled.
- **Pure CSS Auto-Responsive Video & Banner Variations**:
  - **Mobile Screens (`< 640px`)**: The remade vertical video (`720 × 1280`) fits the entire 16:9 scene cleanly across the phone's width with an ambient Gaussian-blurred extension filling the top and bottom. No sides are cut off, and the entire scene is 100% visible on smartphones (`block sm:hidden`).
  - **Tablet Screens (`640px – 1023px`)**: The remade tablet video (`960 × 720`, 4:3) fits the entire scene with ambient Gaussian-blurred extension filling the frame (`hidden sm:block lg:hidden`).
  - **Desktop Screens (`>= 1024px`)**: The native 16:9 widescreen video (`1280 × 720`) plays full-bleed across wide monitors (`hidden lg:block`).
  - **Zero Manual Buttons**: No device switcher buttons clutter the header. Responsive styling auto-responds purely based on the screen's viewport.
- **Top-Right Quick Toggle**:
  - Displays **"Hide Sign-in Form"** (`EyeOff`) when the form is active.
  - Displays **"Show Sign-in Form"** (`Eye`) when the form is hidden, allowing the full backdrop showcase to be viewed unobstructed.
- **Zero Squeezing**: Form cards use generous padding (`p-8 md:p-10`), crystal glass styling with high contrast, and full-width touch targets.

---

## 4. Typography & Numerical Precision

Real estate accounting demands unambiguous visual hierarchy:

1. **Tabular Numerals (`font-mono` / `tabular-nums`)**:
   - All financial figures, bank IBANs, rent amounts, square meter values, and running balances utilize monospace tabular alignment.
   - Decimals align vertically down columns to allow instant scanning of debits vs. credits.
2. **Unsqueezed Table Architecture**:
   - Complex data tables (Ledgers, Leases, Maintenance) incorporate `whitespace-nowrap` on action buttons and key metrics.
   - Action buttons (e.g. WhatsApp Reminder, Record Payment, View Lease) are given dedicated breathing room rather than being hidden in buried sub-menus.
3. **Zero-Pill Discipline**:
   - Badges and cards use clean rounded corners (`rounded-lg` or `rounded-xl`) rather than rounded pill shapes, reinforcing architectural solidity and professional software standards.
