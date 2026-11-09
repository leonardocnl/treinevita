# VITA design system: "Ponto e linha"

## Status

Locked on 2026-11-07. Changes need the owner's approval. Revised on 2026-11-08 at the owner's request (prompt 7: motion, corners, icons, labels, Perfil) and on 2026-11-09 (prompt 9: springs, instant feedback, wheel sizing and tick, toast, loading skeletons).

"Ponto e linha" (dot and line) is the visual language of VITA: a calm, editorial workout tracker where data is the hero. Large numbers are drawn in a round dot matrix, in the spirit of Nothing; text is thin and small, and content is separated by thin lines and space, in the spirit of teenage engineering. Color follows a strict 60/30/10 rule with red as the only accent, and glass appears only on the few elements that float over content.

This file describes what is in the code today. The source of truth for every value is `src/app/globals.css` (tokens and utilities) and the screens in `src/app/`. If the two ever disagree, the code wins and this file is corrected.

## Colors

All colors are CSS custom properties on `:root` in `src/app/globals.css`, switched by `prefers-color-scheme: dark` unless the person forced a theme in Ajustes (a `vita_theme` cookie read by the root layout, which sets `data-theme="light"` or `"dark"` on `<html>`), and exposed to Tailwind as `bg-*`, `text-*`, `border-*`, `ring-*`, `fill-*` and `stroke-*` through `@theme inline` (for example `--vita-ink` → `text-ink`).

| Role                    | Token                       | Light     | Dark      | Where to use                                                                                  |
| ----------------------- | --------------------------- | --------- | --------- | --------------------------------------------------------------------------------------------- |
| Page background         | `--vita-canvas`             | `#F4F2F1` | `#0B0B0D` | `body`; text on ink pills (`text-canvas`); inner chips in edit mode                           |
| Surface                 | `--vita-paper`              | `#FCF8F7` | `#161618` | widget tiles, the active exercise row, the edit overlay (45%)                                 |
| Primary text            | `--vita-ink`                | `#0B0B0D` | `#FCF8F7` | text, done dots, trained days, sparkline, action pill fill                                    |
| Secondary text          | `--vita-ink-secondary`      | `#5B5B60` | `#A1A1A6` | labels, captions, inactive tabs, pending rows                                                 |
| Divider                 | `--vita-hairline`           | `#DEDAD9` | `#26262A` | 1px row and column dividers; future days; tile ring in edit mode                              |
| Unlit dot               | `--vita-dot-off`            | `#D6D2D1` | `#2E2E33` | unlit dots, bar tracks, the sheet handle, dashed "Adicionar" edge; never text                 |
| Tertiary text           | `--vita-ink-tertiary`       | `#878384` | `#727277` | unlit text that must still be read: the goal of a fraction (`/4`), placeholders (3:1, large)  |
| Secondary text on ink   | `--vita-on-ink-secondary`   | `#A1A1A6` | `#5B5B60` | secondary text inside the ink action pill                                                     |
| Activity level 1        | `--vita-level-1`            | `#BDB8B7` | `#4A4A50` | defined, not used by any screen today                                                         |
| Activity level 2        | `--vita-level-2`            | `#7D797C` | `#96969B` | defined, not used by any screen today                                                         |
| Activity level 3        | `--vita-level-3`            | `#0B0B0D` | `#FCF8F7` | defined, not used by any screen today                                                         |
| Accent                  | `--vita-red`                | `#FF1744` | `#FF1744` | fills only: action circles, status dots, goal-met marks, the sparkline's last point           |
| Accent text             | `--vita-red-text`           | `#C8102E` | `#FF4D6D` | any red text ("Concluir", "Descartar treino", error messages), contrast safe on both canvases |
| Dark panel              | `--vita-panel`              | `#0B0B0D` | `#1A1A1D` | the set logger panel                                                                          |
| Text on panel           | `--vita-on-panel`           | `#FCF8F7` | `#FCF8F7` | selected wheel value, done set dots on the panel                                              |
| Secondary text on panel | `--vita-on-panel-secondary` | `#9A9A9F` | `#9A9A9F` | panel labels, units, "last time" line                                                         |
| Dim text on panel       | `--vita-on-panel-dim`       | `#8A8A8F` | `#8A8A8F` | unselected wheel values, wheel focus ring (4.5:1 on both panels)                              |
| Track on panel          | `--vita-panel-track`        | `#3A3A3F` | `#3A3A3F` | pending set dots on the panel                                                                 |
| Scrim                   | `--vita-scrim`              | ink 28%   | black 50% | the backdrop behind a sheet                                                                   |

### Contrast

Every text meets WCAG AA against its background: 4.5:1 for text, 3:1 for icons and large text (24px and up). Checked pairs: `ink-secondary` 6.1–7.6:1 on canvas and paper; `red-text` 5.3–6.1:1; `on-panel-secondary` 6.2–7:1 and `on-panel-dim` 5–5.7:1 on the panels; `on-ink-secondary` 6.4–7.6:1 inside the pill; white on `red` 3.9:1 (icons only); `ink-tertiary` 3.3–4:1 (large text only). `dot-off` (1.3–1.5:1) is never used for text or for an icon that carries meaning on its own; dot rows always come with a text label.

### The 60/30/10 rule

- Light: paper (canvas and paper) 60, ink 30, red 10.
- Dark: paper and ink swap. The canvas becomes near black, ink becomes the paper color, red stays the same.
- The dark panel keeps the same look in both themes (only `--vita-panel` shifts a little in dark so it still reads against the canvas).

### The red rule

