# VITA design system v2

## Status

Locked on 2026-11-09. It replaces "Ponto e linha" (v1). The owner designed v2 in Figma and approved it screen by screen; this file is the single source of truth. Visual changes need the owner's approval.

Revised on 2026-11-10 with the owner's approval: square blocks with round accents (section 6), black on black in the dark theme, `PrimaryAction` on paper, two glasses, the bottom bar as a glass surface, the dot-matrix navbar icons and the red label of the active tab.

When a case is not described here, apply the rules of sections 1 to 9. Never invent decoration.

Values live in `src/app/globals.css` (tokens and utilities) and `src/shared/ui/` (components). If the code and this file disagree, the code is wrong.

## 1. Concept

Bold, sharp, editorial and precise, for young people who want to be sharp. Black and white, with one red accent that only marks what is live and what was achieved. It must feel cutting edge, never generic.

- Big type and big numbers carry the screen. Words are few and short.
- Space, scale and tone separate things. Never a line or a box.
- Every element sits on the grid: a column edge or the baseline of its neighbor.

## 2. Type

Three voices, two families. There is no third family.

| Voice           | Family    | Setting                                                                    | Utility    |
| --------------- | --------- | -------------------------------------------------------------------------- | ---------- |
| Headline        | Mona Sans | 900, width 125, uppercase, tracking −2% (34 px and up), line height 92%    | `headline` |
| Action          | Mona Sans | 900, width 125, uppercase, tracking +3% (20 px and down)                   | `action`   |
| Strong          | Mona Sans | 900, width 112 ("900/112"): values, the active tab, the clock              | `strong`   |
| Body            | Mona Sans | 400 to 600, width 100, sentence case                                       | (default)  |
| Small label     | Mona Sans | 11 px, 600, uppercase, tracking +8%, `secondary`                           | `label`    |
| Number (36 px+) | Doto      | 900, `ROND` 100, tabular. Only for numbers of 36 px and up. **Never red.** | `num`      |

- **Mona Sans** is the variable font from the official repository (`github/mona-sans`, SIL Open Font License), self-hosted with `next/font/local` from `src/app/fonts/mona-sans-vf.woff2` (axes `wdth` 75–125, `wght` 200–900, `opsz`). Width is set with `font-stretch` (125%, 112%, 100%). No request to a CDN.
- **Doto** (`src/app/fonts/doto-*.woff2`) draws numbers from 36 px up. Under 36 px a number is Mona Sans with tabular figures (`tabular-nums`).
- Doto numbers are ink or secondary, never red. `DotNumber` has no color prop that allows red (TypeScript rejects it).
- Small labels end with no period. Sentences end with a period.

### Size scale

The only sizes:

| Size    | Use                                                                             |
| ------- | ------------------------------------------------------------------------------- |
| 10      | the meta line of `PrimaryAction`, chart values                                  |
| 11      | small labels, tab labels, day letters, chart labels                             |
| 12      | the title of a P widget (900/112, uppercase), named in the Figma widgets        |
| 13      | notes, units next to a Doto number, the clock, the next exercise                |
| 15      | body, action labels in `PrimaryAction`, stepper values, captions under the hero |
| 17      | list names in sheets, lead sentences                                            |
| 20      | headline of an M widget ("TREINO B" in Último treino)                           |
| 24      | the `vita` wordmark only (Doto, a logo, not data)                               |
| 28      | the edit mode title ("SUA HOME")                                                |
| 34      | screen titles, the exercise name                                                |
| 36      | secondary Doto numbers (a change, the wheel neighbors)                          |
| 56 / 58 | Doto numbers of P and M widgets (56); the hero workout name (58)                |
| 64      | the selected wheel value                                                        |
| 128     | the Semana G number                                                             |

12, 24, 28 and 36 come from the approved screens and are listed so they are part of the scale, not exceptions.

Examples:

- `<h1 class="headline text-58">Treino B</h1>`
- `<p class="label">Hoje · 4ª sessão da semana</p>`
- `<DotNumber size={56} unit="kg">35</DotNumber>`

## 3. Color

