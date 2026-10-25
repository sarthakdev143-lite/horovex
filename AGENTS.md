# HOROVEX agent rules

## UI and visual work

Before designing, building, restyling or reviewing anything a user sees (pages, the 3D observatory,
HUD panels, dialogs, WebGL scenes, copy on screen), activate the `horovex-art-direction` skill in
`.agents/skills/` and follow its order of work. It routes to the installed taste skills and the
Awwwards MCP, and defines the gate.

UI work is not done until the gate passes: 0 FAIL from the taste inspector on the landing page and the
observatory, every inspector screenshot looked at, zero console errors, and `npx tsc --noEmit`,
`npm test`, `npm run build` passing. A green test suite is not evidence that the UI is good.

## Git

- One branch per change (`feat/`, `fix/`, `chore/`, `docs/`), merged into `main` with `--no-ff`.
- Conventional Commits, subject 72 characters or fewer.
- Never commit `.agents/teamwork/`, `.taste-skill/`, `.env*` or build output.
