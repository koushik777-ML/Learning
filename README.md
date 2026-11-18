# Agent Atlas

A private, browser-based study workspace for the 16-module Python & Agentic AI curriculum. Track lessons, project milestones, study time, quiz results, and notes without an account.

## Run locally

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

Use `npm run preview` to serve the production build. All 16 modules include explanations, worked examples, labs, debugging scenarios, project blueprints, and mastery quizzes.

## Lessons and progress

Start with **Mental Model** and **Architecture**, then apply the ideas with **Syntax** and the **Reference Lab**. Use **Debugging** to practice diagnosis and **Projects** to build independently. The quiz grades multiple-choice answers and lets you compare short responses with sample answers. **References** includes review notes and optional documentation.

The app keeps your checkpoints, timer, quiz selections and results, flags, notes, and repository links in this browser under `ai_curriculum_progress_v1`. **Export Progress** saves a full `progress.json` backup. **Import Progress** restores that backup and replaces the current state. **Export Summary CSV** produces rows with the workbook's module IDs and tracker columns for Excel. Version 1 backups still carry any custom lesson text saved by earlier versions. The lesson tabs show the complete built-in curriculum.

Completion follows the workbook's formula. Lesson and lab count for 25% and each completed project counts for 25%. Setting a module's status to Completed counts it as 100%. Quiz mastery is the share of graded questions currently correct. Study hours include logged timer sessions and any manual adjustments to the module total.

## Regenerate data

```sh
python3 -m pip install -r scripts/requirements.txt
python3 scripts/build_curriculum_data.py
```

Metadata comes from the workbook's **Module Tracker** sheet. Edit lesson content in `scripts/lessons/m01.md` through `m16.md`. The generator splits each lesson into its eight tabs and builds the practice data used by the dashboard. The app loads the full reading content when you open its module. Commit the generated files alongside source changes.

## Static deployment

On GitHub, select **Settings → Pages → Source → GitHub Actions** once. The included workflow builds, tests, and publishes the site on pushes to `main`.

On Cloudflare Pages, Vercel, Netlify, or Render Static Sites, use Node 22.12+, the build command `npm run build`, and the publish directory `dist`. Hash routing and Vite's relative asset paths also support deployment under a repository subdirectory.
