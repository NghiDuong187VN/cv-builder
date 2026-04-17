import { z } from 'zod';

const stringListSchema = z
  .array(z.string())
  .transform((items) => items.map((item) => item.trim()).filter(Boolean));

const improvedExperienceItemSchema = z.object({
  experienceIndex: z.coerce.number().int().min(0),
  role: z.string().optional().default(''),
  company: z.string().optional().default(''),
  bullets: stringListSchema,
});

export const tailorCvForJobResponseSchema = z.object({
  improvedSummary: z.string().trim(),
  suggestedSkillsOrder: stringListSchema,
  improvedExperienceBullets: z.array(improvedExperienceItemSchema).default([]),
  keywordsMissing: stringListSchema,
  recommendations: stringListSchema,
});

export type TailorCvForJobResponse = z.infer<typeof tailorCvForJobResponseSchema>;

export function validateTailorCvForJobResponse(input: unknown) {
  return tailorCvForJobResponseSchema.safeParse(input);
}
