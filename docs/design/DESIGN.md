# VITA design system: "Ponto e linha"

A calm, editorial workout tracker. Dot-matrix numbers (in the spirit of Nothing) and thin text and hairlines (in the spirit of teenage engineering). Glass is used sparingly; where it lives is still being decided.

## Principles

- Data is the hero: numbers are big, in dots; words are small and thin.
- Simple on screen, smart behind it: the app decides when the answer is obvious and asks only when in doubt.
- One floating bar, one main action per screen.
- Color rule 60/30/10. Light: paper 60, ink 30, red 10. Dark: the two swap.

## Color

| Token                      | Light                             | Dark      | Use                                                    |
| -------------------------- | --------------------------------- | --------- | ------------------------------------------------------ |
| canvas                     | `#F4F2F1`                         | `#0B0B0D` | page background                                        |
| paper                      | `#FCF8F7`                         | `#161618` | light surfaces, active row                             |
| ink                        | `#0B0B0D`                         | `#FCF8F7` | text, trained days                                     |
| ink-secondary              | `#5B5B60`                         | `#A1A1A6` | labels, captions                                       |
| hairline                   | `#DEDAD9`                         | `#26262A` | 1px dividers                                           |
| dot-off                    | `#D6D2D1`                         | `#2E2E33` | unlit dots                                             |
| red                        | `#FF1744`                         | `#FF1744` | fills only: action circles, status dots, the tab light |
| red-text                   | `#C8102E`                         | `#FF4D6D` | red text (contrast safe)                               |
| panel                      | `#0B0B0D`                         | `#1A1A1D` | dark glass panels                                      |
| on-panel / secondary / dim | `#FCF8F7` / `#9A9A9F` / `#6E6E73` | same      | text on panels and smoke glass                         |

Red never fills large areas. It marks: what to tap, what changed (a load that went up), what is happening now (today, the active tab, the current set).

## Typography

- **Inter** (variable, self-hosted) for all text. Default weight 300; 400 for titles and emphasis; 500 only for the active tab. No bold.
- **Doto** (variable dot-matrix, self-hosted, round dots: `ROND 100`, weight 900) only for **large** numbers (36px and up): the hero, metrics, the selected wheel value, the activity total. Use the `num` utility. Smaller numbers use Inter with tabular figures, because small dots are hard to read.
- Sizes: text 13 / 15 / 17, titles 28 / 32 / 34 / 40; dot numbers 36 / 56 / 96–112.
- Sentence case everywhere. No all caps, no letter-spacing tricks, no italics, no periods in titles.

## Surfaces

| Surface                     | Recipe                                                                                                               | Where                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Smoke glass (`smoke`)       | black 64%, white sheen from the top, blur 14px, saturate 165%, brightness 0.55, 1px white 10% edge, long soft shadow | bottom bar, action pills, round secondary buttons |
| Panel glass (`panel`)       | solid panel color, sheen to 45%, 1px light top edge, long soft shadow, radius 28–30                                  | next workout, set logger                          |
| Quiet glass (`quiet`)       | white 7% with a 1px white 8% edge                                                                                    | selection band inside panels                      |
| Light glass (`glass-light`) | paper 72%, blur 20px, faint edge                                                                                     | small round buttons on the canvas (back, video)   |

The 1px edges are light reflections on the glass, never visible borders on light content. Content containers on the canvas have no background: they are separated by space and, when needed, a hairline.

## Components

- **Bottom bar**: a floating frosted bar (`float-bar`: paper 72%, blur 24px, soft shadow, radius 34, 8px inset) with text tabs (13px; active in ink at weight 500) and the screen's main action at the end as a 56px red circle. In a workout the same bar holds undo and the ink action pill.
- **Action pill**: solid ink pill (inverts in dark mode), label at 15px, numbers in dots, red circle with the icon at the end.
- **Next workout**: an editorial section, not a card: label, the workout name at 40px light, a short preview of the exercises, and a red dot line when a load goes up.
- **Activity graph**: the last 16 weeks as a contribution graph (weeks in columns, Monday on top, S/Q/S labels), dots in four intensity levels by number of effective sets, today in red, a red bar under each week that met the weekly goal; header with the total in dots and the weekly average.
- **Hero number**: label (15px secondary), dot number (112px), caption sentence (15px secondary).
- **Metric row**: three columns divided by vertical hairlines: label 13, dot number 36, detail 13.
- **Dot ring**: 24 dots in a circle; the done share is red.
- **Selection wheel**: native scroll snap, 64px rows, center value 56px in dots, neighbours 24px dim, one quiet band across all wheels, fade at the edges. Load on the left, reps on the right.
- **Set list**: rows of 48px with hairlines; done sets show the value in dots and pulse once when logged.
- **Exercise list**: rows with hairlines, name 17, status 13, one dot per set on the right (ink = done, red = load goes up today).

## Spacing and shape

- 4px base; screen margin 24px; sections 32–36px apart; rows 48–64px.
- Radius: 999px for anything tappable that floats, 28–30px for panels, 20px for inner areas. Concentric radii when nesting.

## Motion

See [principles.md](principles.md). Key ones: press scales to 0.97; content rises 8px with a 30ms stagger; a logged set pulses once; the tab light slides between tabs; no bounce.

## Do and don't

Do: let numbers be large and words small; use red only to signal; keep one floating bar; align numbers on the same baseline; use hairlines only to separate columns or rows of the same kind.

Don't: pills or tags as decoration; cards around everything; bold text; gradients as backgrounds (the tab light is the only radial light); grain textures; more than one red element competing on screen.