- Red (`red`) is only a **fill** for three things: an action (what to tap), a status (what is happening now, what went up), and a highlight (a goal met, a record, the last point of a trend).
- Red never fills a large area and never carries body copy.
- Red text always uses `red-text`, never `red`.
- Icons and glyphs inside red circles are white.

## Typography

### Families

- **Inter**, variable (`100 900`), self-hosted from `src/app/fonts/`, exposed as `--font-sans` (`font-sans`). Used for all text and for every number under 36px.
- **Doto**, variable dot matrix (`100 900`), self-hosted, exposed as `--font-dot`. Used only through the `num` utility: weight 900, round dots (`font-variation-settings: "ROND" 100`), tabular figures, `letter-spacing: 0.01em`.

Both fonts load with `display: swap` and no request to a third party at runtime.

### Weights

| Weight | Class                           | Use                                                                             |
| ------ | ------------------------------- | ------------------------------------------------------------------------------- |
| 300    | default on `body`, `font-light` | all body text, captions, large display titles (32–40px, 28–34px inside widgets) |
| 400    | `font-normal`                   | page titles (28/34px), emphasis inside rows, button labels, set values          |
| 500    | `font-medium`                   | only the `accent-strong` text button tone, unused by any screen today           |

No other weights are used. Doto is always 900 through `num`.

### Size scale in use

| Size (px) | Family | Where                                                                                    |
| --------- | ------ | ---------------------------------------------------------------------------------------- |
| 11        | Inter  | tab names in the bottom bar; chart axis labels inside large widgets (Peso, Volume)       |
| 13        | Inter  | widget titles, captions, status lines, secondary row text, units                         |
| 15        | Inter  | default body size: subtitles, header buttons, action pill label, set rows, panel heading |
| 17        | Inter  | list item names, done set values, lead paragraphs                                        |
| 20        | Doto   | the `vita` wordmark (Resumo, Entrar)                                                     |
| 22        | Inter  | unselected wheel values, stat values in Último treino, the "Adicionar widget" title      |
| 28        | Inter  | desktop workout sidebar title, Último treino title, the "+" in the add tile              |
| 30 / 34   | Inter  | Próximo treino title inside widgets (small 30, medium and large 34); page titles (34)    |
| 32        | Inter  | exercise name on the exercise screen                                                     |
| 40        | Inter  | the hero sentence on Entrar                                                              |
| 48        | Doto   | widget numbers in the small size (Peso, Cintura, Recorde, Último treino, Constância)     |
| 56        | Doto   | selected wheel value; Semana and Estagnados (small); Recordes count (large)              |
| 64        | Doto   | Peso and Constância in the large size                                                    |
| 80        | Doto   | Semana in the medium and large sizes                                                     |
| 96        | Doto   | the desktop workout overview (`3/8`)                                                     |

Display numbers use tight leading (`leading-[0.8]` or `leading-[0.85]`); titles use `leading-none`, `leading-tight` or `1.08`–`1.1`.

### Rules

- **Dots only from 36px up; below that, Inter with tabular figures** (`tabular-nums`). Small dots are hard to read.
- In a fraction, the goal part is in `dot-off` (`3/4` where `/4` is unlit).
- Sentence case everywhere.
- Forbidden: bold (600 and up), italics, all caps, letter spacing on text, a period at the end of a title.

## Spacing and layout

