# VITA design system: "Ponto e linha"

## Status

Locked on 2026-11-07. Changes need the owner's approval.

"Ponto e linha" (dot and line) is the visual language of VITA: a calm, editorial workout tracker where data is the hero. Large numbers are drawn in a round dot matrix, in the spirit of Nothing; text is thin and small, and content is separated by thin lines and space, in the spirit of teenage engineering. Color follows a strict 60/30/10 rule with red as the only accent, and glass appears only on the few elements that float over content.

This file describes what is in the code today. The source of truth for every value is `src/app/globals.css` (tokens and utilities) and the screens in `src/app/`. If the two ever disagree, the code wins and this file is corrected.

## Colors

All colors are CSS custom properties on `:root` in `src/app/globals.css`, switched by `prefers-color-scheme: dark`, and exposed to Tailwind as `bg-*`, `text-*`, `border-*`, `ring-*`, `fill-*` and `stroke-*` through `@theme inline` (for example `--vita-ink` → `text-ink`).

| Role                    | Token                       | Light     | Dark      | Where to use                                                                                  |
| ----------------------- | --------------------------- | --------- | --------- | --------------------------------------------------------------------------------------------- |
| Page background         | `--vita-canvas`             | `#F4F2F1` | `#0B0B0D` | `body`; text on ink pills (`text-canvas`); inner chips in edit mode                           |
| Surface                 | `--vita-paper`              | `#FCF8F7` | `#161618` | widget tiles, the active exercise row, the edit overlay (45%)                                 |
| Primary text            | `--vita-ink`                | `#0B0B0D` | `#FCF8F7` | text, done dots, trained days, sparkline, action pill fill                                    |
| Secondary text          | `--vita-ink-secondary`      | `#5B5B60` | `#A1A1A6` | labels, captions, inactive tabs, pending rows                                                 |
| Divider                 | `--vita-hairline`           | `#DEDAD9` | `#26262A` | 1px row and column dividers; future days; tile ring in edit mode                              |
| Unlit dot               | `--vita-dot-off`            | `#D6D2D1` | `#2E2E33` | unlit dots, bar tracks, the goal part of a fraction (`/4`), dashed "Adicionar" edge           |
| Secondary text on ink   | `--vita-on-ink-secondary`   | `#A1A1A6` | `#5B5B60` | secondary text inside the ink action pill                                                     |
| Activity level 1        | `--vita-level-1`            | `#BDB8B7` | `#4A4A50` | defined, not used by any screen today                                                         |
| Activity level 2        | `--vita-level-2`            | `#7D797C` | `#96969B` | defined, not used by any screen today                                                         |
| Activity level 3        | `--vita-level-3`            | `#0B0B0D` | `#FCF8F7` | defined, not used by any screen today                                                         |
| Accent                  | `--vita-red`                | `#FF1744` | `#FF1744` | fills only: action circles, status dots, goal-met marks, the sparkline's last point           |
| Accent text             | `--vita-red-text`           | `#C8102E` | `#FF4D6D` | any red text ("Concluir", "Descartar treino", error messages), contrast safe on both canvases |
| Dark panel              | `--vita-panel`              | `#0B0B0D` | `#1A1A1D` | the set logger panel                                                                          |
| Text on panel           | `--vita-on-panel`           | `#FCF8F7` | `#FCF8F7` | selected wheel value, done set dots on the panel                                              |
| Secondary text on panel | `--vita-on-panel-secondary` | `#9A9A9F` | `#9A9A9F` | panel labels, units, "last time" line                                                         |
| Dim text on panel       | `--vita-on-panel-dim`       | `#6E6E73` | `#6E6E73` | unselected wheel values, wheel focus ring                                                     |
| Track on panel          | `--vita-panel-track`        | `#3A3A3F` | `#3A3A3F` | pending set dots on the panel                                                                 |

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
| 500    | `font-medium`                   | the active tab in the bottom bar, and the "Concluir" button in edit mode        |

No other weights are used. Doto is always 900 through `num`.

### Size scale in use

| Size (px) | Family | Where                                                                                    |
| --------- | ------ | ---------------------------------------------------------------------------------------- |
| 11        | Inter  | chart axis labels inside large widgets (Peso min/max, Volume reference)                  |
| 13        | Inter  | tabs, widget titles, captions, status lines, secondary row text, units                   |
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
| 30px   | panels: the set logger panel, the "Adicionar widget" sheet                                                              |
| 26px   | widget tiles and the "Adicionar" tile                                                                                   |
| 20px   | inner areas: the wheel scroller inside the panel                                                                        |
| 16px   | the highlight of the active row in the exercise list                                                                    |

