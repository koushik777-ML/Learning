# Learning workspace

This is a client-side React, TypeScript, Vite, and Tailwind app. Use the existing checkout.

## Commands

- Install dependencies with `npm ci` (Node 22.12 or newer).
- Run the app with `npm run dev`.
- Check TypeScript with `npm run typecheck`.
- Run unit tests with `npm test`.
- Build static assets with `npm run build`. Inspect the result with `npm run preview`.
- Regenerate curriculum data with `python3 -m pip install -r scripts/requirements.txt` and
  `python3 scripts/build_curriculum_data.py`.

## Curriculum and progress

- Keep workbook metadata in `AI_Systems_Curriculum_Tracker.xlsx`.
- Follow the heading order and project rules in `curriculum_prompt.md`.
- Edit the first three seed lessons under `scripts/lessons/` and later starter
  content in `scripts/starter_content.py`. Regenerate and commit `src/data/` afterward.
- Keep project blueprints in plain English. Runnable examples belong in Syntax or the Reference Lab.
- Preserve compatibility with existing `ai_curriculum_progress_v1` backups. Keep storage,
  quiz grading, imports, and exports client-side.
- Use hash routes and relative asset URLs so the production build works under a
  GitHub Pages repository path. Keep generated `dist/` and local dependencies out of Git.
