# GRE Verbal Trainer — Frontend Specification

Build-ready spec for the frontend. It pairs with `BACKEND.md` and consumes that API exactly (same routes, payloads, enums). This document covers stack, the full design system (palette, type, spacing, components), every screen, mobile-responsive rules, state/data handling, and the install-to-phone (PWA) setup.

The app is **mobile-first** — it is primarily used on a phone — and scales up cleanly to desktop.

---

## 1. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (design tokens in `tailwind.config.ts` + CSS vars) |
| Data fetching | TanStack Query (React Query) over a typed `fetch` client |
| Charts | Recharts (the weekly score line chart) |
| Icons | lucide-react |
| Auth storage | access token in memory + refresh token in httpOnly cookie (fallback: localStorage if cookie infra is skipped in v1) |
| Install | PWA (manifest + service worker via `next-pwa` or hand-rolled) |
| Deploy | Vercel |

The backend base URL comes from `NEXT_PUBLIC_API_URL`. All requests attach `Authorization: Bearer <accessToken>`; a 401 triggers a silent refresh, then retry once, else redirect to login.

---

## 2. Design Direction

**Subject:** a focused, daily study tool for one serious task — getting words and reading to stick under exam pressure. The right feeling is **calm, legible, unhurried** — closer to a well-set reading app than a gamified quiz app. Light mode, generous whitespace, quiet confidence. The one place we spend boldness is the **vocabulary card and the daily progress ring** — those are what the user sees every single day.

This is deliberately *not* the cream-background-serif-terracotta default. The palette below is a cool, paper-white base with a single deep **ink-teal** as the brand color and a warm **amber** reserved strictly for streaks/"due now" urgency. Two accents, used with discipline.

### 2.1 Color palette (light)

Define as CSS variables on `:root` and mirror into Tailwind.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FBFCFC` | app background (cool near-white, not cream) |
| `--surface` | `#FFFFFF` | cards, sheets |
| `--surface-muted` | `#F2F5F5` | input fields, inactive chips, table stripes |
| `--border` | `#E2E8E8` | hairline borders, dividers |
| `--ink` | `#16201F` | primary text (near-black with a green-grey cast) |
| `--ink-soft` | `#5B6B69` | secondary text, captions |
| `--brand` | `#0E7C7B` | primary actions, links, active states (deep ink-teal) |
| `--brand-strong` | `#0A5F5E` | hover/pressed on brand |
| `--brand-wash` | `#E4F1F0` | brand-tinted backgrounds, selected option fill |
| `--amber` | `#E8943A` | streak flame, "due today" badges, urgency only |
| `--amber-wash` | `#FBEEDD` | amber badge backgrounds |
| `--success` | `#2F8F5B` | correct answers |
| `--success-wash` | `#E3F2E9` | correct-answer fill |
| `--danger` | `#C8553D` | wrong answers, destructive |
| `--danger-wash` | `#F7E4DF` | wrong-answer fill |

Tone tags (vocab) get their own quiet swatches so they're scannable: `formal` → slate, `neutral` → grey, `positive` → success-green, `negative` → danger-clay, `informal` → amber. Render as small pill chips with `*-wash` background and the solid color as text.

Rule: brand-teal carries all *interaction*; amber carries only *urgency/streak*; green/clay are reserved for *answer feedback*. Never use amber for a normal button — it would dilute the streak signal.

### 2.2 Typography

Two faces, loaded via `next/font`:

- **Display / headings:** `Fraunces` (variable serif) — used for screen titles, the big vocab word on the review card, and stat numbers. Optical-size high, weight 500–600. This gives the reading-app character without going full broadsheet.
- **Body / UI:** `Inter` — everything else: labels, options, paragraphs, buttons.
- **Mono (data/optional):** `IBM Plex Mono` for the streak count and small stat captions only, if desired.

Type scale (mobile → desktop where it differs):

| Role | Size / line | Face |
|---|---|---|
| Screen title | 24 / 30 | Fraunces 600 |
| Vocab word (review card) | 40 / 46 | Fraunces 600 |
| Section heading | 18 / 26 | Fraunces 600 |
| Body | 16 / 26 | Inter 400 |
| Option text | 16 / 24 | Inter 450 |
| Label / caption | 13 / 18 | Inter 500, `--ink-soft` |
| Stat number | 32 / 36 | Fraunces 600 |

Reading passages (RC) get a slightly larger body (17/30) and max-width ~64ch for legibility.

### 2.3 Shape, spacing, motion

