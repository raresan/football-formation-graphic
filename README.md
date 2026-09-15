# Football Formation Graphic

Vanilla HTML, CSS, and JavaScript graphic: live shirt numbers and names sit on a perspective pitch video. No frameworks, no animation libraries, no backend.

The starting squad and default **4-4-2** follow the **reference video**.

## How to run

Desktop only. A full-screen message is shown under 768px.

**Live site (Vercel):** https://football-formation-graphic.vercel.app/

Or run it locally — open `index.html` in a browser, or serve the folder:

```bash
npx serve
```

Then open the URL printed in the terminal.

## Architecture

```
.output          video + overlay (the graphic)
  .output__video     BG.mp4, in document flow
  .output__field     players, absolute over the video
  .output__controls  Show / Hide / Replay, Formation, Edit Players
.pitch           11 input cards below the graphic
```

Names and numbers on the pitch are **HTML text**. The video is only the empty field. Logos, substitutes, and broadcast extras from the reference clip are not drawn.

---

## Positioning

### The video owns the box

`.output` is `position: relative` and has **no fixed height**. The `<video>` is `display: block; width: 100%; height: auto`, so the section’s height is the intrinsic 16:9 of `BG.mp4`.

`.output__field` is `position: absolute; inset: 0`. It covers **exactly** the video. Players adapt to the video; the video does not stretch to fill the viewport. Scaling the browser width scales the graphic without distortion.

`.output` uses `line-height: 0` so the video does not leave a baseline gap. `.output__field` and `.output__controls` reset `line-height: normal` so labels and errors keep real height.

Players themselves are **`position: relative`**. They are not absolutely placed with left/top. Layout is CSS Grid + Flexbox.

### Goalkeeper vs outfield

Player **1** is the goalkeeper: editable name and number, always the bottom grid row, never part of the formation string.

Players **2–11** are outfield. The formation (`4-4-2`, `4-3-3`, `3-5-2`, `4-2-3-1`, …) describes only those **10** players. They are assigned **left to right**, **defense → attack** (nearest the goalkeeper first).

### Building rows from the string

`validateFormation` turns `4-2-3-1` into `[4, 2, 3, 1]`.

`updatePlayerFormationAttributes` then:

1. Unwraps any existing `.output__row` so the 10 outfield nodes are free.
2. Walks the array. For each count it creates a `.output__row` and `appendChild`s that many players (the **same** DOM nodes, not clones).
3. Sets `data-row` and `data-row-position`.
4. Toggles `.output__field.is-tight` when **goalkeeper + outfield lines ≥ 5** (`4-2-3-1`, `4-3-2-1`): `row-gap` becomes `2rem`. Typical four-line setups (`4-4-2`, `4-3-3`) stay at `4rem`.

The overlay grid is:

```text
row 2  optional 4th outfield line (attack)
row 3  third outfield line
row 4  second outfield line
row 5  first outfield line (defense)
row 6  goalkeeper
```

Inside a row, Flexbox centers the players with a horizontal `gap`.

The same grouping is applied to the input cards in `.pitch` (`updatePitchFormation`) so the form matches the graphic.

### Perspective (wings)

On a trapezoid pitch, wide lines should not sit on a flat horizontal. If a row has **4 or more** players, `:first-child` and `:last-child` get a negative `margin-top`. Lines of 2 or 3 stay level (a line of 3 in `3-5-2` would otherwise crash into midfield).

This is CSS only (`:has(.output__player:nth-child(4))`). No JS coordinates.

---

## Formation change and FLIP

### Why `transition` is not enough

CSS `transition` interpolates properties on **the same element in the same layout context** (`opacity`, `transform`, …).

A formation change **moves a node to a new parent** (one `.output__row` to another) and changes flex/grid tracks. The browser jumps to the new layout. There is no “in-between” for `top`/`left` because those are not what we use.

Hardcoding `left`/`top` per formation would break the “calculate positions dynamically” rule and would fight the video-sized overlay.

### What FLIP does

FLIP = **First, Last, Invert, Play**. Native `Element.animate()` (Web Animations API), not a library.

On a **valid** formation input:

1. **First** — `getBoundingClientRect()` for every player (including in-flight transforms).
2. Rebuild rows (`updatePlayerFormationAttributes`). Layout is now the new formation.
3. **Last** — measure again. Clear leftover transforms first so this is the real new box.
4. **Invert** — `dx = first.left - last.left`, `dy = first.top - last.top`. The player is already in the new flex/grid cell, but a `translate(dx, dy)` makes it **look** like it is still at the old pixel.
5. **Play** — animate `translate(dx, dy)` → `translate(0, 0)` in 900ms. When the transform is gone, CSS Grid/Flex is in charge again.

Only `.is-visible` players are flipped (hidden ones have nothing to show). The goalkeeper usually has `dx/dy ≈ 0` and is skipped.

### Rapid changes

Each flip increments `formationMoveToken`. A new formation **cancels** `player.getAnimations()` before starting another. Old `finish` callbacks ignore a stale token. No stacked animations, no stuck `translate`.

