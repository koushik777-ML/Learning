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

Use `npm run preview` to serve the production build. The three complete lessons include runnable lab instructions. Modules M04–M16 include starter projects, quizzes, and official references.

## Lessons and progress

Open a module and choose **Copy ChatGPT prompt**. It includes the repository's `curriculum_prompt.md` and the selected module's tracker metadata. Paste or upload the generated lesson through **Import lesson Markdown**. Keep the eight numbered headings. Use **Project 1–3** headings with numbered build milestones, and question headings with lettered options and an answer inside a Markdown details block. Short responses can be self-graded after revealing the sample answer.

The app keeps your checkpoints, imported lessons, timer, quiz selections and results, flags, notes, and repository links in this browser under `ai_curriculum_progress_v1`. **Export Progress** saves a full `progress.json` backup. **Import Progress** restores that backup and replaces the current state. **Export Summary CSV** produces rows with the workbook's module IDs and tracker columns for Excel. Edit the workbook itself to change curriculum metadata.

Completion follows the workbook's formula. Lesson and lab count for 25% and each completed project counts for 25%. Setting a module's status to Completed counts it as 100%. Quiz mastery is the share of graded questions currently correct. Study hours include logged timer sessions and any manual adjustments to the module total.

## Regenerate data

```sh
python3 -m pip install -r scripts/requirements.txt
python3 scripts/build_curriculum_data.py
```

Metadata comes from the workbook's **Module Tracker** sheet. Full lessons are authored in `scripts/lessons/` and starter material is in `scripts/starter_content.py`. Commit the generated files alongside source changes.

## Static deployment

On GitHub, select **Settings → Pages → Source → GitHub Actions** once. The included workflow builds, tests, and publishes the site on pushes to `main`.

On Cloudflare Pages, Vercel, Netlify, or Render Static Sites, use Node 22.12+, the build command `npm run build`, and the publish directory `dist`. Hash routing and Vite's relative asset paths also support deployment under a repository subdirectory.
