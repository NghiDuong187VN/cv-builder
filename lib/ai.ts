export type AiPlan = 'free' | 'premium';
export type AiAction =
  | 'generateSummary'
  | 'rewriteExperience'
  | 'atsReview'
  | 'generateCoverLetter';

export const FREE_AI_DAILY_LIMIT = 3;

export const AI_FEATURES: Record<AiPlan, { label: string; actions: AiAction[] }> = {
  free: {
    label: 'Free',
    actions: ['generateSummary'],
  },
  premium: {
    label: 'Premium',
    actions: ['generateSummary', 'rewriteExperience', 'atsReview', 'generateCoverLetter'],
  },
};

export function canUseAiAction(plan: AiPlan, action: AiAction) {
  return AI_FEATURES[plan].actions.includes(action);
}
