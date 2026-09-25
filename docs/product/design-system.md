# VyaparOS — Design System & UI/UX Guidelines

## 1. Design Philosophy
VyaparOS is designed as a **premium, production-grade operating system for Indian small businesses, Kiranas, wholesalers, and distributors**. 

The interface draws inspiration from high-polish financial and developer tools (Stripe, Linear, Razorpay, Notion) while remaining tailored to the day-to-day speed, touch ergonomics, and multilingual requirements of Indian merchants.

### Core Principles:
- **Restrained & Calm:** Neutral backgrounds (slate/zinc) with purposeful semantic color highlights. No visual clutter, neon over-saturation, or gratuitous gradients.
- **Financial Clarity:** Currency amounts (`₹`) use high-legibility tabular figures, clear debit (`Dena Hai` / Rose-Crimson) and credit (`Lena Hai` / Emerald) hierarchy.
- **Fast & Tactile:** Snappy micro-interactions (150–200ms ease-out transitions), smooth number counting on metric load, and keyboard-first shortcuts (`Ctrl+K`).
- **Mobile-First Touch Ergonomics:** Large 44px+ touch targets, one-handed bottom navigation, and a central floating `+` action for shop counter usage.
- **Multilingual By Default:** Seamless typography across English, Hindi, Marathi, and Hinglish.

---

## 2. Color Palette & Semantic Tokens

### Backgrounds & Surfaces
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--bg-canvas` | `#F8FAFC` (slate-50) | `#0B0F19` (slate-950) | Main viewport canvas |
| `--bg-surface` | `#FFFFFF` | `#111827` (slate-900) | Cards, Modals, Drawers, Sidebars |
| `--bg-subtle` | `#F1F5F9` (slate-100) | `#1E293B` (slate-800) | Hover states, pill badges, input backgrounds |
| `--border-subtle` | `#E2E8F0` (slate-200) | `#1E293B` (slate-800) | Standard borders, divider lines |

### Brand & Semantic Colors
| Semantic Role | Primary Hue | Tailwind Class | Commercial Meaning |
|---|---|---|---|
| **Primary Brand** | Sapphire Blue (`#0284C7` / `#2563EB`) | `bg-vyapar-600` / `text-vyapar-600` | Navigation, primary buttons, brand accents |
| **Success / Lena Hai** | Emerald Forest (`#059669` / `#10B981`) | `bg-emerald-600` / `text-emerald-600` | Collections received, positive receivables |
| **Danger / Dena Hai** | Ruby Crimson (`#E11D48` / `#F43F5E`) | `bg-rose-600` / `text-rose-600` | Credit given (Udhar), payables, void reversals |
| **Warning / Due** | Amber Ochre (`#D97706` / `#F59E0B`) | `bg-amber-500` / `text-amber-500` | Overdue credit limits, offline status alerts |
| **Info / Tech** | Sky Cyan (`#0284C7` / `#38BDF8`) | `bg-sky-500` / `text-sky-500` | Tooltips, audit tags, platform sync info |

---

## 3. Typography Scale & Hierarchy

We use **Inter** with native fallback to system UI sans-serif fonts supporting Devanagari Unicode.

| Level | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| **Display** | 36px / 2.25rem | 900 (Black) | 1.15 | Dashboard primary KPI balance, Hero titles |
| **H1** | 24px / 1.5rem | 800 (Extrabold) | 1.2 | Page titles, Modal headers |
| **H2** | 18px / 1.125rem | 700 (Bold) | 1.3 | Card headers, Section titles |
| **H3** | 15px / 0.9375rem | 600 (Semibold) | 1.4 | Table column headers, Subsections |
| **Body** | 14px / 0.875rem | 400 / 500 | 1.5 | Main body copy, table row values, inputs |
| **Small / Mono** | 12px / 0.75rem | 500 / 600 | 1.4 | Metadata, badges, timestamps, audit tags |
| **Caption** | 11px / 0.6875rem | 600 (Semibold) | 1.3 | Stat comparison captions, uppercase labels |

---

## 4. Spacing & Elevation Scale

- **Corner Radii:**
  - `rounded-lg` (8px): Inputs, buttons, small dropdown items.
  - `rounded-xl` (12px): Modals, cards, command palette items, notification toasts.
  - `rounded-2xl` (16px): Large overview stat cards, container panels.
  - `rounded-full` (9999px): Status pills, avatar circles, language chips.
- **Elevation (Shadows):**
  - Subtle borders (`border border-slate-200/80 dark:border-slate-800/80`) are the primary boundary mechanism.
  - `shadow-xs`: Buttons, interactive inputs.
  - `shadow-sm`: Dashboard cards.
  - `shadow-xl`: Modals, Command Palette, Toasts.

---

## 5. Animation & Motion Guidelines

All animations utilize GPU-accelerated properties (`transform`, `opacity`):

1. **Page Transitions:** 180ms ease-out fade + 4px vertical slide.
2. **Number Counters (`NumberCounter`):** 600ms spring-interpolated counter for financial metric cards on load.
3. **Modals & Drawers:** 200ms scale (`0.97 -> 1.0`) + opacity (`0 -> 1`).
4. **Command Palette (`Ctrl+K`):** 150ms instant display with smooth item highlight.
5. **Toast Notifications:** 250ms slide-in from bottom-right with auto-dismiss progress.
6. **Accessibility (`prefers-reduced-motion`):** Automatically degrades to immediate state changes without motion when users have motion sensitivity enabled.

---

## 6. Layout & Shell Architecture

- **Desktop (1024px+):**
  - Collapsible 256px Sidebar with live `BusinessSwitcher` and animated active pill.
  - Top Navigation with search trigger (`Ctrl+K`), Online status pill, and interactive `LanguageSwitch`.
- **Mobile (360px – 768px):**
  - Top condensed brand header with quick language selector.
  - Sticky bottom navigation with high-visibility central `+` action button for recording instant Khata transactions.