- Base unit 4px (Tailwind's scale). Common gaps: 4, 6, 8, 12, 16, 20.
- Screen margins on the phone: 20px on Resumo, 24px on the workout list, Entrar and the placeholder tabs, 16px on the exercise screen (with 8px more on its header and set list).
- Screen margins on the desktop (`md`, 768px and up): 40px on Resumo, 32px on the placeholder tabs, 40px around the workout layout.
- Top padding: the safe area or 52px (Resumo, workout, exercise), 56px (placeholder tabs), 64px (Entrar); 64px on desktop.
- Bottom padding leaves room for the floating bar: 128px on Resumo, 144px on workout and exercise, 192px on placeholder tabs.
- Vertical rhythm: 24px between the header and the content, 8–16px inside a group, 40px before a destructive link.
- Row heights: 64px (exercise list, wheel rows), 48px (set list, bar controls), 24–30px (rows inside widgets).
- Maximum widths: 1024px (Resumo, placeholder tabs), 1152px (workout layout), 448px (bottom bar, "Adicionar widget" sheet, Entrar), 384px for lead paragraphs.
- Phone: one column, one task per screen. The workout list and each exercise are separate full screens. The bottom bar is fixed, 12px from the sides and the safe area or 20px from the bottom.
- Desktop: the Resumo grid goes from 2 to 4 columns. The workout area becomes two columns: a sticky exercise list on the left (300–360px) and the exercise in focus on the right, 56px apart; the exercise screen's bar stops floating and sits under the content at full width.

## Shape and elevation

### Radii

| Radius | Where                                                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------------------------------- |
| 999px  | everything that floats and is tappable: bottom bar, action pill, round buttons, size switch, wheel band; also every dot |
| 30px   | panels: the set logger panel; the top corners of every sheet                                                            |
| 26px   | widget tiles, the "Adicionar" tile and the program cards in the onboarding                                              |
| 10px   | inner areas: the wheel scroller inside the panel (30 − 20)                                                              |
| 16px   | the highlight of the active row in the exercise list                                                                    |

### Concentric corners

Whenever a rounded element sits inside a rounded container, **outer radius = inner radius + gap**, and the gap is the same on every side. Never work the numbers out by hand: use `src/shared/ui/concentric.ts` (`outerRadius`, `innerRadius`, `concentricGap`, `insetCircle`), which is unit tested.

- Action pill: 48px tall with its red circle 4px from the top, the bottom and the end, so the circle is `insetCircle(48, 4)` = 40px (`PILL`, `PILL_CIRCLE`).
- Floating bar: 8px of padding around 48px controls, so its radius is 24 + 8 = 32 (a full pill).
- Edit chips on a widget: 32px chips (radius 16) sit `concentricGap(26, 16)` = 10px from the tile's edges.
- Wheel inside the panel: `innerRadius(30, 20)` = 10px.
- Size switch: 32px options in a pill with 4px padding (16 + 4 = 20, a full pill).

### Elevation

Elevation comes from translucency, blur and contrast, not from shadows. The bottom bar has no shadow. The only shadows left in the code are:

- `panel`: `inset 0 1px 0 rgb(255 255 255 / 0.12)` and `0 24px 50px -32px rgb(11 11 13 / 0.55)`.
- `glass-light`: `0 8px 24px -16px rgb(11 11 13 / 0.45)`.
- `smoke` (defined, not used by any screen): `0 22px 50px -24px rgb(11 11 13 / 0.6)`.

Stacking: bottom bars at `z-20`, sheets at `z-40` over the `scrim`.

## Surfaces

| Surface       | Recipe                                                                                                                                                                                                                    | Where                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `float-bar`   | light: `rgb(252 248 247 / 0.46)`, `backdrop-filter: blur(28px) saturate(200%)`, `1px solid rgb(11 11 13 / 0.06)`. Dark: `rgb(30 30 33 / 0.5)`, edge `rgb(255 255 255 / 0.08)`. No shadow                                  | the bottom bar on every screen                                |
| `glass-light` | light: `rgb(252 248 247 / 0.72)`, `blur(20px) saturate(165%)`, `1px solid rgb(11 11 13 / 0.05)`, shadow `0 8px 24px -16px rgb(11 11 13 / 0.45)`, text `ink`. Dark: `rgb(28 28 30 / 0.72)`, edge `rgb(255 255 255 / 0.08)` | round icon buttons: back, theme, edit, external link, discard |
| `panel`       | `--vita-panel` fill, sheen `linear-gradient(to bottom, rgb(255 255 255 / 0.06), transparent 45%)`, `1px solid rgb(255 255 255 / 0.06)`, shadows listed above, text `on-panel`                                             | set logger                                                    |
| `quiet`       | `rgb(255 255 255 / 0.07)` with `1px solid rgb(255 255 255 / 0.08)`                                                                                                                                                        | the selection band across the wheels, inside the panel        |
| Widget tile   | `bg-paper`, radius 26, no border, no shadow, 16px padding                                                                                                                                                                 | every Resumo widget                                           |
| Edit overlay  | `bg-paper/45` with `backdrop-blur-[2px]`, over the tile content at 40% opacity; the tile gets `ring-1 ring-hairline`                                                                                                      | widget tiles in edit mode                                     |

Glass appears only in three places: the bottom bar, the round icon buttons and the edit layer of the widgets. Sheets are opaque `paper`. Content on the canvas has no container: it is separated by space and, when needed, a hairline. `smoke` and `limelight` are defined in `globals.css` and not used by any screen.

## Components

### Bottom bar

- Anatomy: a `float-bar` pill (`rounded-full`, 8px padding, 4px gap, up to 448px wide), centered and fixed at the bottom. On the tabs: four tabs in equal columns (Resumo, Treinos, Evolução, Perfil) and, on Resumo, the screen's main action at the end. On the workout list: the action pill "Finalizar treino". On the exercise screen: the round undo button (after the first set) and the action pill.
- Sizes: 48px controls and 8px padding, so the bar is 66px tall with its 1px edge.
- Tabs: a 22px icon (summary, dumbbell, chart, person) with the name under it in Inter 11px weight 400. The active tab is `ink` with `aria-current="page"`; the others are `ink-secondary`. Same weight for both, so nothing shifts. Switching tabs crossfades: the bar has its own view transition name (`vita-bar`), and the active tab fades in.
- Desktop: on the exercise screen the bar becomes static under the content and takes the full width.

### Red action circle (`roundActionClass`)

48px red circle, white filled play icon at 18px. Starts or continues a workout from the bottom bar on Resumo. Absent when there is no workout to start.

### Action pill (`pillActionClass` + `PillActionContent`)

- 48px tall, full width, `bg-ink` with `text-canvas` (inverts in dark), 20px left padding and 4px on the other sides.
- Label at 15px weight 400 on the left, with an optional secondary part in `on-ink-secondary` at 13px ("Finalizar treino 3 de 8") or a tabular value ("Confirmar 40 × 10", which rolls when it changes).
- A 40px red circle at the right end, 4px from the top, the bottom and the end (concentric), holds a white icon at 20px (check, arrow or trash).
- States: pressed (`pressable`), disabled at 60% opacity (sign in with Google). "Confirmar" is never disabled while saving: the set shows as done at once (optimistic).
- Where: "Finalizar treino", "Confirmar …", "Próximo exercício" / "Voltar à lista", "Começar treino", the onboarding's "Começar" / "Continuar", the single action of a sheet ("Salvar", "Limpar ficha", "Descartar treino"), "Entrar como Leonardo" / "Entrar com Google".

### Round secondary button (`roundSecondaryClass`)

48px, transparent, `ink` icon at 20px. Undo the last set, inside the bottom bar.

### Round light glass button

44px `glass-light` circle with a 20px icon:

- Back (chevron) at the top left of the workout screens, the onboarding, Ajustes and Créditos. On desktop the exercise screen hides it but keeps its space.
- The theme toggle (sun in light, moon in dark) at the top right of Resumo and the welcome screen; on Resumo it follows the edit button (pencil; in edit mode a close and a check).
- External link (an arrow leaving a box, up and to the right) in the exercise header, away from back and next.
- Discard (trash) next to the minutes on the workout list; it asks first in a sheet.

### Theme toggle (`src/app/_components/theme-toggle.tsx`)

Copied from the owner's notfolio and rebuilt with VITA's tokens. A tap spins the icon once (360°, 360ms, enter easing) while the sun and the moon crossfade; on a mouse it leans 20° and grows to 1.15 on hover (300ms, a slight overshoot). It flips the theme on `<html>` at once and writes the same `vita_theme` cookie as Ajustes (`themeCookie`, unit tested). From "Sistema" it flips what the system shows.

### Choice list (`src/shared/ui/choice-list.tsx`)

A radio group as a list: one row is chosen. Rows at least 64px with hairlines between them; the name at 17px weight 400, an optional detail at 13px in `ink-secondary`, and a 20px `ink` check at the right of the chosen row (the other rows keep its space). Arrow keys move the choice; only the chosen row (or the first, when none is) is in the Tab order. Used for every choice in the onboarding, Perfil and Ajustes (goal, experience, session length, place, theme).

With `variant="cards"` each option is a `paper` tile (radius 26, 16px padding, 12px apart) with room for more lines; the chosen tile gets a 1.5px `ink` ring and the check. Used for the program models.

### Text field (`src/shared/ui/text-field.tsx`)

No box: a 13px `ink-secondary` label over a 28px weight 300 input on a 1px `hairline` line; while focused an `ink` line draws over it from the left (`scaleX`, 200ms). The placeholder is `ink-tertiary`. Used for the name.

### Exercise demo (`src/shared/ui/exercise-demo.tsx`)

- `ExerciseDemo`: the start and end drawings, 176px tall and full width, taking turns with a soft crossfade (`pose-cycle`, 2.4s per cycle, about 1.2s per pose; the end pose runs half a cycle later). Without drawings, nothing. With reduced motion, both poses sit side by side, still.
- Seeing it done: an external-link glass button at the right of the exercise title opens, in a new tab with `rel="noopener noreferrer"`, the catalog's `reference_url` when it is a valid https link (`safeExternalUrl`), otherwise a YouTube search for the name in Portuguese. Nothing from other sites is embedded or hotlinked.
- `ExerciseThumb`: the start pose, 40px and still, in `ink-secondary`, at the left of rows in exercise lists (workout list, welcome, the onboarding review and its sheets). An empty 40px space keeps rows aligned when there is no drawing.
- The drawings are SVG files used as CSS masks (`pose` utility) over `currentColor`, so the line art takes the ink color of either theme. They come from Everkinetic (CC BY-SA 4.0), sanitized and recolored by `scripts/import-everkinetic.ts`; credits live at `/creditos`.

### Selection wheel

- Inside the set logger `panel` (radius 30, 20px padding), under the heading "Série N" (15px, `on-panel-secondary`; the number rolls when it changes) and, on the right, the sets label ("1 de 4 séries", 13px, `on-panel-secondary`) next to the set dots (7px: done `on-panel`, the set being done now a 14×7px `red` pill, pending `panel-track`). The group carries the same text as its `aria-label`.
- Native scroll snap (mandatory, `scroll-snap-stop: normal` so a flick can cross many values), three visible rows of 64px, with a mask that fades the top and bottom. It scrolls only vertically. Selected value in `num` at 56px in `on-panel`, or smaller for a value that would not fit the column ("102,5" in the kg column of a phone; "7,5" stays at 56px). Each value's size comes from its length and the container width, so it never animates. Neighbours in Inter 300 at 22px in `on-panel-dim`. Each row holds both states stacked and crossfades them (opacity and scale, `snappy`), so the font size never animates.
- The value under the center follows the finger on every frame; each value reaching the center ticks (a 2% scale pulse, 80ms, `wheel-tick`). The new value is committed when scrolling ends. Nothing in the wheel changes while a set is being saved.
- One `quiet` band (999px radius, 60px tall) spans every wheel on the panel.
- Load on the left (aligned start), reps on the right (aligned end); exercises by time show one centered wheel in seconds. Unit label under each wheel at 13px.
- When the app raised the load, a 7px red dot sits next to the selected load on the first set.
- Optional lines: the question for the person (13px, above), and "last time" (13px, below a 1px white 8% divider).
- Keyboard: arrow up and down move one step; the scroller shows a 1px `on-panel-dim` focus ring.

### Set list

Under the panel: one 48px row per target set, 15px, with hairlines between rows. Label "Série N" on the left; on the right the value in Inter 17px weight 400 with tabular figures (`40 × 10` or a duration), or `·` in `ink-secondary` while pending. The newest value rolls up into place when logged.

### Exercise list

- An ordered list with hairlines between rows; rows rise in with a 30ms stagger.
- Each row is at least 64px: name at 17px (weight 400 while pending, 300 in `ink-secondary` when complete) and a status line at 13px ("Concluído", "Sobe de carga hoje" or the sets label, "2 de 4 séries").
- On the right, one 6px dot per target set: `ink` when done, `red` for the first dot when the load goes up today, `dot-off` otherwise.
- The active row (desktop sidebar) gets a `paper` highlight with a 16px radius.

### Dot ring (`src/shared/ui/dot-ring.tsx`)

A circle of dots (24 by default, 104px by default); the done share of the goal is red, the rest `dot-off`. Dot size is the larger of 5px and one fifteenth of the ring. Used in the Semana widget: 40px with 16 dots (small), 92px (medium), 108px (large).

### Week rows (Constância)

One row per week, newest first, hairlines between rows. Columns: the label at 13px ("Esta semana" in `ink`, otherwise the start date like "3 nov" in `ink-secondary`), the goal as dots (6px apart, one lit in `ink` per workout; empty slots are `dot-off` fills, or a 1px `dot-off` outline in the current week), and an 18px column with a red 14×3px bar when the goal was met. Small and medium: 8px dots, 24px rows. Large: 11px dots, 30px rows.

### Metric

A value with a caption under it. Large metrics use `num` (48–80px) with a 13px unit or caption in `ink-secondary` on the same baseline. The stat row in Último treino has three columns divided by vertical hairlines, each with a value in Inter 22px weight 400 tabular and a 13px label (min, séries, volume).

### Sparkline (`src/shared/ui/sparkline.tsx`)

A 2px `ink` polyline with round caps and joins, 4px inner padding, and the last point as a red dot (radius 3.5). Default 128×30; Peso uses 150×48 (medium) and 300×90 (large, with min and max labels at 11px). Hidden with fewer than two points.

### Widget tile

`paper`, radius 26, 16px padding, no border or shadow. A `Frame` with the title at 13px in `ink-secondary` at the top left, an optional aside at the top right (a small caption, a dot ring or a red dot) and the content pushed to the bottom. Empty states are a single 15px sentence in `ink-secondary` at the bottom. Sizes are described in "Summary widgets".

### Edit mode

- A pencil glass button at the top right of Resumo turns on editing; it becomes a close button ("Cancelar edição", restores the saved layout) and a check ("Salvar o painel").
- Each tile shows its content at 40% opacity under the edit overlay (which fades in) and gets a hairline ring. On the overlay (10px padding, concentric with the tile): top left, a 32px `ink` circle with a minus to remove; top right, two 32px `canvas` circles 12px apart to move earlier or later (30% opacity when not possible); bottom left, the title at 15px and, when the widget has more than one size, a size switch (a `canvas` pill with 4px padding and 32px options; the selected one in `ink` with `canvas` glyph, the rest in `ink-secondary`). Every 32px control has a 44×44px hit area (`tap-target`).
- A 1×1 "Adicionar" tile with a dashed `dot-off` edge, a plus icon at 28px and the label at 15px opens the sheet. It is shown only while there are widgets left to add.

### Sheet (`src/shared/ui/sheet.tsx`)

- Anatomy: an opaque `paper` panel attached to the bottom, up to 448px wide, with 30px top corners and 20px side padding. On top, a drag handle (36×5px, `dot-off`) and the title at 22px weight 400 with a 32px close button ("Fechar"). Text inside is `ink` (or `ink-secondary` for secondary lines), never translucent; body text is 17px. One primary action, usually the action pill.
- It slides up with `translateY` (`settle`) while the `scrim` fades in. Dragged by the handle or the title, it follows the finger; it closes past 96px or with a flick, otherwise it springs back (`settle`). It also closes by tapping the backdrop, with Esc or with the close button, sliding back down in 200ms (exit easing).
- While open, Tab stays inside it, and on closing the focus returns to whatever opened it.
- "Adicionar widget": one row per widget not on screen, with hairlines between: the title at 17px weight 400, the description at 13px, and a 32px red circle with a white plus. A new widget comes in the medium size when it supports it, otherwise its first size.

### Toast (`src/shared/ui/toast.tsx`)

- A `smoke` glass pill above the floating bar (on desktop, 32px from the bottom), up to 448px wide: the message at 15px in `on-panel` and one text action at 15px weight 400 with a 44px hit area.
- Only for a change that could not be saved: "Não foi possível salvar. Tente de novo." with "Tentar de novo". It rises in (`rise-in`), is announced (`role="alert"`) and leaves by itself after 6 seconds.

### Loading skeletons (`src/shared/ui/skeleton.tsx`)

- Each screen that loads data on navigation has a `loading.tsx`: flat `hairline` blocks in the screen's own layout (title, rows, tiles), with the screen's radii. No shimmer; they fade in after 150ms, so a fast load never shows them. The frame is announced as busy ("Carregando").

### Onboarding (Começar, `/comecar`)

- One short question per screen, up to 448px wide with 24px margins: Boas-vindas, Nome, Objetivo, Experiência, Meta semanal, Peso e altura, Tempo por treino, Onde treina, Escolha da ficha, Revisão da ficha.
- Top: on the first screen the `vita` wordmark; afterwards the back glass button at the top left, then a quiet row of nine 6px dots (done `ink`, current a short `red` pill, pending `dot-off`) with the progress as text next to it ("3 de 9", 13px, rolls on each step), never a percentage bar. "Pular" (15px, `ink-secondary`) at the top right, only on the two optional questions.
- The question is a title at 34px weight 300 (40px on Boas-vindas), always followed by one 17px `ink-secondary` line saying why it is asked ("Para te chamar pelo nome no app.", "Define qual modelo de ficha vamos sugerir.", "Ajusta as cargas iniciais e o ritmo de progressão.", "Quantos dias por semana você quer treinar. Dá para mudar depois.", "Usados só nos seus gráficos de corpo. Ficam só com você.", "Ajuda a sugerir fichas do tamanho certo.", "Mostra modelos que fazem sentido para o seu espaço."). Numbers use the selection wheels on the dark panel; choices use the choice list; the name uses the text field. Each step slides in: from the right going forward, from the left going back.
- The floating bar holds only the action pill: "Começar", then "Continuar" on every step, the last one included ("Salvando" while saving). It is disabled until the step is valid.
- Escolha um modelo: one card per model (choice list cards). "Manter minha ficha atual" comes first and preselected when the person already has a program, with each day's exercise count. Each template card shows its name, "N dias por semana", one sentence on who it is for and its days ("A: peito, costas, ombro", from the exercises' primary muscles). The model that fits the answers shows "Sugerido para você" with a red status dot and a one-line reason (`suggest` in the training module).
- Revisão da ficha: "Revise os exercícios. Toque para trocar, deslize para remover." at the top, one section per day ("Treino A", 22px weight 400, with the day's focus at 13px on the right) and the exercises with their prescription at 13px tabular ("3 × 10–12"). Tapping a row opens a sheet listing catalog exercises with the same primary muscle, with "Remover do treino" at the end; swiping a row left reveals a red trash and, past 96px, slides it out; Delete removes it from the keyboard. A 32px plus under each day adds an exercise. "Limpar ficha" (`red-text`) sits at the bottom and asks first in a sheet with the action pill. Never a browser dialog.

### Welcome (Resumo before the first workout)

Up to 448px with 20px margins: the wordmark and the theme toggle on top; "Olá, Nome" at 40px weight 300; "O painel aparece depois do seu primeiro treino." at 17px in `ink-secondary`; then "Próximo treino" (13px), "Treino A" (34px weight 400), the exercises as 64px rows with their thumb, and the action pill "Começar treino" (or "Continuar treino" while one is open). The bottom bar has the tabs and no red circle, so only one action competes.

### Perfil (`/perfil`)

The fourth tab. Up to 448px with 24px margins: "Perfil" at 34px weight 400, then groups, each a 13px `ink-secondary` heading over 64px rows with hairlines:

- Você: name, goal, experience, weekly goal, time per workout and place. Each row shows the name at 17px, the value at 15px `ink-secondary` and an 18px pencil; the row opens a sheet with the same control as the onboarding and the action pill "Salvar".
- Corpo: the current weight with a 96×32 sparkline of the latest weigh-ins, the height (pencil, height wheel), and "Registrar peso" (plus icon), which opens the weight wheel and saves today's weigh-in. The old Corpo tab (`/corpo`) redirects here.
- A row "Ajustes" with a chevron, which opens `/ajustes`.

### Ajustes (`/ajustes`)

Up to 448px with 24px margins: the back button (to Perfil), "Ajustes" at 34px weight 400, then two groups:

- Conta: the email (read only), "Créditos" (opens `/creditos`) and "Sair" in `red-text`.
- Aparência: a choice list with "Sistema", "Claro" and "Escuro", the same cookie as the theme toggle.

### Créditos (`/creditos`)

The back button, "Créditos" at 34px weight 400 and two 17px paragraphs with the attribution; links are weight 400 `ink` with a `hairline` underline.

### Desktop notice

From 1024px (`lg`) every app route shows a calm notice instead of the app: the wordmark at the top left and, at the bottom, "A versão para computador está em construção." at 40px weight 300, "Por enquanto, use o VITA no celular." at 17px in `ink-secondary` and the site address at 17px weight 400, with 64px of padding. Phones and tablets below 1024px are untouched; Entrar and Créditos are not gated.

### Sign in (Entrar)

A single column up to 448px: the `vita` wordmark at the top, and at the bottom the hero sentence (40px, weight 300), a 17px lead in `ink-secondary`, an optional error at 15px in `red-text` (`role="alert"`) and the action pill. In development it signs in as the seeded user; elsewhere it shows "Entrar com Google" disabled.

## Summary widgets

### Sizes and grid

- Three sizes, as on iOS: small (1×1), medium (2×1, "Largo") and large (2×2, "Grande").
- The grid has 2 columns on the phone and 4 from 768px, with a 12px gap. Rows are square: their height comes from the container width (`widget-grid`, `calc((100cqw - 0.75rem) / 2)` on the phone and `calc((100cqw - 2.25rem) / 4)` on desktop) through a container query.
- Packing is dense (`grid-auto-flow: dense`), so small tiles fill the holes left by larger ones.
- The layout is saved per person, validated against the catalog on the server (known kinds, supported sizes, no duplicates, up to 16 widgets).
- Default layout: Semana (medium), Peso (small), Recordes (small), Próximo treino (medium), Constância (large), Último treino (small), Estagnados (small), Volume por músculo (medium).

### Catalog (`src/modules/progress/domain/widgets.ts`)

| Widget             | Sizes                | Small                                                         | Medium                                                             | Large                                                                                                          |
| ------------------ | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Semana             | small, medium, large | `3/4` in dots (56), "Falta 1" or "Meta batida", dot ring 40px | `3/4` in dots (80), sentence with what is missing, dot ring 92px   | the medium content with a 108px ring, plus the seven days (trained `ink`, today a red ring, future `hairline`) |
| Constância         | small, medium, large | weekly average in dots (48) "por semana", last 2 weeks        | average, "N de M semanas com meta", last 4 weeks                   | average in dots (64), goal per week, met weeks count, last 7 weeks                                             |
| Próximo treino     | small, medium, large | "Treino A" (30), exercise count, how many go up in load       | "Treino A" (34), count, first two exercise names, what goes up     | "Treino A" (34), count, every exercise with a red dot on the ones that go up                                   |
| Último treino      | small, medium, large | minutes in dots (48), workout and date                        | "Treino A" (28), date, stat row (min, séries, volume)              | the medium content plus up to 5 highlights (`load × reps`)                                                     |
| Peso               | small, medium, large | weight in dots (48), "kg, +0,4 no mês"                        | the same plus a 150×48 sparkline                                   | weight in dots (64), count of weigh-ins, 300×90 sparkline with min and max                                     |
| Cintura            | small                | waist in dots (48), "cm"                                      | —                                                                  | —                                                                                                              |
| Recordes           | small, medium, large | titled "Recorde": best load in dots (48) "kg", exercise name  | "30 dias", 3 records (`load × reps`)                               | number of records in dots (56), 6 records                                                                      |
| Volume por músculo | small, medium, large | titled "Mais treinado": sets in dots (48), muscle name        | "séries na semana", 4 bars with a red line at the 10-set reference | 11 bars and the reference caption                                                                              |
| Estagnados         | small, medium, large | count in dots (56), "sem progredir há 3 semanas"              | "3 semanas sem progredir", 3 exercises with their best load        | 7 exercises and a note suggesting to talk to the instructor                                                    |

With no data, Estagnados shows `0` and "Tudo progredindo" in every size; the others show their empty sentence (for example "Seu primeiro treino aparece aqui.").

## Iconography

- Source: `src/shared/ui/icons.tsx`, drawn to match "Ponto e linha": a 24×24 grid, a 1.5px line in `currentColor`, round caps and joins, no fill. Play and the three tile shapes of the size switch are the only solid icons.
- Size: 24px by default; 22px in the tabs, 20px in buttons, 16–18px in 32px chips.
- Color: inherits the text color: white inside red circles, `ink` on glass and transparent buttons, `ink-secondary` for trailing row marks (chevron, pencil, plus).
- Set: summary, dumbbell, chart, person (tabs); arrow-right, check, chevron-left, chevron-right, close, minus, plus, pencil, external-link, trash, undo, sun, moon (actions); play; tile-small, tile-medium, tile-large.
- Every icon-only button has an `aria-label` in Portuguese ("Voltar", "Fechar", "Editar o painel", "Alternar tema claro e escuro", "Descartar treino", "Buscar … no YouTube, abre em nova aba").

## Labels

- Text labels only inside Ajustes and Perfil: their rows and actions show text.
- Everywhere else, actions are icons. The exceptions that keep text:
    - the main pill actions (Confirmar, Começar treino, Finalizar treino, Próximo exercício) and the onboarding's "Começar" and "Continuar";
    - the single action pill of a sheet, which confirms or saves ("Salvar", "Limpar ficha", "Descartar treino");
    - "Pular" in the onboarding, and the secondary destructive links "Limpar ficha" and "Remover do treino".
- The toast's single action ("Tentar de novo") is text too.
- Tap targets are at least 44×44px; small chips and text buttons get the `tap-target` hit area.

## Motion

### Rules

- **Motion starts on input, never after the network.** A tap changes the screen in the same frame: the press scales on pointer down, a logged set shows as done, the next exercise slides in; the save runs in the background. A screen whose data is not on the client yet shows its skeleton at once (`loading.tsx`).
- **Animate only `transform` and `opacity`.** Never width, height, top/left, margin, padding, border, box-shadow, font size or color.
    - For a size change, scale plus a counter-scale on children, or crossfade two states (the wheel values).
    - For a sheet, `translateY`.
    - For an accordion, `grid-template-rows` 0fr→1fr only if a transform cannot do it, documented here as an exception. There is none today.
- **Two springs, used everywhere** (CSS `linear()` curves sampled from a damped spring, in `globals.css`; Tailwind `ease-snappy` and `ease-settle`):
    - **`snappy`**: critically damped, 180ms, no overshoot (`--vita-spring-snappy`, `--vita-duration-snappy`). Press release, toggles, chips, the wheel's crossfade, numbers that roll.
    - **`settle`**: damping 0.8, 280ms, 1.5% overshoot (`--vita-spring-settle`, `--vita-duration-settle`). Sheets, screen slides, cards and rows entering, a dragged sheet snapping back.
    - Leaving uses `cubic-bezier(0.4, 0, 1, 1)` (`--vita-ease-exit`): 200ms for a sheet or a swiped row (`--vita-duration-exit`), 180ms for the screen that slides out. Fades keep `cubic-bezier(0.2, 0, 0, 1)` at 150ms (`--vita-ease-enter`, `--vita-duration-press`).
- **Every interactive element has a press state:** scale 0.96 and opacity 0.85 in 80ms on pointer down (`--vita-duration-press-in`), back with `snappy` on release (`pressable`).
- **Elements enter, they never pop in:** fade and rise 8px, lists staggered by 30ms. Leaving elements fade out faster than they came in.
- **Sheets:** slide up from the bottom with `translateY` (`settle`) while the backdrop fades in. While dragged they follow the finger; past 96px, or flicked faster than 0.5px/ms, they close; otherwise they spring back with `settle`. Tapping the backdrop or Esc also closes.
- **Screens:** between the workout list and the exercise focus screen, and between onboarding steps, a horizontal slide of 24px with a fade, done within 280ms (`settle`). Forward goes left, back goes right. In the workout it starts on the tap, since the data is already on the client. The floating bar does not slide: it crossfades in place.
- **Numbers that change** (the set number, sets done, the confirmed value, the onboarding step) roll up a short way; the wheel values crossfade. Never a hard swap.
- **No visible bounce on everyday UI.** `settle` overshoots 1.5% at most, which reads as weight, not bounce. The theme toggle's hover lean is the only real overshoot, and only on a mouse.
- **`prefers-reduced-motion`:** every animation and transition becomes an instant change; view transitions do not run; the exercise drawings sit still, side by side.
- Every keyframe animation uses a `backwards` fill, so no transform stays on the element after it ends (a leftover transform would trap the fixed floating bar inside it).

### Utilities (`src/app/globals.css`)

- `pressable`: the press state above (0.96 in 80ms, release with `snappy`). Also removes the tap highlight.
- `tap-target`: grows the hit area to 44×44px without changing the look.
- `rise-in`: fade and rise 8px with `settle`, delayed by `--stagger` × 30ms. On widget tiles, exercise rows, the welcome list and the toast.
- `fade-in`: 150ms fade. The active tab, the edit overlay, the sheet backdrop.
- `slide-forward` / `slide-back`: 24px from the right or the left with a fade, `settle`. The onboarding steps.
- `roll-in`: rise 0.45em with a fade, `snappy`. Numbers that change.
- `sheet-in`, `sheet-snap` and `leave`: the sheet's entrance (`settle`), its spring back after a drag (`settle`) and every exit (200ms, exit easing; also the swiped-away row).
- `wheel-tick`: the 2% scale pulse, 80ms, of the value reaching the wheel's center.
- `skeleton`: loading placeholders fade in after 150ms, so a fast load never flashes them.
- `spin-once`: one 360° turn, 280ms, `snappy`. The theme toggle.
- `pose-cycle`: the exercise drawings take turns, 2.4s per cycle with 0.24s fades.
- Route slides use React's `<ViewTransition>` (`src/shared/ui/screen-transition.tsx`): links carry `transitionTypes={["nav-forward"]}` or `["nav-back"]` (inside the workout, the client update carries the same type with `addTransitionType`), and `::view-transition-old/new(.nav-forward | .nav-back)` play the slide: the new screen with `settle` in 280ms, the old one out in 180ms. Untyped navigations (tabs, the browser's back button) only crossfade.

