import { z } from 'zod';
import {isValidSubject} from '@/lib/subjects';

export const CatalogRequestSchema = z.object({
  textbookLessonId: z.string().uuid(),
  languageLevel: z.enum(['A2', 'B1', 'B2']),
  teacherNotes: z.string().max(1500),
  generationMode:z.enum(['standard','advanced']).optional().default('standard'),
});
export type LessonRequest = z.infer<typeof CatalogRequestSchema>;
export const TeacherSourceRequestSchema=z.object({
 mode:z.literal('teacher'),
 title:z.string().trim().min(5).max(120),
 subject:z.string().refine(isValidSubject,'Môn học không hợp lệ'),
 grade:z.enum(['10','11','12']),
 languageLevel:z.enum(['A2','B1','B2']),
 sourceText:z.string().trim().min(250).max(25000),
 sourceFilename:z.string().trim().max(160).optional().default('Nội dung giáo viên cung cấp'),
 teacherNotes:z.string().max(1500),
 generationMode:z.enum(['standard','advanced']).optional().default('standard'),
});

// Structured Outputs: simple closed objects/arrays only, to maximize model compatibility.
export const LessonResultSchema = z.object({
  lessonTitleEn: z.string(),
  contentObjectives: z.array(z.string()),
  languageObjectives: z.array(z.string()),
  keyConcepts: z.array(z.object({vi: z.string(), en: z.string()})),
  vocabulary: z.array(z.object({termEn: z.string(), termVi: z.string(), definitionEn: z.string(), exampleEn: z.string()})),
  classroomPhrases: z.array(z.object({english: z.string(), vietnamese: z.string()})),
  slides: z.array(z.object({title: z.string(), bullets: z.array(z.string()), teacherScript: z.string()})),
  quiz: z.array(z.object({questionEn: z.string(), choices: z.array(z.string()), correctIndex: z.number().int(), explanationVi: z.string()})),
  qualityWarnings: z.array(z.string()),
});
export type LessonResult = z.infer<typeof LessonResultSchema>;

export type LessonRow = {
  id: string;
  teacher_id: string;
  textbook_lesson_id: string | null;
  title: string;
  subject: string;
  grade: string;
  language_level: string;
  source_text: string;
  source_filename: string | null;
  teacher_notes: string;
  generated_content: LessonResult;
  model_name: string;
  status: 'draft' | 'reviewed';
  created_at: string;
  updated_at: string;
};