- Radius: `12px` cards, `10px` buttons/inputs, `999px` pills. Soft but not bubbly.
- Shadow: one elevation only — `0 1px 2px rgba(16,32,31,.04), 0 4px 16px rgba(16,32,31,.06)` on cards/sheets. Flat elsewhere.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48. Screen gutter 16px mobile, 24px desktop.
- Motion: 150–200ms ease-out for taps, sheet slide-up 250ms. A short flip/reveal on the vocab card (200ms) when the answer shows. Respect `prefers-reduced-motion` — disable transforms, keep opacity fades.

---

## 3. Layout & Navigation

**Mobile (primary):** bottom tab bar, 5 tabs, thumb-reachable, fixed. Content scrolls above it. Safe-area insets respected (`env(safe-area-inset-bottom)`).

```
Tabs:  [ Today ]  [ Words ]  [ Practice ]  [ Reading ]  [ Progress ]
         home       library     TC + SE        RC          dashboard
```

**Desktop (≥1024px):** the bottom bar becomes a fixed left sidebar (icon + label), content area max-width ~960px centered, with comfortable margins.

A thin top bar shows the screen title (Fraunces) and, on the right, the streak flame + count (amber) — present on every screen so the streak is always visible.

ASCII wireframe — Today (mobile):

```
┌──────────────────────────────┐
│ Today              🔥 12      │  top bar
├──────────────────────────────┤
│   ╭───────────────╮          │
│   │   ◐  progress  │          │  progress ring: due vs done today
│   │   ring  7/20   │          │
│   ╰───────────────╯          │
│                              │
│  ▸ Review due (8)        →   │  primary card, brand
│  ▸ Tonight's quiz (20)   →   │  amber if pending
│  ▸ Learn new words       →   │
│                              │
│  Quick practice              │
│  [ TC ]  [ SE ]  [ RC ]      │  3 chips
└──────────────────────────────┘
│ Today  Words  Practice ...   │  tab bar
└──────────────────────────────┘
```

---

## 4. Screens

### 4.1 Auth (login / register)

Single centered card on `--bg`. Logo/wordmark in Fraunces. Fields: email, password (+ display name, timezone on register; timezone auto-detected via `Intl.DateTimeFormat().resolvedOptions().timeZone`, editable). One brand button. Inline validation, errors in `--danger` below the field. Calls `/api/auth/register` and `/api/auth/login`. On success store tokens, route to Today.

### 4.2 Today (home)

The daily command center. Pulls `/api/progress/summary`, `/api/review/due`, `/api/review/today`.

- **Progress ring** (the signature element): a circular ring showing today's completion — words reviewed vs. due, filling brand-teal, with the count in Fraunces in the center. Subtle draw-on animation on load.
- **Action cards**, in priority order: "Review due (N)" → opens the review flow; "Tonight's quiz (N)" → today's-words quiz (amber accent if not yet done); "Learn new words" → opens Words filtered to `new`.
- **Quick practice** row: three chips (TC / SE / RC) that jump into one random question of that type.
- Empty states are directive, not decorative: if nothing is due, "You're clear for today. Learn 20 new words to stay ahead." with a button.

### 4.3 Words (searchable library)

Consumes `/api/words` with `q`, `tone`, `cluster`, `status` filters.

- Sticky search field at top (`--surface-muted`), plus a horizontal scroll row of filter chips: status (New/Learning/Review/Mastered) and tone.
- Results as a vertical list of word rows: word (Fraunces), one-line meaning truncated, tone chip, and a small status dot. Tap → word detail sheet.
- Multi-select mode (toggle "Select" in header): tap words to select up to 20, floating action button "Learn today (n)" calls `/api/words/learn-batch`. This is the morning workflow.

**Word detail** (bottom sheet on mobile, side panel on desktop): word, tone chip, meaning, example sentence, GRE context, cluster link, and the user's progress (status, times seen, accuracy). A "Compare" button opens the confusion-pair view (`/api/words/compare`) showing two words side by side with a field to note the distinction.

### 4.4 Review flow (the core daily loop)

Full-screen focused flow (hides tab bar). Used for both due review and tonight's quiz. Drives `/api/review/submit`.

- One **vocab card** at a time, centered: the word large in Fraunces, tone chip below. A "Show meaning" tap (or swipe up) flips the card — 200ms reveal — to show meaning, example, GRE context.
- After reveal, four grade buttons appear: **Again / Hard / Good / Easy** (mapped to the backend grades). Again uses `--danger` tint, Easy uses `--success` tint, Hard/Good neutral-brand. Below each, a tiny caption of when it'll return ("<1d", "tomorrow", "3d", …) computed from the returned interval.
- Progress indicator: thin bar at top (card x of N). On submit, advance; on finish, a summary card (n reviewed, accuracy) and a "Done" returning to Today with the ring updated.
- Active recall is enforced: grade buttons are hidden until the meaning is revealed.