## Writing

- Brazilian Portuguese, in the second person ("você"), friendly and direct.
- Short sentences; one idea per line. Labels are a word or two.
- No jargon from apps or gyms the person might not know; numbers come with their unit.
- Sentence case; no period in titles, buttons or labels. Full sentences in captions and empty states end with a period.
- Say what to do next when something is missing.

Examples from the screens:

- Titles and labels: "Resumo", "Treino A", "Próximo treino", "Série 2", "Adicionar widget".
- Actions: "Finalizar treino", "Confirmar 40 × 10", "Próximo exercício", "Voltar à lista", "Continuar", "Registrar peso", "Limpar ficha".
- Status: "Sobe de carga hoje", "Concluído", "3 de 8 exercícios concluídos", "Meta batida", "Tudo progredindo".
- Empty states: "Monte sua ficha em Treinos.", "Registre seu peso em Perfil.", "Seu primeiro treino aparece aqui.", "Nenhum recorde nos últimos 30 dias."
- Explanations: "Registre cada série em segundos e veja o quanto você evoluiu.", "Vale conversar com o instrutor sobre ajustar a faixa de repetições ou trocar o exercício."

## Do and don't

### Behavior

- The app decides when the answer is obvious and asks only when it is not. Example: the selection wheel opens on the new load after an obvious progression, with a discreet mark.
- No streaks. A weekly goal that never erases past effort.
- One clear primary action per screen, and one floating bar.

