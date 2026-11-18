import template from '../../curriculum_prompt.md?raw'
import type { ModuleMetadata } from '../types/curriculum'

export function modulePrompt(module: ModuleMetadata) {
  return `I'm sharing my curriculum_prompt.md below. Teach the complete ${module.id}: ${module.title} using its rules and eight numbered sections. This is my explicit module selection.

Tracker scope: ${module.topics}
Recommended model and effort: ${module.model}
Target study time: ${module.targetHours} hours

--- curriculum_prompt.md ---
${template.trim()}
--- end curriculum_prompt.md ---

I'm importing the result into Agent Atlas. Use ## 1. through ## 8. headings in the template order. Return raw Markdown; don't wrap the whole lesson in a code fence. Use fenced text for the ASCII diagram and language-tagged fences for code.

For the debugging playbook, give each case a ### heading and start its paragraphs with **Symptom:**, **Root Cause:**, **Diagnostic:**, and **Fix:**.
Use ### Project 1: Title through ### Project 3: Title, then **Domain:**, #### Recommended Folder Structure, #### Build Milestones (a numbered list), and #### Acceptance Checklist. Follow the no-code blueprint rule.
Use ### Q1. Scenario text through ### Q8. as applicable. Write choices as "- A. Choice", "- B. Choice", and so on. For multiple choice, begin the details answer with "**Answer: B.**" using the correct letter, then explain. For a short response, provide a model answer in the details block.
Use "- [Official link title](https://...) — what to read" for each reference.`
}
