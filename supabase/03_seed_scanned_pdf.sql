-- EDUBRIDGE MVP 1.2: Allow EMPTY SOURCE TEXT in unreviewed catalog drafts.
-- Run AFTER 01_schema.sql + 02_textbook_library.sql, BEFORE "Nhap muc luc 25 bai".
-- This migration does NOT publish or overwrite existing lessons.
ALTER TABLE public.textbook_lessons
  DROP CONSTRAINT IF EXISTS textbook_lessons_source_text_check;
ALTER TABLE public.textbook_lessons
  ADD CONSTRAINT textbook_lessons_source_text_check
  CHECK (char_length(source_text) = 0 OR char_length(source_text) BETWEEN 250 AND 30000);
ALTER TABLE public.textbook_lessons
  DROP CONSTRAINT IF EXISTS textbook_lessons_publish_requires_content;
ALTER TABLE public.textbook_lessons
  ADD CONSTRAINT textbook_lessons_publish_requires_content
  CHECK ((NOT is_published) OR char_length(source_text) >= 250);
-- All normal teachers still see only published catalog lessons through prior RLS.