### Do

- Let numbers be large and words small; align numbers on the same baseline as their unit.
- Use red only to signal, and never more than one red element competing on screen.
- Use hairlines to separate rows or columns of the same kind, and space for everything else.
- Use only the tokens and utilities from `src/app/globals.css`.

### Don't (signs of AI-generated design)

Dividers and the dot-matrix font are part of the VITA language and are used on purpose; everything below is avoided as decoration.

Tags and pills; excessive italics; Instrument Serif; negative letter spacing; over-detailed UI; too many dividers; many color shades and opacities; containers with borders; over-detailed diagrams; verbose or redundant text; code-like breadcrumbs; section numbering; eyebrows; dithering; ASCII images; squircles; excessive monospace fonts; ALL CAPS subtitles; gradient backgrounds; periods in titles.

Also: no cards around everything, no bold text, no grain textures, no shadows to lift content.

## Inconsistências encontradas

1. **Dots under 36px**: the `vita` wordmark uses `num` at 20px on Resumo and Entrar, against the "dots only from 36px" rule.
2. **Period in a title**: the Entrar hero "Seus treinos, sua evolução." ends with a period.
3. **Captions with and without a period**: Semana small says "Falta 1" / "Meta batida"; medium says "Falta 1 treino." / "Meta da semana batida."; Estagnados says "Tudo progredindo" with no period.
4. **Widget titles that change with size**: Recordes is titled "Recorde" in the small size and Volume por músculo is titled "Mais treinado"; the catalog and the sheet use the catalog names.
5. **Weight 500**: no longer used by the tabs or the edit mode (both are icons now); the `accent-strong` text button tone remains defined.
6. **Screen margins differ**: 20px on Resumo, 24px on the workout list, Entrar and placeholder tabs, 16px (+8px) on the exercise screen. Top padding differs too: 52, 56 and 64px.
7. **Radius outside the scale**: the active exercise row uses 16px (`rounded-2xl`).
8. **Radii not concentric in the panel**: fixed; the wheel scroller is 10px (`innerRadius(30, 20)`).
9. **Red as an outline**: today's day in Semana (large) is a red 1.5px ring, while the red rule allows red only as a fill.
10. **Colors outside the tokens**: the edit overlay (`bg-paper/45`, `backdrop-blur-[2px]`) and the theme colors repeated as hex in `src/app/layout.tsx`. The sheet scrim is now the `scrim` token.
11. **Text at 11px** (Peso and Volume por músculo, large), below the 13px used everywhere else.
12. **Letter spacing on numbers**: `num` sets `letter-spacing: 0.01em`, while the rules forbid letter spacing.
13. **Unused code**: the `smoke` and `limelight` utilities and the `level-1` to `level-3` tokens are not used by any screen. `panel` is still described as "Panel glass" in a CSS comment, though it has no blur.
14. **Icons outside `icons.tsx`**: fixed; every glyph, including the plus, comes from the icon set.
15. **Shadows left**: `panel` and `glass-light` still have shadows (listed under "Elevation"); the bottom bar no longer does.
