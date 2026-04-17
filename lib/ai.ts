export type AiPlan = 'free' | 'premium';
export type AiAction =
  | 'generateSummary'
  | 'fresherSummary'
  | 'rewriteExperience'
  | 'atsReview'
  | 'generateCoverLetter'
  | 'generateProjectBullets'
  | 'convertActivitiesToCvBullets'
  | 'tailorCvForJob';

export const ALL_AI_ACTIONS: AiAction[] = [
  'generateSummary',
  'fresherSummary',
  'rewriteExperience',
  'atsReview',
  'generateCoverLetter',
  'generateProjectBullets',
  'convertActivitiesToCvBullets',
  'tailorCvForJob',
];

export const FREE_AI_DAILY_LIMIT = 3;

export const AI_FEATURES: Record<AiPlan, { label: string; actions: AiAction[] }> = {
  free: {
    label: 'Free',
    actions: ['generateSummary', 'fresherSummary'],
  },
  premium: {
    label: 'Premium',
    actions: [
      'generateSummary',
      'fresherSummary',
      'rewriteExperience',
      'atsReview',
      'generateCoverLetter',
      'generateProjectBullets',
      'convertActivitiesToCvBullets',
      'tailorCvForJob',
    ],
  },
};

export function canUseAiAction(plan: AiPlan, action: AiAction) {
  return AI_FEATURES[plan].actions.includes(action);
}

export function getAllowedAiActions(plan: AiPlan): AiAction[] {
  return [...AI_FEATURES[plan].actions];
}

export function getUpgradeRequiredActions(plan: AiPlan): AiAction[] {
  return ALL_AI_ACTIONS.filter((action) => !canUseAiAction(plan, action));
}

export function getRemainingFreeAiRequests(usedToday: number) {
  return Math.max(FREE_AI_DAILY_LIMIT - usedToday, 0);
}
