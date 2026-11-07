# Quick Appointments — Brand Identity & Design System Specification

![Quick Appointments Official Logo](/quick_appointments_logo.png)

## 1. Executive Logo Analysis & Visual Anatomy

An exhaustive chromatic and geometric analysis was conducted on the uploaded official **QUICK APPOINTMENTS** logo:

| Component | Visual Element | Chromatic & Typographic Interpretation | Meaning & Psychological Impact |
| :--- | :--- | :--- | :--- |
| **Calendar Stand** | 3D Perspective Wireframe Calendar | Solid Obsidian Charcoal (`#121316`) with dual rings | Stability, schedule structure, reliability, and precision. |
| **Calendar Grid** | Active Time Slot Matrix | Off-White Slate (`#F8FAFC`) with Charcoal grid dividers | Cleanliness, availability clarity, zero friction. |
| **Highlight Days** | Active Column (3 vibrant blocks) | Vivid Electric Apple / Lime Green (`#65B32E` / `#6CAB00`) | Instant booking readiness, "Available Now", speed, fresh vitality. |
| **"QUICK" Typo** | Modern Heavy Display Sans-Serif | Deep Dark Jet (`#111114`) with custom geometric cut | High authority, modern tech aesthetic, punchy brand presence. |
| **"Q" Dynamic Slash**| Accent diagonal tail | Vivid Lime Green (`#65B32E`) cutting through dark letterform | Symbolizes momentum, immediate action, and forward agility. |
| **"— APPOINTMENTS —"**| Geometric tracking with Chevron-A | Vibrant Brand Green (`#5DAA00` to `#65B32E`) framed by horizontal hairline accents | Professionalism, balance, precision booking. |

---

## 2. Color Palette & Token Architecture

The design system is rigorously derived from the official logo with AAA-compliant contrast ratios across light and dark modes.

```
+---------------------------------------------------------------------------------------+
| BRAND PRIMARY (Vibrant Green)                                                         |
| #65B32E (Core)  |  #529624 (Dark/Hover)  |  #7ECE3E (Light/Accent)  |  #F1F9EC (Soft Tint) |
+---------------------------------------------------------------------------------------+
| BRAND NEUTRALS (Obsidian & Charcoal)                                                  |
| #111114 (Jet)   |  #1E2024 (Charcoal)    |  #3F424A (Muted Text)    |  #717684 (Subtle)    |
+---------------------------------------------------------------------------------------+
| SURFACES & CANVAS                                                                     |
| #FFFFFF (Card)  |  #F8FAFC (App Canvas)  |  #F1F4F8 (Muted Surface) |  #E2E8F0 (Border)    |
+---------------------------------------------------------------------------------------+
| FUNCTIONAL STATUS TOKENS                                                              |
| Success: #16A34A (Emerald)               | Warning: #F59E0B (Amber)                   |
| Error:   #DC2626 (Crimson)               | Info:    #0284C7 (Sky Blue)                |
+---------------------------------------------------------------------------------------+
```

### Complete Hex & HSL Design Tokens

```json
{
  "colors": {
    "brand": {
      "50": "#F1F9EC",
      "100": "#DEF1D4",
      "200": "#BEE4A9",
      "300": "#9DD47B",
      "400": "#80C551",
      "500": "#65B32E", 
      "600": "#529624",
      "700": "#417A1C",
      "800": "#305C14",
      "900": "#21400D",
      "950": "#102106"
    },
    "dark": {
      "950": "#0D0E10",
      "900": "#121316",
      "800": "#1E2024",
      "700": "#2B2D33",
      "600": "#3F424A",
      "500": "#585C66",
      "400": "#717684",
      "300": "#969BA7",
      "200": "#C3C7D0",
      "100": "#E3E5EB",
      "50": "#F4F5F7"
    },
    "surface": {
      "light": "#FFFFFF",
      "canvas": "#F8FAFC",
      "muted": "#F1F5F9",
      "border": "#E2E8F0",
      "darkCard": "#181A1F",
      "darkCanvas": "#0E1013",
      "darkBorder": "#282B33"
    },
    "feedback": {
      "success": "#16A34A",
      "successBg": "#ECFDF5",
      "warning": "#F59E0B",
      "warningBg": "#FFFBEB",
      "error": "#DC2626",
      "errorBg": "#FEF2F2",
      "info": "#0284C7",
      "infoBg": "#F0F9FF"
    }
  }
}
```

---

## 3. Typography & Scale Hierarchy

- **Primary Display Font**: Plus Jakarta Sans / Inter Display (Geometric, modern, bold, matching "QUICK")
- **Primary Body Font**: Inter / Plus Jakarta Sans (High legibility, clean numbers, tabular figures for time slots)
- **Code / Monospace**: JetBrains Mono (For IDs, booking reference numbers, transaction codes)

| Level | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | 32px / 2rem | 800 (ExtraBold) | 1.2 | Splash, Landing, Onboarding Headline |
| **Title 1 (H1)** | 24px / 1.5rem | 700 (Bold) | 1.25 | Screen headers, Dashboard main KPIs |
| **Title 2 (H2)** | 20px / 1.25rem | 600 (SemiBold) | 1.3 | Card titles, Section heads |
| **Title 3 (H3)** | 16px / 1.0rem | 600 (SemiBold) | 1.4 | List titles, Modal headers |
| **Body Large** | 15px / 0.9375rem | 400/500 | 1.5 | Primary descriptions, Form inputs |
| **Body Regular** | 14px / 0.875rem | 400 | 1.5 | Default body text, Provider bios |
| **Caption** | 12px / 0.75rem | 500 | 1.4 | Badges, Timestamp labels, Slot duration |
| **Micro** | 10px / 0.625rem | 600 | 1.2 | Status pills, Notification counts |

---

## 4. Component Visual Identity Rules

1. **Service & Provider Cards**:
   - Background: Pure White (`#FFFFFF`) with subtle outer ring `border border-slate-200/80`.
   - Corner Radius: 16px (`rounded-2xl`) for mobile, 12px (`rounded-xl`) for admin.
   - Elevation: Subtle ambient shadow `0 2px 8px -2px rgba(18, 19, 22, 0.05)`.
   - Accent: Active time slots & selected dates use Brand Green (`#65B32E`) with pure white bold text.

2. **Buttons & Interactive Controls**:
   - **Primary Action**: Solid `#65B32E` background, `#FFFFFF` text, bold weight, smooth tap scale transition (`0.98`), hover shadow `#65B32E33`.
   - **Secondary Action**: Obsidian Charcoal `#121316` background, `#FFFFFF` text.
   - **Outline / Ghost**: 1.5px border `#E2E8F0`, dark text, hover `#F1F9EC` with `#65B32E` text.

3. **Time Slot Selector Matrix**:
   - **Available Slot**: White pill with 1px border `#E2E8F0`, dark text.
   - **Selected Slot**: Solid `#65B32E`, white text, soft glow ring `#65B32E40`.
   - **Reserved / Expiring Slot**: Amber border `#F59E0B`, warning tag.
   - **Booked / Disabled Slot**: Muted background `#F1F5F9`, muted slash `#94A3B8`, non-interactive.

4. **Multi-Role Experience**:
   - **Customer Mode**: Clean, inviting, service discovery-focused, breezy spacing.
   - **Provider Mode**: High-density operational cockpit, quick slot toggle, live request sheet, instant earnings overview.
   - **Admin Console**: Professional SaaS command center with KPI widgets, audit tables, verification drawer, and granular commission sliders.