Concentric radii: a shape nested inside another uses the outer radius minus the gap between them, so the curves stay parallel. Example: the 48px action pill holds a 44px circle 4px from its end.

### Elevation

Elevation comes from translucency, blur and contrast, not from shadows. The bottom bar has no shadow. The only shadows left in the code are:

- `panel`: `inset 0 1px 0 rgb(255 255 255 / 0.12)` and `0 24px 50px -32px rgb(11 11 13 / 0.55)`.
- `glass-light`: `0 8px 24px -16px rgb(11 11 13 / 0.45)`.
- `smoke` (defined, not used by any screen): `0 22px 50px -24px rgb(11 11 13 / 0.6)`.

Stacking: bottom bars at `z-20`, the "Adicionar widget" sheet at `z-40` over a scrim of `ink` at 20%.

## Surfaces

| Surface       | Recipe                                                                                                                                                                                                                    | Where                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `float-bar`   | light: `rgb(252 248 247 / 0.46)`, `backdrop-filter: blur(28px) saturate(200%)`, `1px solid rgb(11 11 13 / 0.06)`. Dark: `rgb(30 30 33 / 0.5)`, edge `rgb(255 255 255 / 0.08)`. No shadow                                  | bottom bar (Resumo, workout list, exercise), the "Adicionar widget" sheet |
| `glass-light` | light: `rgb(252 248 247 / 0.72)`, `blur(20px) saturate(165%)`, `1px solid rgb(11 11 13 / 0.05)`, shadow `0 8px 24px -16px rgb(11 11 13 / 0.45)`, text `ink`. Dark: `rgb(28 28 30 / 0.72)`, edge `rgb(255 255 255 / 0.08)` | round buttons at the top (back, video)                                    |
| `panel`       | `--vita-panel` fill, sheen `linear-gradient(to bottom, rgb(255 255 255 / 0.06), transparent 45%)`, `1px solid rgb(255 255 255 / 0.06)`, shadows listed above, text `on-panel`                                             | set logger                                                                |
| `quiet`       | `rgb(255 255 255 / 0.07)` with `1px solid rgb(255 255 255 / 0.08)`                                                                                                                                                        | the selection band across the wheels, inside the panel                    |
| Widget tile   | `bg-paper`, radius 26, no border, no shadow, 16px padding                                                                                                                                                                 | every Resumo widget                                                       |
| Edit overlay  | `bg-paper/45` with `backdrop-blur-[2px]`, over the tile content at 40% opacity; the tile gets `ring-1 ring-hairline`                                                                                                      | widget tiles in edit mode                                                 |

Glass appears only in four places: the bottom bar, the round buttons at the top, the edit layer of the widgets and the sheets that rise from the bottom. Content on the canvas has no container: it is separated by space and, when needed, a hairline. `smoke` and `limelight` are defined in `globals.css` and not used by any screen.

## Components

### Bottom bar

- Anatomy: a `float-bar` pill (`rounded-full`, 8px padding, 4px gap, up to 448px wide), centered and fixed at the bottom. On Resumo: four text tabs in equal columns (Resumo, Treinos, Evolução, Corpo) and, at the end, the screen's main action. On the workout list: the action pill "Finalizar treino". On the exercise screen: the round undo button (after the first set) and the action pill.
- Sizes: 48px controls and 8px padding, so the bar is 66px tall with its 1px edge.
- Tabs: 13px; active in `ink` at weight 500 with `aria-current="page"`; inactive in `ink-secondary`, `ink` on hover.
- Desktop: on the exercise screen the bar becomes static under the content and takes the full width.

### Red action circle (`roundActionClass`)

48px red circle, white filled play icon at 18px. Starts or continues a workout from the bottom bar on Resumo. Absent when there is no workout to start.

### Action pill (`pillActionClass` + `PillActionContent`)

