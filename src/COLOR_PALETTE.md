# ModuLearn Color Palette

## Core Roles

| Role                | Color            | Hex       | CSS Token          |
|---------------------|------------------|-----------|--------------------|
| Primary / Dark      | Deep Forest Green| `#18372E` | `--ml-primary`     |
| Primary Button      | Emerald Green    | `#16845B` | `--ml-accent`      |
| Secondary / Soft    | Pale Mint        | `#E4F4EC` | `--ml-surface-alt` |
| Page Background     | Very Light Mint  | `#EAF8F1` | `--ml-page-bg`     |
| Card / Surface      | White            | `#FFFFFF` | `--ml-card-bg`     |
| Main Text           | Deep Green       | `#18372E` | `--ml-text`        |
| Secondary Text      | Muted Blue-Gray  | `#607A82` | `--ml-text-secondary` |
| Border              | Soft Green-Gray  | `#D7E7DF` | `--ml-border`      |

---

## 60-30-10 Rule

| Share | Family              | Colors                                    | Usage                        |
|-------|---------------------|-------------------------------------------|------------------------------|
| 60 %  | Light surfaces      | `#EAF8F1` page bg, `#FFFFFF` cards        | Page background, cards, fields|
| 30 %  | Deep forest green   | `#18372E` (+ `#0E2A21` gradient partner)  | Brand panels, headers, structure |
| 10 %  | Emerald green       | `#16845B` (+ `#116A46` pressed, `#1E9A6D` hover) | CTAs, links, focus rings, accents |
| —     | Pale mint soft      | `#E4F4EC`                                 | Section cards, soft surfaces |

---

## Component Tokens

| Token                 | Value       | Used By                       |
|-----------------------|-------------|-------------------------------|
| `--ml-page-bg`        | `#EAF8F1`   | Auth / register page background |
| `--ml-surface`        | `#FFFFFF`   | Inputs, form fields           |
| `--ml-surface-alt`    | `#E4F4EC`   | Section cards (reg form)      |
| `--ml-card-bg`        | `#FFFFFF`   | Login card                    |
| `--ml-border`         | `#D7E7DF`   | Borders, dividers             |
| `--ml-primary`        | `#18372E`   | Brand/header panels, headings |
| `--ml-primary-hover`  | `#1F4739`   | Hover on dark green elements  |
| `--ml-primary-deep`   | `#0E2A21`   | Gradient partner for panels   |
| `--ml-on-primary`     | `#FFFFFF`   | Text on dark green            |
| `--ml-on-primary-soft`| `#E4F4EC`   | Subtle text on dark green     |
| `--ml-accent`         | `#16845B`   | Primary button, links, focus  |
| `--ml-accent-hover`   | `#1E9A6D`   | Hover / focus rings           |
| `--ml-accent-active`  | `#116A46`   | Active / pressed              |
| `--ml-glow`           | rgba(22,132,91,0.4)  | Avatar glow, shadows     |
| `--ml-focus-ring`     | rgba(22,132,91,0.3)  | Input focus rings        |
| `--ml-text`           | `#18372E`   | Primary text on light         |
| `--ml-text-secondary` | `#607A82`   | Secondary text                |
| `--ml-text-muted`     | `#8AA99F`   | Placeholders, muted text      |

---

## When to Use What

| Component        | bg                          | text              | accent                  |
|------------------|-----------------------------|-------------------|-------------------------|
| Page background  | Very Light Mint `#EAF8F1`   | Deep Green        | —                       |
| Card / panel     | White `#FFFFFF`             | Deep Green        | Emerald Green           |
| Brand/header     | `#18372E` → `#0E2A21`       | White / Pale Mint | Pale Mint `#E4F4EC`     |
| Section card     | Pale Mint `#E4F4EC`         | Deep Green        | Emerald Green           |
| Primary button   | Emerald Green `#16845B`     | White             | —                       |
| Input            | White                       | Deep Green        | Emerald focus ring      |
| Link             | —                           | Emerald `#116A46` | Emerald `#1E9A6D` hover |
| Border/dividers  | —                           | —                 | Soft Green-Gray `#D7E7DF` |

---

> All colors live once in `:root` in `src/index.css`. Change a `--ml-*` value there to re-theme the entire app.