| Token                | Light      | Dark         | Tailwind                |
| -------------------- | ---------- | ------------ | ----------------------- |
| `--vita-bg`          | `#F4F2F1`  | `#000000`    | `bg-bg`                 |
| `--vita-paper`       | `#FCF8F7`  | `#0E0E10`    | `bg-paper`              |
| `--vita-ink`         | `#0B0B0D`  | `#F4F2F1`    | `text-ink`, `bg-ink`    |
| `--vita-secondary`   | `#6E6E73`  | `#8C8C92`    | `text-secondary`        |
| `--vita-off`         | `#D6D2CF`  | `#2A2A2E`    | `bg-off`                |
| `--vita-accent`      | `#FF1744`  | `#FF1744`    | `bg-accent`             |
| `--vita-accent-text` | `#FF1744`  | `#FF1744`    | `text-accent-text`      |
| `--vita-tint`        | ink at 6%  | paper        | `bg-tint`               |
| `--vita-on-accent`   | `#FFFFFF`  | `#FFFFFF`    | dots in the red cell    |
| `--vita-scrim`       | ink at 28% | black at 50% | the backdrop of a sheet |

Light and dark follow the system, unless the person forced a theme (the `vita_theme` cookie, read by the root layout, which sets `data-theme` on `<html>`).

**Dark is black on black.** The background is pure black and every surface (the `PrimaryAction`, choice rows, inputs, icon buttons, the undo button) is one near-black, paper (`#0E0E10`). There is no grey surface on black. Red text is the accent itself in both themes (`#FF1744`, about 5.1:1 on black).

`PrimaryAction` has its own three values: background `--vita-cta-bg` (paper in both themes), label `--vita-cta-fg` (ink) and meta `--vita-cta-meta` (secondary). Its red cell is what marks it as the main action.

The browser theme color and the PWA manifest use the background (`#000000` in dark).

### The red rule

Red marks only:

- **what is live:** today, the current set, the current exercise, the session clock dot;
- **achievements:** records, the "+2,5 kg" note, the best hour;
- **the primary action's cell;**
- **the label of the active tab** in the navbar (the icon stays ink).

Red is a fill (dots, ticks, the cell) or `accent-text` for a short note. It never fills an area larger than the red cell, and Doto numbers are never red. Off dots and empty states are never red.

## 4. Spacing and layout

8 px grid. On the phone: 4 columns, 20 px side margins, 12 px gutters (a 350 px content width on a 390 px screen).

| Space | Between                                                      | Tailwind    |
| ----- | ------------------------------------------------------------ | ----------- |
| 64    | home widgets, and sections of a screen                       | `*-section` |
| 48    | widgets in edit mode                                         | `*-edit`    |
| 32    | blocks of a different subject                                | `*-block`   |
| 24    | a title and what it introduces; the top bar and what follows | `*-intro`   |
| 16    | a section label and its content                              | `*-label`   |
| 12    | side-by-side items (the gutter)                              | `*-gutter`  |
| 8     | inside a block                                               | `*-inner`   |

There are no other spacings. Insets that are not spacing between elements (the safe areas, the 6 px padding of the red cell, the 2 px padding of the size selector) are part of the component.

- **Top inset:** `max(env(safe-area-inset-top), 24px)`, then the 40 px top bar (`pt-top`).
- **Bottom clearance:** screens with the navbar leave 136 px (34 + 68 + 32) under the last element; screens with a bottom bar leave 112 px above the safe inset (16 px of glass, the 64 px bar and 32 px of air), and the set logging screen 176 px, for the "PRÓXIMO" row.
- Every element aligns to a column edge or to the baseline of its neighbor. A widget of size P takes 2 columns; M and G take 4.

## 5. No borders

No strokes, outlines, dividers or shadows anywhere. Separation comes from space, scale and tone.

Only things you can tap may have a background fill: buttons, the size selector, icon buttons, choice rows, text inputs. Information never sits in a box.

The only surfaces are the two glasses and sheets (opaque `bg`, so paper controls stay visible on them):

- `glass`: paper at 50% with a 32 px blur and a 160% saturation lift. The bottom bar of task screens and the toast: content scrolling under it blurs, so it never collides with the bar's text.
- `glass-clear`: paper at 35% with a 12 px blur and a 180% saturation lift. The navbar only: the content behind stays legible.

Focus is shown with the `focus-ring` utility: a 2 px ink outline offset by 2 px, only for keyboard focus (`:focus-visible`). It is an accessibility signal, not decoration.

## 6. Shape

Square blocks with round accents. The mix is deliberate: blocks carry content, round shapes mark what you act on or where you are.