- 48px tall, full width, `bg-ink` with `text-canvas` (inverts in dark), 20px left padding and 4px right padding.
- Label at 15px weight 400 on the left, with an optional secondary part in `on-ink-secondary` at 13px ("Finalizar treino 3 de 8") or a tabular value ("Confirmar 40 × 10").
- A 44px red circle at the right end holds a white icon at 20px (check or arrow).
- States: pressed (`pressable`), disabled at 60% opacity (sign in with Google, a set being saved).
- Where: "Finalizar treino", "Confirmar …", "Próximo exercício" / "Voltar à lista", "Entrar como Leonardo" / "Entrar com Google".

### Round secondary button (`roundSecondaryClass`)

48px, transparent, `ink` icon at 20px. Undo the last set, inside the bottom bar.

### Round light glass button

44px `glass-light` circle at the top of the workout screens: back (chevron at 20px, stroke 1.8) and the exercise video (play at 15px). On desktop the exercise screen hides its back button but keeps its space.

### Selection wheel

- Inside the set logger `panel` (radius 30, 20px padding), under the heading "Série N" (15px, `on-panel-secondary`) and the set dots (7px: done `on-panel`, current `red`, pending `panel-track`).
- Native scroll snap, three visible rows of 64px, with a mask that fades the top and bottom. Selected value in `num` at 56px in `on-panel`; neighbours in Inter 300 at 22px in `on-panel-dim`; the change animates font size and color over 150ms ease out.
- One `quiet` band (999px radius, 60px tall) spans every wheel on the panel.
- Load on the left (aligned start), reps on the right (aligned end); exercises by time show one centered wheel in seconds. Unit label under each wheel at 13px.
- When the app raised the load, a 7px red dot sits next to the selected load on the first set.
- Optional lines: the question for the person (13px, above), and "last time" (13px, below a 1px white 8% divider).
- Keyboard: arrow up and down move one step; the scroller shows a 1px `on-panel-dim` focus ring.

### Set list

Under the panel: one 48px row per target set, 15px, with hairlines between rows. Label "Série N" on the left; on the right the value in Inter 17px weight 400 with tabular figures (`40 × 10` or a duration), or `·` in `ink-secondary` while pending. The newest set pulses once when logged.

### Exercise list

- An ordered list with hairlines between rows; rows rise in with a 30ms stagger.
- Each row is at least 64px: name at 17px (weight 400 while pending, 300 in `ink-secondary` when complete) and a status line at 13px ("Concluído", "Sobe de carga hoje" or "4 séries").
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

- "Editar" (15px, weight 400) at the top right of Resumo turns on editing; it becomes "Cancelar" (15px, `ink-secondary`) and "Concluir" (15px, weight 500, `red-text`; "Salvando" while saving). "Cancelar" restores the saved layout.
- Each tile shows its content at 40% opacity under the edit overlay and gets a hairline ring. On the overlay (12px padding): top left, a 32px `ink` circle with a minus to remove; top right, two 32px `canvas` circles to move earlier or later (30% opacity when not possible); bottom left, the title at 15px and, when the widget has more than one size, a size switch (a `canvas` pill with 4px padding and 32px options; the selected one in `ink` with `canvas` glyph, the rest in `ink-secondary`).
- A 1×1 "Adicionar" tile with a dashed `dot-off` edge, a "+" at 28px and the label at 15px opens the sheet. It is shown only while there are widgets left to add.

### "Adicionar widget" sheet

A `float-bar` sheet with radius 30 (12px from the screen edges, up to 448px wide, 20px padding) that rises in over a 20% `ink` scrim; tapping the scrim or "Fechar" closes it. Title at 22px weight 400. One row per widget not on screen, with hairlines between: the title at 17px weight 400, the description at 13px, and a 32px red circle with a white "+". A new widget comes in the medium size when it supports it, otherwise its first size.

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

- Source: `src/shared/ui/icons.tsx`. 24×24 view box, line icons in `currentColor`, no fill, round caps and joins.
- Stroke: 1.9 by default; ArrowRight 2.4, ArrowUp 2.8, Check 2.6, ChevronLeft 2 (called with 1.8 on the top buttons). Play is the only filled icon.
- Size: 22px by default; used at 20px (arrow, check, chevron, undo) and at 18 and 15px (play).
- Color: inherits the text color: white inside red circles, `ink` on glass and transparent buttons.
- Defined but not used today: SummaryIcon, DumbbellIcon, ChartIcon, ScaleIcon, ArrowUpIcon.
- The edit mode draws its own small glyphs inline in `dashboard.tsx` (minus, chevrons, size shapes, 14–16px) and uses a text "+" for adding.

