import { z } from 'zod';
import {isValidSubject} from '@/lib/subjects';
import {Plan5512Schema,WorksheetSchema,ReviewSchema} from '@/lib/teaching-materials';

export const CatalogRequestSchema = z.object({
  textbookLessonId: z.string().uuid(),
  languageLevel: z.enum(['A2', 'B1', 'B2']),
  durationMinutes:z.union([z.literal(45),z.literal(90)]).optional().default(45),
  teacherNotes: z.string().max(1500),
  generationMode:z.enum(['standard','advanced']).optional().default('standard'),
});
export const ReadyLessonRequestSchema=z.object({
 readyLessonId:z.string().uuid(),
 languageLevel:z.enum(['A2','B1','B2']),
  durationMinutes:z.union([z.literal(45),z.literal(90)]).optional().default(45),
 teacherNotes:z.string().max(1500),
 generationMode:z.enum(['standard','advanced']).optional().default('standard'),
});
export type LessonRequest = z.infer<typeof CatalogRequestSchema>;
export const TeacherSourceRequestSchema=z.object({
 mode:z.literal('teacher'),
 title:z.string().trim().min(5).max(120),
 subject:z.string().refine(isValidSubject,'Môn học không hợp lệ'),
 grade:z.enum(['10','11','12']),
 languageLevel:z.enum(['A2','B1','B2']),
  durationMinutes:z.union([z.literal(45),z.literal(90)]).optional().default(45),
 sourceText:z.string().trim().min(250).max(25000),
 sourceFilename:z.string().trim().max(160).optional().default('Nội dung giáo viên cung cấp'),
 teacherNotes:z.string().max(1500),
 generationMode:z.enum(['standard','advanced']).optional().default('standard'),
});

// Structured Outputs: simple closed objects/arrays only, to maximize model compatibility.
export const LessonResultSchema = z.object({
  lessonTitleEn: z.string(),
  durationMinutes:z.union([z.literal(45),z.literal(90)]).optional(),
  contentObjectives: z.array(z.string()),
  languageObjectives: z.array(z.string()),
  keyConcepts: z.array(z.object({vi: z.string(), en: z.string()})),
  vocabulary: z.array(z.object({termEn: z.string(), termVi: z.string(), definitionEn: z.string(), exampleEn: z.string(), ipa:z.string().optional()})),
  classroomPhrases: z.array(z.object({english: z.string(), vietnamese: z.string()})),
  slides: z.array(z.object({
    title:z.string(),bullets:z.array(z.string()),teacherScript:z.string(),
    slideType:z.enum(['warmup','concept','process','comparison','diagram','formula','example','activity','summary']).optional(),
    keyMessage:z.string().optional(),studentTask:z.string().optional(),
    visualSuggestion:z.string().optional(),formula:z.string().optional(),
    classroomEnglish:z.array(z.string()).optional(),expectedStudentResponses:z.array(z.string()).optional(),
    pronunciationGuide:z.string().optional(),timingMinutes:z.number().int().min(1).max(15).optional()
  })),
  quiz: z.array(z.object({questionEn: z.string(), choices: z.array(z.string()), correctIndex: z.number().int(), explanationVi: z.string()})),
  qualityWarnings: z.array(z.string()),
  plan5512:Plan5512Schema.optional(),
  worksheet:WorksheetSchema.optional(),
  reviewAssessment:ReviewSchema.optional(),
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
