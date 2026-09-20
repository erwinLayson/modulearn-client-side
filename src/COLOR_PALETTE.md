# ModuLearn Color Palette

## Core Roles

| Role                | Color            | Hex       | CSS Token          |
|---------------------|------------------|-----------|--------------------|
| Primary / Structure | Deep Navy        | `#0B2A5B` | `--ml-primary`     |
| Primary Button      | Bright Blue      | `#0D6EFD` | `--ml-accent`      |
| Secondary / Soft    | Light Blue       | `#E8F1FF` | `--ml-surface-alt` |
| Page Background     | Very Light Gray  | `#F8FAFC` | `--ml-page-bg`     |
| Card / Surface      | White            | `#FFFFFF` | `--ml-card-bg`     |
| Main Text           | Dark Navy        | `#0F172A` | `--ml-text`        |
| Secondary Text      | Muted Slate      | `#64748B` | `--ml-text-secondary` |
| Border              | Light Gray       | `#E2E8F0` | `--ml-border`      |

---

## 60-30-10 Rule

| Share | Family              | Colors                                    | Usage                        |
|-------|---------------------|-------------------------------------------|------------------------------|
| 60 %  | Light surfaces      | `#F8FAFC` page bg, `#FFFFFF` cards        | Page background, cards, fields|
| 30 %  | Deep navy           | `#0B2A5B` (+ `#061D3F` gradient partner)  | Brand panels, headers, structure |
| 10 %  | Bright blue         | `#0D6EFD` (+ `#0A52B5` pressed, `#0B5ED7` hover) | CTAs, links, focus rings, accents |
| —     | Light blue soft     | `#E8F1FF`                                 | Section cards, soft surfaces |

---

## Component Tokens

| Token                 | Value       | Used By                       |
|-----------------------|-------------|-------------------------------|
| `--ml-page-bg`        | `#F8FAFC`   | Auth / register page background |
| `--ml-surface`        | `#FFFFFF`   | Inputs, form fields           |
| `--ml-surface-alt`    | `#E8F1FF`   | Section cards, soft surfaces  |
| `--ml-card-bg`        | `#FFFFFF`   | Login card                    |
| `--ml-border`         | `#E2E8F0`   | Borders, dividers             |
| `--ml-primary`        | `#0B2A5B`   | Brand/header panels, headings |
| `--ml-primary-hover`  | `#0D3578`   | Hover on dark elements        |
| `--ml-primary-deep`   | `#061D3F`   | Gradient partner for panels   |
| `--ml-on-primary`     | `#FFFFFF`   | Text on dark navy             |
| `--ml-on-primary-soft`| `#E8F1FF`   | Subtle text on dark navy      |
| `--ml-accent`         | `#0D6EFD`   | Primary button, links, focus  |
| `--ml-accent-hover`   | `#0B5ED7`   | Hover / focus rings           |
| `--ml-accent-active`  | `#0A52B5`   | Active / pressed              |
| `--ml-glow`           | rgba(13,110,253,0.4) | Avatar glow, shadows  |
| `--ml-focus-ring`     | rgba(13,110,253,0.3) | Input focus rings       |
| `--ml-text`           | `#0F172A`   | Primary text on light         |
| `--ml-text-secondary` | `#64748B`   | Secondary text                |
| `--ml-text-muted`     | `#94A3B8`   | Placeholders, muted text      |

---

## Status Colors

| Status   | Color       | Background  | Border      | CSS Token           |
|----------|-------------|-------------|-------------|---------------------|
| Success  | `#16A34A`   | `#F0FDF4`   | `#BBF7D0`   | `--ml-success`      |
| Warning  | `#F59E0B`   | `#FFFBEB`   | `#FDE68A`   | `--ml-warning`      |
| Error    | `#DC2626`   | `#FEF2F2`   | `#FECACA`   | `--ml-error`        |
| Info     | `#0D6EFD`   | `#EFF6FF`   | `#BFDBFE`   | `--ml-info`         |

---

## When to Use What

| Component        | bg                          | text              | accent                  |
|------------------|-----------------------------|-------------------|-------------------------|
| Page background  | Very Light Gray `#F8FAFC`   | Dark Navy         | —                       |
| Card / panel     | White `#FFFFFF`             | Dark Navy         | Bright Blue             |
| Brand/header     | `#0B2A5B` → `#061D3F`       | White / Light Blue| Light Blue `#E8F1FF`    |
| Section card     | Light Blue `#E8F1FF`        | Dark Navy         | Bright Blue             |
| Primary button   | Bright Blue `#0D6EFD`       | White             | —                       |
| Input            | White                       | Dark Navy         | Bright Blue focus ring  |
| Link             | —                           | Bright Blue `#0D6EFD` | Darker blue hover  |
| Border/dividers  | —                           | —                 | Light Gray `#E2E8F0`    |

---

## Inline Color Constants

For TypeScript components using inline styles, import from `constant/colors.ts`:

```typescript
import { COLORS } from "../../constant/colors";

// Usage
style={{ color: COLORS.present }}
style={{ background: COLORS.accent }}
```

---

> All CSS colors live once in `:root` in `src/styles/tokens.css`. Change a `--ml-*` value there to re-theme the entire app. Inline colors are centralized in `src/constant/colors.ts`.