### 4.5 Practice (TC + SE)

A segmented control at top: **Text Completion | Sentence Equivalence**. Lists from `/api/tc` and `/api/se` (answers withheld). Tap a question → question screen.

**Text Completion screen:**
- Prompt rendered with blanks shown as underlined slots; the active blank is highlighted brand. For each blank, an option group (chips) below; selecting fills the slot inline so the user reads the completed sentence.
- 1–3 blanks handled by stacking option groups labeled "Blank 1 / Blank 2 / Blank 3".
- "Check answer" button (disabled until all blanks filled) → `POST /api/tc/:id/submit`. Reveal: correct blanks turn `--success`, wrong turn `--danger`, show correct answer + explanation in a result panel. "Next" loads another.

**Sentence Equivalence screen:**
- Single sentence with one blank. Six option chips in a 2-column grid (1-column on narrow phones). User must pick **exactly two** — the Check button stays disabled until 2 are selected; selecting a third deselects the oldest (or block + hint "pick two").
- Submit → set-equality check via `/api/se/:id/submit`. Both-correct → both chips `--success`; partial → selected-wrong in `--danger`, missed-correct outlined in `--success`. Explanation panel shows why the pair is equivalent.

### 4.6 Reading (RC)

List of passages from `/api/rc` (title, subject chip, question count). Tap → passage screen.

- **Passage screen** layout: passage body in a scrollable reading column (17/30, max ~64ch), questions below. On desktop, passage left / questions right (sticky). On mobile, passage on top, a "Jump to questions" affordance, questions stacked.
- Each question: stem + 5 options (A–E) as selectable rows. Submit one at a time via `/api/rc/questions/:id/submit`.
- **Trap-tagging drill** (the distinctive RC feature): after answering, before showing the explanation, optionally prompt "Why is each wrong option wrong?" — for each non-selected option a small dropdown of trap labels (out of scope / distortion / contradiction / too extreme / half-right). User tags, then reveal compares their tags to `trap_types` from the response and shows the explanation. This is optional per question (skippable) but encouraged via a toggle in settings.
- Result: correct option `--success`, chosen-wrong `--danger`, explanation panel.

### 4.7 Progress (dashboard)

Pulls `/api/progress/summary`, `/weak-words`, `/scores`, `/by-type`.

- **Top stat row:** three stat cards — Streak (amber flame + days, Fraunces number), Mastered (n / total with a thin progress bar), Due today. On mobile these are a horizontal scroll or 2-up grid.
- **Score-over-time chart:** Recharts line chart, accuracy by week, with a section filter (All / Vocab / TC / SE / RC). Brand-teal line, soft grid, no chart-junk.
- **Weak words:** list of most-missed words (from `/weak-words`), each a tappable row that deep-links into a focused review of just those.
- **By type:** RC accuracy by question type and subject, TC accuracy by blank count — rendered as simple labeled horizontal bars (brand fill on `--surface-muted` track). This is the weak-spot view.

### 4.8 Settings (minor)

Reached from the top bar avatar. Display name, timezone, the "always prompt for RC trap-tagging" toggle, logout. Calls `/api/auth/me` and `/api/auth/logout`.

---

## 5. Component Inventory

Build these as reusable primitives:

`AppShell` (tab/sidebar + top bar + streak), `StatCard`, `ProgressRing`, `WordRow`, `WordCard` (the flip review card), `ToneChip`, `StatusDot`, `OptionChip` (selectable, with correct/wrong/selected states), `BlankSlot` (TC inline blank), `GradeButtons`, `ResultPanel` (correct/wrong + explanation, shared across TC/SE/RC), `PassageReader`, `TrapTagger`, `FilterChipRow`, `SegmentedControl`, `BottomSheet` (mobile) / `SidePanel` (desktop) — one component switching by breakpoint, `EmptyState`, `Toast`.