## Motion

### Rules

- Ease out for entrances; ease in out for moves along the screen.
- Dropdowns and popovers: 150 to 250ms; popovers start at scale 0.95.
- Stagger list rows by 30ms; stagger details as they settle.
- Press: scale to 0.97. Do not animate while a control is held.
- Stretch moving knobs by about 12%. Use arcs for object movement.
- Pulse to confirm success (for example, a confirmed set).
- Enter from the trigger and exit back to it; exits are 20% shorter than entrances.
- Overlap the old and the new state; crossfade icons with a little blur; use masks for reveals and color changes.
- No bounce on everyday UI. Rubber band past scroll bounds.
- Shared elements keep the same `layoutId` (Motion) across screens.
- Respect `prefers-reduced-motion`.

### What the code does today

- `pressable`: on press, scale to 0.97 at once (0ms, no animation while held); release returns over 140ms with `cubic-bezier(0.2, 0.8, 0.2, 1)`. Also removes the tap highlight. On every tappable control.
- `rise-in`: fade in and rise 8px over 360ms with the same curve, delayed by `--stagger` × 30ms. On widget tiles, exercise rows and the "Adicionar widget" sheet.
- `pulse-once`: scale 1 → 1.18 → 1 over 380ms. On the value of the set that was just logged.
- The selection wheel animates size and color of the values over 150ms ease out; the tabs change color with a transition.
- `prefers-reduced-motion: reduce` cuts every animation and transition to 0.01ms.
- The `motion` package is installed but not imported yet, so no shared `layoutId` transitions exist.

## Writing

- Brazilian Portuguese, in the second person ("você"), friendly and direct.
- Short sentences; one idea per line. Labels are a word or two.
- No jargon from apps or gyms the person might not know; numbers come with their unit.
- Sentence case; no period in titles, buttons or labels. Full sentences in captions and empty states end with a period.
- Say what to do next when something is missing.

Examples from the screens:

- Titles and labels: "Resumo", "Treino A", "Próximo treino", "Série 2", "Adicionar widget".
- Actions: "Finalizar treino", "Confirmar 40 × 10", "Próximo exercício", "Voltar à lista", "Descartar treino", "Editar", "Concluir".
- Status: "Sobe de carga hoje", "Concluído", "3 de 8 exercícios concluídos", "Meta batida", "Tudo progredindo".
- Empty states: "Monte sua ficha em Treinos.", "Registre seu peso em Corpo.", "Seu primeiro treino aparece aqui.", "Nenhum recorde nos últimos 30 dias."
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
5. **Weight 500 in two places**: the active tab and the "Concluir" button; the earlier draft allowed 500 only for the active tab.
6. **Screen margins differ**: 20px on Resumo, 24px on the workout list, Entrar and placeholder tabs, 16px (+8px) on the exercise screen. Top padding differs too: 52, 56 and 64px.
7. **Radius outside the scale**: the active exercise row uses 16px (`rounded-2xl`).
8. **Radii not concentric in the panel**: the panel is 30px with 20px padding, but the wheel scroller inside is 20px (concentric would be 10px).
9. **Red as an outline**: today's day in Semana (large) is a red 1.5px ring, while the red rule allows red only as a fill.
10. **Colors outside the tokens**: white inside red circles (`text-white`), the "last time" divider on the panel (`border-white/[0.08]`), the edit overlay (`bg-paper/45`, `backdrop-blur-[2px]`), the sheet scrim (`bg-ink/20`), and the theme colors repeated as hex in `src/app/layout.tsx`.
11. **Text at 11px** (Peso and Volume por músculo, large), below the 13px used everywhere else.
12. **Letter spacing on numbers**: `num` sets `letter-spacing: 0.01em`, while the rules forbid letter spacing.
13. **Unused code**: the `smoke` and `limelight` utilities, the `level-1` to `level-3` tokens and five icons (Summary, Dumbbell, Chart, Scale, ArrowUp) are not used by any screen. `panel` is still described as "Panel glass" in a CSS comment, though it has no blur.
14. **Icons outside `icons.tsx`**: the edit mode draws its minus, chevrons and size glyphs inline (strokes 2.4 and 2.2), and the add buttons use a text "+".
15. **Shadows left**: `panel` and `glass-light` still have shadows (listed under "Elevation"); the bottom bar no longer does.
