# EDUBRIDGE 1.13 — Teaching visuals and classroom notes

- Adds up to six illustrated slides interleaved into exported 16:9 PPTX decks. Diagram pictures are generated locally as SVG images, without requiring photo search, external links, image generation API, or new credentials.
- Physics-specific schematics: solid/liquid/gas particle models, Boyle/Charles graphs, magnetic field, nucleons, sinusoidal wave; all schematic, **not experimentally collected data**. Other topics get faithful infographic images based on the saved slide bullets.
- Existing slide layouts remain intact, and images appear in their own explanation slides to prevent overlap and text overflow.
- Every slide's speaker notes now contain: original teacher's script, 3 bilingual classroom prompts according to the teaching phase, 3 lesson-specific classroom phrases (when generated), and an English transition cue. Quiz answers remain speaker-note-only.
- All existing saved lessons can export with visuals immediately; no Supabase migration or Gemini API call required.
- These generated SVG illustrations are *pictures* in PowerPoint, not editable PowerPoint shapes. Titles and other text retain editability. Teacher should verify science diagrams and all formulas.
- No automatic licensed textbook photography or external image download. This avoids reproducing copyrighted images and inaccurate image search results.
- QA: dynamic test checks actual embedded image media and bilingual notes in PPTX ZIP (not just static code).
