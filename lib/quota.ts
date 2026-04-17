import type { AiAction, AiPlan } from '@/lib/ai';
import { FREE_AI_DAILY_LIMIT } from '@/lib/ai';

export const FREE_CV_LIMIT = 3;

export interface QuotaStatusResponse {
  plan: AiPlan;
  remainingToday: number | null;
  usedToday: number;
  aiLimit: number | null;
  allowedActions: AiAction[];
  upgradeRequiredActions?: AiAction[];
  cvCount: number;
  cvLimit: number | null;
  cvRemaining: number | null;
}

export function getRemainingFreeCvSlots(currentCount: number) {
  return Math.max(FREE_CV_LIMIT - currentCount, 0);
}

export function getAiUsageSummary(plan: AiPlan, remainingToday: number | null) {
  const limit = plan === 'free' ? FREE_AI_DAILY_LIMIT : null;
  const used = limit === null ? 0 : Math.max(limit - (remainingToday ?? 0), 0);

  return {
    used,
    limit,
  };
}
