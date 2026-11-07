# Design principles

## Behavior

- The app decides when the answer is obvious and asks only when it is not. Example: the selection wheel opens on the new load after an obvious progression, with a discreet mark.
- No streaks. A weekly goal that never erases past effort.
- One clear primary action per screen.

## Avoid (signs of AI-generated design)

Tags and pills; excessive italics; Instrument Serif; negative letter spacing; over-detailed UI; too many dividers; many color shades and opacities; containers with borders; over-detailed diagrams; verbose or redundant text; code-like breadcrumbs; section numbering; eyebrows; dithering; ASCII images; squircles; excessive monospace fonts; ALL CAPS subtitles; gradient backgrounds; periods in titles.

## Motion

- Ease-out for entrances; ease-in-out for moves along the screen.
- Dropdowns and popovers: 150 to 250 ms; popovers start at scale 0.95.
- Stagger list rows by 30 ms; stagger details as they settle.
- Press: scale to 0.97. Do not animate while a control is held.
- Stretch moving knobs by about 12%. Use arcs for object movement.
- Pulse to confirm success (for example, a confirmed set).
- Enter from the trigger and exit back to it; exits are 20% shorter than entrances.
- Overlap the old and the new state; crossfade icons with a little blur; use masks for reveals and color changes.
- No bounce on everyday UI. Rubber band past scroll bounds.
- Shared elements keep the same `layoutId` (Motion) across screens.