`updateFormationLayout(..., shouldAnimate)` skips FLIP on first paint and when the graphic is hidden.

The input cards update in the same tick; they do not FLIP.

---

## Show, Hide, Replay (video clock)

The background file is **15 seconds**. Player motion is driven by `video.currentTime`, not by a timeout that can drift.

| Clock         | What happens                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–2s          | Video plays. All players `opacity: 0` and slightly down.                                                                                    |
| 2s            | Goalkeeper only: fade in + rise (`is-visible`).                                                                                             |
| 4s, 6s, 8s, … | Next outfield line, all names on that line together. Interval is `LINE_INTERVAL_S = 2`.                                                     |
| 14s           | Video **pauses**. Graphic holds.                                                                                                            |
| Hide          | Seek to 14s, play 14–15s. After `EXIT_TEXT_DELAY_MS` (450ms), **every** player loses `is-visible` at once (fade down, 1s). No line stagger. |
| 15s           | Video stops. State `hidden`.                                                                                                                |
| Replay        | Instant hide, `currentTime = 0`, same as Show.                                                                                              |

`requestAnimationFrame` + `timeupdate` keep the reveal in sync. A generation-style `graphicState` (`hidden` / `entering` / `visible` / `exiting`) blocks double Show/Hide.

On load, Show runs when the video can play (`canplay` / already `HAVE_CURRENT_DATA`).

CSS for enter/exit: `opacity` + `translateY(1.75rem)` → `0`, ~0.8s in, 1s out. That is independent of FLIP.

---

## Inputs and validation

### Formation mask

The field does not require typing hyphens. Non-digits are stripped; remaining digits (max 10) are joined with `-`:

- `442` → `4-4-2`
- `4321` → `4-3-2-1`

Then `validateFormation` runs:

- `/^\d+(-\d+)*$/`
- each line between **1 and 5** (rejects `4-0-6`)
- sum of outfield players **exactly 10** (rejects `4-4-3`)

Invalid or empty input shows a message and **keeps the last valid layout** (`currentValidFormation`).

### Shirt number

`min`/`max` on `<input type="number">` do not block typing. JS keeps digits only, max 3 characters, range **1–999**. `-`, `e`, `.` are blocked on `keydown`. Empty or `0` → error + graphic `[ ?? ]`.

### Name

Max **20** characters. Empty / whitespace → error + `[ insert name ]` so the layout does not collapse. If the **displayed** string is longer than **12** characters (including the empty placeholder), the name uses `SerieAWomenCompressed`. Font size does not change.

Cards have a **fixed width**. Errors wrap to extra lines vertically; they do not stretch the card horizontally.

**Edit Players** only scrolls to `.pitch`. Changing a name or number never rebuilds rows.

---

## Overlay controls

Show, Hide, Replay, Formation, and Edit Players sit on the **bottom-right of the graphic** so they stay aligned with the video clock. The 11 player cards stay in a separate section below.

The brief suggests controls beside or below the graphic. Overlay playback is a deliberate choice to match the reference timing; player editing remains separated.

---

## External assets

All from the challenge pack, under `assets/`:

| File                                           | Role                                |
| ---------------------------------------------- | ----------------------------------- |
| `assets/video/BG.mp4`                          | Empty perspective pitch (1920×1080) |
| `SerieAWomenFont-Regular.woff2` / `Bold.woff2` | Numbers and names                   |
| `SerieAWomenFont-Compressed.woff2`             | Long names                          |
| `RobotoFlex-VariableFont_….ttf`                | Control panel                       |

## References

- Q Media brief: _Football Formation Graphic_ (vanilla web, 11 players).
- Supplied **reference video** for colour, type, perspective, entrance/exit, and default squad on screen.

## Tools

The **project structure** — HTML markup, base CSS, and the first JS wiring — was written **without AI**, as training in vanilla web.

- **Cursor (Grok)** — used afterwards on some of the harder pieces: layout refinements, validation, video sync, FLIP, and this README. The runtime is still plain HTML/CSS/JS and can be explained and changed without the tool.
- **Vercel** — hosts the live build (static files, no backend). See [How to run](#how-to-run) for the public URL.

## Possible improvements

The brief was about **~3 hours**. With more time, the next passes would be polish, not a rewrite:

- **Type** — tune number and name sizes (and the compressed switch) against the reference more carefully, including 1-digit vs 3-digit shirts.
- **Motion** — match enter/exit easing, duration, and the FLIP curve more closely to the clip; tighten Hide so the last second of video and the text fade feel locked together.
- **Responsive** — a real smaller-desktop layout instead of the hard 768px wall.

## Limitations

- Desktop only.
- Visual match tracks the reference video (cyan numbers, purple pitch, line-by-line fade, hold at 14s). It is not a frame-accurate copy of every broadcast overlay.
- Default names/numbers/formation follow the **reference video**.
- Playback UI is on the graphic (see above).
- Formation mask is digit-based; it does not invent “tactical” hyphens beyond one digit per line (same as the brief’s `4-3-3` style strings).
