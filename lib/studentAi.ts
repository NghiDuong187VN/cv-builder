import { z } from 'zod';

const bulletListSchema = z
  .array(z.string())
  .transform((items) => items.map((item) => item.trim()).filter(Boolean))
  .pipe(z.array(z.string()).min(3).max(5));

export const fresherSummaryResponseSchema = z.object({
  summary: z.string().trim().min(1),
});

export const studentBulletsResponseSchema = z.object({
  bullets: bulletListSchema,
});

export type FresherSummaryResponse = z.infer<typeof fresherSummaryResponseSchema>;
export type StudentBulletsResponse = z.infer<typeof studentBulletsResponseSchema>;

export function validateFresherSummaryResponse(input: unknown) {
  return fresherSummaryResponseSchema.safeParse(input);
}

export function validateStudentBulletsResponse(input: unknown) {
  return studentBulletsResponseSchema.safeParse(input);
}