- **Square (radius 0):** choice rows, text inputs, `TextButton`, the size selector and its cells, sheets, the toast, the rows of Perfil and Ajustes. The radius tokens (`rounded-cta`, `rounded-button`, `rounded-selector`, `rounded-sheet`) are all 0.
- **Pills:** `PrimaryAction` and the navbar (`rounded-full`).
- **Circles:** the red cell of `PrimaryAction` (52 px, concentric with the pill's end: 32 − 6 = 26), icon-only buttons (40 px), the undo button of the set logging screen (64 px).
- Dots, ticks and the 4 px bars are fully round: they are marks, not containers.
- When a rounded shape sits inside another with even padding, use `concentricRadius(outer, padding)` in `src/shared/ui/concentric.ts`; never work it out by hand.

## 7. Components

All in `src/shared/ui/`.

### `PrimaryAction`

The one main action of a screen.

- A 64 px pill, solid `cta-bg` (paper), no gradient, no shadow. Full width, or the rest of a row.
- Left, 20 px in: the label in Mona 900/125 at 15 px, +3% tracking, and under it the meta line at 10 px, uppercase, +10% tracking, in `cta-meta`.
- Right: a red circle of 52 px, 6 px from the top, bottom and end, holding a **5 × 5 dot-matrix glyph**: white dots of 4 px every 6.5 px; "off" dots at 18% opacity.
- Glyphs (`#` lit, `.` off):

    ```
    arrow ("Começar")    check ("Confirmar", "Concluir")
    ..#..                .....
    ...#.                ....#
    #####                ...#.
    ...#.                #.#..
    ..#..                .#...
    ```

- Press: the button scales to 0.97 and the glyph's lit dots light up one by one along the shape (left to right), with `snappy`.
- Disabled: 40% opacity, no press.

```tsx
<PrimaryAction label="Começar" meta="7 exercícios · ~50 min" glyph="arrow" />
```

### `IconButton`

A 40 px circle, `tint` background, 20 px icon, `aria-label` in Portuguese (required by its type). It keeps a 44 × 44 px hit area. Back, external reference, edit, theme, close, remove.

### `TextButton`

A square-cornered rectangle, 44 px high, label in Mona 900/125 at 13 px, +3%. Tones: `tint` (tint background, ink label) and `ink` (ink background, bg label). "CONCLUIR" in edit mode is `ink`; "PULAR", "SAIR", "LIMPAR FICHA" are `tint`.

### `PlusButton`

The "+ LABEL" text button: an ink circle (28 px in empty states, 32 px for "ADICIONAR WIDGET" and sheet rows) with a "+" in bg color, then the label in Mona 900/125 at 13 px. No background around the label.

### `SectionLabel`

An 11 px label at the left, optionally preceded by a 6 px red dot (achievements), and an optional 11 px meta at the right. 16 px above its content.

### `DotNumber`

Doto at 36, 56, 58, 64 or 128 px, ink (default) or secondary. An optional `of` part ("/4") in secondary, an optional `unit` at 13 px in secondary on the same baseline, and `ghost` for empty states (15% opacity). It has no red tone.

### `DotBar`, `DotColumns`, `WeekDots`

- `DotBar`: a row of dots; filled ink for done, off for empty; an optional 1.5 px red vertical tick after the target dot.
- `DotColumns`: vertical columns of dots, one per period (week, hour); filled ink up to the value, off above; one column can be red (the best hour).
- `WeekDots`: seven 12 px dots (or 8 px in M) with the letters S T Q Q S S D at 11 px. Today is a red filled dot with a red letter; days with a workout are ink; every other day, past or future, is off.

### `Stepper`

Segment lines: one 4 px rounded segment per step, 4 px apart, filling the width. Done ink, current red, future off. Segments can be buttons (jump to a step).

### `Sheet`

Opaque `bg`, square corners, a grab handle (36 × 4 px, `off`), the title as a 20 px headline and a close `IconButton`. It slides up with `settle`, follows the finger when dragged by the handle or the title, closes past 96 px or with a flick, and also with Esc or a tap on the backdrop. Focus stays inside while open and returns to the opener on close.

### `SizeSelector`

P · M · G, segmented: a square container with 2 px padding and the tint background; square cells of 32 × 32; the active size is an ink cell with a bg letter; unavailable sizes are greyed (`off` letter) and disabled. A radio group: arrow keys move the choice.

### `EmptyState`

- A ghost Doto value at 15% opacity in the exact place of the real value (`0/4`, `00 kg`, `00,0 kg`).
- One sentence saying what will appear there.
- For manual data, a `PlusButton` "+ REGISTRAR …".

### Choice rows and inputs

Choice lists (onboarding, Perfil, Ajustes) are tappable rows, so they have a fill: 64 px square-cornered rectangles, `tint` when not chosen and an ink cell with bg text when chosen, 8 px apart. A text input is a 64 px square tint rectangle with the value at 20 px.

## 8. Icons

`src/shared/ui/icons.tsx`: a 24 px grid, 1.75 px stroke in `currentColor`, round caps and joins, no fill, 20 px in icon buttons. Every icon-only button has an `aria-label` in Portuguese.

The navbar has its own **dot-matrix icons** (Doto style), in `src/app/_components/app-nav.tsx`: 9 × 9 cells, an SVG of 24 px with `viewBox 0 0 9 9`, a dot centered in each lit cell, `currentColor`. Sized for 3× screens: a cell is 8 device pixels and an inactive dot 6 (r 0.375), so the dots stay sharp on an iPhone. The glyphs are balanced to 32–42 dots each (`#` lit):

```
resumo     treinos    evolucao   perfil
.##...##.  .#.....#.  ......##.  ...###...
#..#.#..#  ##.....##  ......##.  ..#####..
#..#.#..#  ##.....##  ...##.##.  ..#####..
.##...##.  ##.....##  ...##.##.  ..#####..
.........  #########  ##.##.##.  ...###...
.##...##.  ##.....##  ##.##.##.  .........
#..#.#..#  ##.....##  ##.##.##.  ..#####..
#..#.#..#  ##.....##  ##.##.##.  .#######.
.##...##.  .#.....#.  ##.##.##.  #########
```

## 9. Motion

- Only `transform` and `opacity` move.
- Two springs, in `globals.css` as `linear()` curves:
    - `snappy`: about 180 ms, no overshoot. Press, toggles, the glyph sweep, values that change, crossfades.
    - `settle`: about 280 ms, 1–2% overshoot. Sheets, screens, widgets reflowing, elements entering.
- Leaving uses the exit easing in 200 ms.
- **Motion starts on input, never after the network.** Saves are optimistic: the screen changes in the same frame as the tap.
- Press: scale 0.97 (`pressable`), 80 ms in, `snappy` out.
- `prefers-reduced-motion`: animations become quick fades (opacity only, 120 ms); nothing slides or scales.

## 10. Charts

### Weight chart

- 4 horizontal gridlines at 15% ink, the values on the right at 10 px, weight 600.
- The line in ink at 2 px.
- **The area under the line filled with a dot matrix:** 1.3 px dots every 7 px, ink at 28%.
- A hollow start point and a red end point.
- X labels: the start date with its value at the left ("12 out · 73,0") and "hoje" in 900 at the right.

Gridlines are part of the chart's data ink, not dividers.

### Everything else

Dot columns or dot bars: filled ink for done, off for empty, a 1.5 px red vertical tick for a target.

## 11. Screens

### Top bar (main screens)

The `vita` wordmark in Doto at 24 px on the left; circle `IconButton`s on the right (the pencil to edit the home, then the theme toggle). No date.

### Navbar (`AppNav`)

- Floating, 20 px from the sides and 34 px from the bottom (or the safe area, whichever is larger); a 68 px pill, `glass-clear`, no border, no shadow.
- Four equal slots: Resumo, Treinos, Evolução, Perfil; each a 24 px dot-matrix icon 6 px over an 11 px label at 600, centered in the pill.
- Inactive: icon and label in `secondary`. Active: the icon in ink and bold (dots of r 0.4375), its dots lighting up along the diagonal in about 110 ms (`light-up`), and the label in `accent`. The label never changes weight, so the bar does not shift. No dot under the label.
- Switching tabs crossfades the icon states (the bar keeps its view transition name, `vita-bar`).

### Home (Resumo)

Top to bottom, in the 4-column grid:

1. The top bar.
2. 24 px, then the hero (fixed, not a widget): the label "HOJE · 4ª SESSÃO DA SEMANA"; 8 px, the next workout's name as a 58 px headline ("TREINO B"); 8 px, "Costas e bíceps · 7 exercícios" at 15 px in secondary; 32 px, `PrimaryAction` "COMEÇAR" with "7 EXERCÍCIOS · ~50 MIN" and the arrow. While a workout is open: "EM ANDAMENTO", and "CONTINUAR".
3. 64 px, then the widgets, in the order the person chose, 64 px apart.

### Widgets

Every widget is a column with no background:

- header: `SectionLabel` with the widget name (a red dot before it for achievement widgets: Recorde, Melhor horário) and an optional meta at the right (omitted in P);
- 16 px gap;
- body with 8 px inner spacing.

Sizes:

- **P:** half width, (350 − 12) / 2 = 169 px. Two P widgets sit side by side with the 12 px gutter; a P without a pair takes the left half.
- **M:** full width, compact.
- **G:** full width, large.

The common P body: a 56 px `DotNumber` with its 13 px unit, then the title in Mona 900/112 at 12 px uppercase, then a 13 px note.

| Widget          | Sizes   | Content                                                                                                                                                                               |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Semana          | P, M, G | G: "3" ink and "/4" secondary, Doto 128; 16 px; `WeekDots`. M: "3/4" Doto 56 at the left, small week dots at the right. P: "3/4", "TREINOS NA SEMANA", "falta 1 para a meta".         |
| Sequência       | P, M    | Weeks in a row meeting the goal: "6 sem", "SEMANAS NA META", "melhor: 9 semanas". M adds the last 12 weeks as dots.                                                                   |
| Recorde         | P, M    | P: "35 kg", the exercise, "+2,5 kg desde a última vez" in `accent-text`. M: the last 3 records as rows, and "3 recordes nas últimas 2 semanas" in `accent-text`.                      |
| Peso            | P, G    | G: "72,4 kg" with "−0,6" in Doto 36 secondary, then the weight chart (350 × 150). P: the value, "−0,6 kg em 4 sem", a compact dot-filled sparkline.                                   |
| Medidas         | P, M    | Waist (P), or waist, chest and arm rows (M), with the change over 30 days.                                                                                                            |
| Volume semanal  | P, M    | M: one row per muscle: the name (64 px), a 14-dot `DotBar` with the red tick after dot 10, the count. P: the total weekly sets.                                                       |
| Último treino   | P, M    | M: the workout name as a 20 px headline, "ontem · 52 min · 8.420 kg", the top 3 sets. P: the duration.                                                                                |
| Estagnados      | P, M    | Exercises with no load or rep progress for 3+ weeks, each "parado há N semanas".                                                                                                      |
| Tempo no mês    | P       | "6 h 40 min" (Doto digits, 13 px units, never a colon), "TREINADAS EM NOV", the comparison with last month.                                                                           |
| Volume do mês   | P, M    | The total load in tonnes, "CARGA TOTAL EM NOV", "+9 t vs. outubro · melhor mês", and 4 week dot columns.                                                                              |
| Próximo aumento | P, M    | The next suggested load per exercise ("35 → 37,5").                                                                                                                                   |
| Meta            | P, M, G | A goal with a deadline ("Supino 50 kg até 31 mar"): percent in Doto, a 24-dot bar, what is left, the projection ("no ritmo atual, chega em fevereiro"). G also lists the other goals. |
| Sono            | P, M    | Average hours against a goal, and week dot columns. Manual.                                                                                                                           |
| Água            | P       | Liters today against a goal, and a dot bar. Manual.                                                                                                                                   |
| Passos          | P, M    | Steps today and this week, and cardio minutes. Manual.                                                                                                                                |
| Energia         | P       | 1–5 before training, as 5 dots. Manual.                                                                                                                                               |
| Personalizado   | P, M    | A tracker the person names: yes/no, a number with a unit, or a time, with a goal, shown with week dots. Manual.                                                                       |
| Este mês        | M       | This month against last: workouts, time, total load, records, each with its difference.                                                                                               |
| Melhor horário  | P, M    | The hour range where most records happened, with dot columns per start hour (the best one red).                                                                                       |

Tapping a manual widget opens a `Sheet` with a wheel or a toggle and a save button: one tap logs today.

### Edit mode

- The pencil enters edit mode. The header becomes the label "EDITANDO" and "SUA HOME" (a 28 px headline), with `TextButton` "CONCLUIR" (ink) at the right.
- Margins stay 20 px; widgets are 48 px apart. No boxes.
- Above each widget, 16 px from it, a control row: a 6-dot drag handle, the `SizeSelector`, and a circular "−" remove button at the right.
- Selection corner marks: four L-shaped marks made of 3 px dots at 35% ink, 8 px outside each corner. They are marks, not borders.
- At the end: `PlusButton` "ADICIONAR WIDGET" (32 px). It opens the "ADICIONAR" sheet, which groups the widgets not on the home under "TREINO", "CORPO" and "HÁBITOS"; each row has the name (17 px, 600), "tamanhos P · M" (11 px) and a 32 px ink "+".
- Motion: dragging lifts the widget (scale 1.02) and the others slide out of the way; a size change reflows with transforms; removing fades out and the rest slides up. Pointer events work with touch. Keyboard: the handle is a button; arrow up and down move the widget.
- The layout is saved through a server action validated with zod: allowed kinds and sizes only, at most 24 widgets.

### Set logging screen

Top to bottom, 20 px margins:

1. Top bar: a back `IconButton` at the left, the external reference `IconButton` at the right, nothing in the middle.
2. 24 px, the session timeline: a `Stepper` with one segment per exercise (done ink, current red, future off; tap to jump) and, at the end of the same row, the session clock: a 6 px red dot that pulses slowly and the time since "Começar" in Mona 900/112 at 13 px, tabular ("18:42").
3. 32 px, the caption row: "EXERCÍCIO 2 DE 7" at the left, "3 × 10–12" at the right, both labels.
4. 8 px, the exercise name as a 34 px headline.
5. 24 px, the `ExerciseDemo`, 152 px high, full width. Tapping it opens it large in a `Sheet`.
6. 32 px, the wheels: kg 2/3 and reps 1/3, 12 px apart. The selected value is Doto 64; one neighbor above and one below in Doto 36 at 22%. A 6 px red dot marks the selected row on the outer side of each wheel. Under each wheel its label ("KG", "REPETIÇÕES"). They open on last time's value; no "última vez" text anywhere. Vertical only, momentum, a firm snap on every value and a short pulse on the center value at each step. "102,5" never clips.
7. 32 px, the set stepper: 3 equal columns, 12 px apart, each with a two-digit label ("01"), 8 px, the value at 15 px in 900/112, 12 px, a 4 px bar. Done: ink with the logged value. Current: red, showing live the wheel values ("52,5 × 11"). Future: an off "—". Tapping a done set opens a sheet to correct it.
8. The bottom bar: a `glass` surface from the screen's bottom edge up, so the wheels and the set stepper blur under it instead of colliding with its text. On it, 16 px from its top: the label "PRÓXIMO", the next exercise at 13 px and a chevron, tappable (the bar's `above` slot). A horizontal swipe anywhere also changes exercise.
9. 16 px below, 34 px from the bottom: a 64 px round undo button (tint), 12 px, `PrimaryAction` "CONFIRMAR" with the live meta "52,5 KG × 11" and the check.
10. Stagnation: only after 3+ weeks without progress, under the kg label, a 6 px red dot and "parado há 4 semanas" (13 px, 600). Nothing else ever suggests a load.