`OptionChip` states must be a single component with variants: `idle`, `selected`, `correct`, `wrong`, `missed` (outlined green for a correct option the user didn't pick) — used identically across TC, SE, RC so feedback feels consistent everywhere.

---

## 6. Mobile-Responsive Rules (priority requirement)

- **Mobile-first CSS:** base styles target ~360–430px; add `md:`/`lg:` for larger. Never design desktop-down.
- Breakpoints: base (phone), `md` 768px (large phone/tablet, 2-column where useful), `lg` 1024px (sidebar + multi-column).
- **Tap targets ≥ 44×44px.** Option chips, grade buttons, tab items all meet this.
- **Thumb zone:** primary actions (Check answer, grade buttons, FAB) sit in the lower third of the screen; the bottom tab bar is always reachable.
- Bottom tab bar uses `env(safe-area-inset-bottom)`; full-screen flows account for notches.
- Sheets slide up from the bottom on mobile (not center modals) so they're dismissible by thumb.
- Horizontal scroll only for filter-chip rows and the stat row — never for primary content.
- Long passages and option lists scroll vertically; the Check/submit bar can be sticky-bottom so it's always in reach without scrolling back.
- Text never below 13px. Inputs use `font-size:16px` to prevent iOS zoom-on-focus.
- Test the whole flow at 360px width before anything else.

---

## 7. Data & State

- **TanStack Query** for all server state, keyed by endpoint + params. Mutations (`learn`, `review/submit`, all `submit`s) invalidate the relevant queries — e.g. `review/submit` invalidates `progress/summary` and the active review list so the ring updates immediately.
- A typed API client (`lib/api.ts`) with one function per backend route, returning the exact shapes from `BACKEND.md`. Define TS types matching the backend enums (`tone`, `status`, `section`, `question_type`, `trap_types`) in `lib/types.ts` — keep them in sync with the backend contract.
- Auth: `AuthProvider` holds the access token in memory; an axios/fetch interceptor adds the header and handles 401 → refresh → retry. Protected routes redirect to `/login` if refresh fails.
- Optimistic UI only for the grade buttons (advance to next card instantly, roll back on error). Everything else awaits the response so feedback (correct/wrong) is truthful.
- No correct answers ever live in the client before submit — the GET payloads don't include them (enforced backend-side), and the UI must not assume otherwise.

---

## 8. PWA / Install on Phone

This is how it becomes an app on the home screen — no app store.

- Add `public/manifest.webmanifest`: `name`, `short_name` ("GRE Verbal"), `start_url: "/"`, `display: "standalone"`, `background_color: #FBFCFC`, `theme_color: #0E7C7B`, and icons at 192/512 (+ maskable).
- Register a service worker (via `next-pwa` or manual) that caches the app shell and static assets for fast loads and basic offline shell. API responses are network-first; do **not** aggressively cache quiz content in a way that serves stale answers.
- `theme-color` meta = brand teal; `apple-mobile-web-app-capable` + apple touch icon for iOS install.
- After deploy, the user opens the URL in mobile Chrome/Safari and chooses "Add to Home Screen"; it then launches full-screen via the bottom tab layout.

---

## 9. Project Structure (suggested)

```
frontend/
  app/
    layout.tsx              # fonts, AppShell, providers
    (auth)/login/page.tsx
    (auth)/register/page.tsx
    (app)/today/page.tsx
    (app)/words/page.tsx
    (app)/practice/page.tsx
    (app)/reading/page.tsx
    (app)/progress/page.tsx
    (app)/review/page.tsx   # full-screen review flow
    settings/page.tsx
  components/               # the inventory in §5
  lib/
    api.ts                  # typed client, one fn per route
    types.ts                # mirrors backend enums/shapes
    auth.tsx                # AuthProvider + interceptor
    query.tsx               # QueryClient provider
  styles/globals.css        # CSS vars from §2.1
  tailwind.config.ts        # tokens mapped to Tailwind
  public/manifest.webmanifest
  public/icons/...
  .env.example              # NEXT_PUBLIC_API_URL
```

---

## 10. Build Order

1. Tokens + Tailwind config + fonts + `AppShell` (tab bar / sidebar / top bar with streak). Verify at 360px.
2. Auth screens + `AuthProvider` + API client skeleton.
3. Today screen with `ProgressRing` and action cards (wire `/progress/summary`, `/review/due`).
4. Review flow (`WordCard`, `GradeButtons`) — the core loop, end to end.
5. Words library + filters + multi-select learn + word detail/compare.
6. Practice: TC, then SE (`OptionChip`, `BlankSlot`, `ResultPanel`).
7. Reading: passage reader + questions + `TrapTagger`.
8. Progress dashboard (stats, Recharts chart, weak words, by-type bars).
9. PWA manifest + service worker; deploy to Vercel; install-test on a real phone.

Ship after step 4 (login → learn → review → ring updates) is working on a phone, then layer the rest.

---

## 11. Quality Floor

Responsive to 360px; visible keyboard focus rings (brand, 2px); `prefers-reduced-motion` honored (opacity-only fallbacks); color is never the sole signal (correct/wrong also carry an icon + label); all interactive elements are real buttons/links with accessible names; passage text meets contrast AA on `--bg`. Empty and error states give direction in the interface's voice, never a bare spinner or a dead end.