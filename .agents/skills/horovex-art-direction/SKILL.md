---
name: horovex-art-direction
description: >-
  Art direction and quality gate for every HOROVEX user-facing surface: the landing page, the 3D
  observatory, HUD panels, dialogs, and any WebGL scene. Use it before designing, redesigning,
  restyling or reviewing any HOROVEX UI, and whenever someone says it looks generic, templated, AI-made
  or "slop". It routes the work through the installed taste skills, the Awwwards MCP and a measured
  browser gate, and adds the rules for 3D scenes that the general skills do not cover.
---

# HOROVEX art direction

HOROVEX's first UI shipped as a template: near-black ground with one glowing gold accent, a pill badge
over a two-line headline with the second line in gradient italic serif, monospace micro-labels
everywhere, glass cards in rows with an icon on each, a pulsing "SYS NOMINAL" dot, and a 3D canvas
faded to 40% behind it all. The taste inspector measured it at **16 FAIL, 8 WARN** (baseline below).
The user called it AI slop and was right. This skill exists so that never ships again.

## The order of work

Do these in order. Do not write UI code before step 4.

1. **Read the brief.** `docs/PRD.md` §1–2. The product: a person types a real dilemma, sees its five
   most likely futures as a branching 3D tree, expands any branch ("+5 more"), steps into any future to
   branch again, and gets one recommended path with the reasons. That is the subject. Every visual idea
   must come from it, not from "luxury" or "AI" as categories.
2. **Pull references with the Awwwards MCP** (`awwwards` server, global `mcp_config.json`). Minimum:
   `search_sites` for 3 queries tied to the subject (time, branching, instrument, map, data), then
   `get_site_details` on the 3–5 strongest, and `capture_live_site` or `record_site_motion` on the one
   whose motion you intend to learn from. Look at the screenshots. Write in your notes, per reference,
   one thing it does that HOROVEX should learn and one thing HOROVEX must not copy. If the MCP tools are
   not loaded in this session, the stdio fallback is a short Node client that sends `initialize` then
   `tools/call` to `npx -y awwwards-mcp@latest`.
3. **Run the page art direction from `design-taste-frontend`** (its SKILL.md, "The run", steps 1–5):
   subject inventory, the argument, `draw.mjs` with `--sector ai-product`, choose a direction for a
   stated reason, and write the idea sentence. For the observatory and HUD, follow its
   `references/app-screens.md` instead. Apply `frontend-design` for type, copy and restraint.
4. **Write the design plan** (palette as 4–6 named hex values, two typefaces with roles, layout in ASCII,
   the one signature motion, the one live thing) and **get the user's sign-off** before building.
5. **Build**, using `emil-design-eng` and `animate` for every interaction and transition, and
   `animation-performance` for anything that moves every frame.
6. **Gate** (below). Not done until it passes.

## Rules for 3D scenes

The general skills are written for photographs and DOM. These cover WebGL.

1. **The scene is the product, not wallpaper.** A canvas is either the subject at full strength or it is
   not on the page. Never a dimmed canvas behind a layout. Never ambient particles, starfields or dust
   as decoration (the taste house style bans decorative particles; that holds in 3D).
2. **Show the real thing.** The 3D depicts the user's actual tree of futures, built from the real
   engine output (the deterministic fallback engine works offline). It is not a generic orb, globe or
   "neural" mesh.
3. **One live thing on the landing page.** The visitor types a dilemma and watches it branch in place,
   on the first screen, without signing in. That is the demo, the proof and the call to action at once.
   It must work on a phone with a thumb and have a no-script fallback (a static rendered tree image with
   the same content).
4. **One visual channel per variable.** Probability is encoded once (branch thickness or brightness, not
   both, and not also a colour and a pulse speed). The recommended path gets the single accent colour;
   nothing else uses it.
5. **Materials and light, not glow.** Physically motivated materials, one key light, fog for depth.
   Bloom only where something truly emits light. No glow halos around every node.
6. **Words live in the DOM.** Labels are real HTML, sentence case, at least 14px for labels and 16px for
   body, in the text face (no monospace outside code; tabular figures for numbers). Label only the
   focused node and its direct children. No cloud of pills.
7. **Camera.** One signature move per page, driven by native scroll or by the user's action. No wheel
   capture, no scroll locking. Transitions answer an action (expand, step in, step back) and show what
   changed.
8. **Budget.** DPR clamped to `[1, 2]`; frame budget 16ms on a mid-range laptop; first meaningful frame
   under 2.5s; geometry instanced past 50 nodes. Reduced motion shows the finished composition, still.
   Measure with the Chrome DevTools MCP performance trace, do not assume.

## Copy

Plain words from the user's side. Rewrite system vocabulary before it reaches the screen:

| Shipped | Write instead |
| --- | --- |
| Precision Chronometric Multiverse Decision Engine | Say what it does in five words |
| SYS NOMINAL • 60 FPS | Delete |
| Collapse the Wavefunction / Reality Check-In | Mark what actually happened |
| Inject Action | What if I… |
| Auto-Project Next 5 Futures | Show what happens next |
| Golden Path | Recommended path (or a name the user will understand without a glossary) |
| E[U], Cond. Prob, Path Prob | Plain labels; the maths goes in an expandable "why" |

## The gate

Run all of these against the running dev server. Paste the results into the PR or report.

```bash
node .agents/skills/design-taste-frontend/scripts/inspect.mjs http://localhost:3000 --out .taste-skill/landing
node .agents/skills/design-taste-frontend/scripts/inspect.mjs "http://localhost:3000/observatory?demo=saas-pivot" --app --out .taste-skill/observatory
```

- **0 FAIL** on both. Any `--allow` needs a written reason (e.g. `few-pictures` on the observatory,
  where the live 3D tree is the picture).
- **Look at every screenshot** the inspector writes (1440, 768, 390) before claiming anything about
  quality, then score it with `design-taste-frontend/references/critique.md` (juror rubric). Target
  7.5 or higher, with no cap triggered.
- **Motion review** with `review-animations` on every changed interaction.
- **Zero console errors** and no Next.js error overlay (the first build shipped with "1 Issue" visible
  while its report claimed 11/11 E2E passing).
- `npx tsc --noEmit`, `npm test`, `npm run build` still pass.

## Baseline (25 Oct 2026, commit dcebba9, landing page)

16 FAIL, 8 WARN. Failures: eyebrow labels, monospace outside code, tiny tracked uppercase labels, emoji
glyph, gradient fills, gradient text, resting box shadows, gradient button, 7 hairlines, 7 outlined
boxes, two rows of icon cards, 12px body text, 44 text blocks under 13px, zero pictures, headlines
wrapping past two lines at 768 and 390. Warnings: mixed-font headline, 14 glass surfaces, 3 typefaces,
11 font sizes, off-centre margins, 8 ragged left edges, still page. 3D canvas at 40% opacity behind the
layout. Any redesign is measured against this.

## Installed skills this one routes to

| Skill | Source | Licence | Use it for |
| --- | --- | --- | --- |
| `design-taste-frontend` | github.com/Leonxlnx/taste-skill | MIT | Art direction draw, house rules, browser inspector, critique rubric |
| `frontend-design` | github.com/anthropics/skills | Apache-2.0 | Design plan, type, restraint, copy |
| `emil-design-eng`, `animate`, `animation-performance`, `review-animations`, `improve-animations`, `break-ui` | github.com/emilkowalski/skill | MIT | Interaction craft, motion decisions, frame budget, motion review, worst-case data |