Confirm: in the same frame the current bar turns ink, the next turns red, the value appears in the done column and the wheels move to the next suggestion. Saving is optimistic.

### Workout summary

After "Finalizar": the label "TREINO CONCLUÍDO", the workout name as a headline, hero numbers in Doto (duration, sets, total load), comparison rows against the last time this workout was done, records with a red dot, and `PrimaryAction` "CONCLUIR" with the check.

### Other screens

Onboarding, Treinos, Evolução, Perfil, Ajustes and Créditos use the same parts: the top bar or a back `IconButton`, a 34 px headline title, `SectionLabel` groups 64 px apart, choice rows, `PrimaryAction` for the one main action. Loading states are the same components dimmed (`off` shapes at the real sizes), without shimmer, fading in after 150 ms.

## 12. Voice

- Brazilian Portuguese, "você", short. Labels are one to three words.
- **VITA does not coach.** The only suggestion text in the app is the stagnation fact ("parado há N semanas"), and only after 3+ weeks without progress. "Próximo aumento" is a widget the person chose to add, so it may list increases.
- Numbers come with their unit; Brazilian decimal comma ("72,4 kg", "8.420 kg").
- Time is "6 h 40 min" in widgets, "18:42" only for the running clock.

## 13. Do and don't

Do:

- Let numbers be large and words small.
- Use red only for live states, achievements, the primary cell and the active tab label.
- Use only the tokens and utilities from `globals.css`.

Don't:

- Borders, outlines, dividers, hairlines, shadows, gradients.
- Boxes or cards around information.
- Pills for anything other than `PrimaryAction` and the navbar; rounded corners on blocks.
- Grey surfaces on black in the dark theme.
- Red Doto numbers, red text longer than a short note.
- Text that coaches or suggests, except the stagnation fact.
- Shimmer, bounce, motion that waits for the network.
- Any third font family.
