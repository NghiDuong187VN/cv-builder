import { z } from 'zod';

const stringListSchema = z
  .array(z.string())
  .transform((items) => items.map((item) => item.trim()).filter(Boolean));

export const atsReviewResponseSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  strengths: stringListSchema,
  gaps: stringListSchema,
  keywordsMissing: stringListSchema,
  recommendations: stringListSchema,
});

export type AtsReviewResponse = z.infer<typeof atsReviewResponseSchema>;

export function stripMarkdownJsonFence(rawText: string) {
  const trimmed = rawText.trim();

  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  return trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export function safeParseJson(rawText: string): { success: true; data: unknown } | { success: false; error: Error } {
  try {
    return {
      success: true,
      data: JSON.parse(stripMarkdownJsonFence(rawText)),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Invalid JSON'),
    };
  }
}

export function validateAtsReviewResponse(input: unknown) {
  return atsReviewResponseSchema.safeParse(input);
}
