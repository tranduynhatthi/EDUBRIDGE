# EDUBRIDGE 1.11 – Slide Studio: Scientific PowerPoint redesign

**Why changed:** prior PPTX export wrote every slide as the same title + bullets, with no visual hierarchy or educational layout.

**New features:** 16:9; orange/white palette; editable text, cards, vector shapes; cover with abstract decorative particles, learning goals, warm-up, concepts, sequence, comparison, concept map, formula presentation, example, group activity, vocabulary, quiz and summary. Educator's script preserved in PowerPoint speaker notes, and correct quiz answers kept in notes rather than projected.

**Compatibility:** previously generated lessons (only title/bullets/teacherScript) still work: renderer automatically infers type by heading and order. Newly generated Gemini lesson JSON now includes required slideType, keyMessage, studentTask, visualSuggestion and formula (empty string if absent); these fields are optional for legacy records.

**Editable:** PowerPoint shapes and text remain editable. Formula is editable text/Unicode, not native PowerPoint Equation. Scientific relations are never invented: only show formula when it occurs in source slide metadata/bullets; diagrams express generic concept relationships and must be checked by teacher.

**Visuals:** built-in vector shapes only; visualSuggestion is an instructor guide and **does not automatically embed third-party images**, preventing accidental copyright or mismatched visuals.

**Quality gate:** npm run test:slides dynamically generates sample PPTX without any Gemini request. It checks ZIP signature, size and 10+ renderer variants. Existing lessons need no database migration.

**Production:** After CI and Vercel READY, create/choose an existing lesson, adjust slide type in editor, save, and export PPT Slide Studio. Inspect with Microsoft PowerPoint for text overflow and the accuracy of equations, labels and diagrams. Some dense topics may need further manual formatting.
