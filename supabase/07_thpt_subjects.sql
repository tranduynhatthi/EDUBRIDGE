-- EDUBRIDGE 1.7. Broaden high-school subject storage, preserving existing Physics records and RLS.
-- Based on CTGDPT 2018 as amended by Circular 13/2022 (THPT 10-12).
alter table public.textbooks drop constraint if exists textbooks_subject_check;
alter table public.textbooks drop constraint if exists textbooks_subject_allowed;
alter table public.textbooks add constraint textbooks_subject_allowed check (subject in ('Ngữ văn', 'Toán', 'Ngoại ngữ 1', 'Lịch sử', 'Giáo dục thể chất', 'Giáo dục quốc phòng và an ninh', 'Địa lí', 'Giáo dục kinh tế và pháp luật', 'Vật lí', 'Hóa học', 'Sinh học', 'Công nghệ', 'Tin học', 'Âm nhạc', 'Mĩ thuật', 'Ngoại ngữ 2', 'Tiếng dân tộc thiểu số'));
alter table public.lessons drop constraint if exists lessons_subject_allowed;
alter table public.lessons add constraint lessons_subject_allowed check (subject in ('Ngữ văn', 'Toán', 'Ngoại ngữ 1', 'Lịch sử', 'Giáo dục thể chất', 'Giáo dục quốc phòng và an ninh', 'Địa lí', 'Giáo dục kinh tế và pháp luật', 'Vật lí', 'Hóa học', 'Sinh học', 'Công nghệ', 'Tin học', 'Âm nhạc', 'Mĩ thuật', 'Ngoại ngữ 2', 'Tiếng dân tộc thiểu số'));
-- This is a schema change only. No book, user, lesson or grade rows are deleted.
