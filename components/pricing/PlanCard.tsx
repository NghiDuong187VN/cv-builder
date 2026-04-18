import { Check } from 'lucide-react';
import { BASE_MONTHLY_PRICE, type PremiumPlanConfig } from '@/lib/billing';
import styles from '@/components/pricing/PricingExperience.module.css';
import { formatCurrency } from '@/components/pricing/utils';

export default function PlanCard({
  plan,
  features,
  isLoading,
  onCheckout,
}: {
  plan: PremiumPlanConfig;
  features: string[];
  isLoading: boolean;
  onCheckout: (planId: string) => void;
}) {
  const basePrice = plan.months * BASE_MONTHLY_PRICE;
  const savings = Math.max(basePrice - plan.price, 0);
  const isPopular = plan.id === 'premium_quarterly';
  const isBestSaving = plan.id === 'premium_yearly';

  return (
    <article
      className={[
        styles.planCard,
        isPopular ? styles.planCardFeatured : '',
        isBestSaving ? styles.planCardSavings : '',
      ].join(' ')}
    >
      {isPopular && <span className={`${styles.planBadge} ${styles.planBadgePopular}`}>Phổ biến nhất</span>}
      {!isPopular && isBestSaving && <span className={`${styles.planBadge} ${styles.planBadgeSaving}`}>Tiết kiệm nhất</span>}

      <p className={styles.planName}>Premium {plan.name}</p>
      <p className={styles.planPrice}>{formatCurrency(plan.price)}</p>
      <p className={styles.planMeta}>≈ {formatCurrency(plan.avgPerMonth)}/tháng</p>
      {savings > 0 && <span className={styles.planSavings}>Tiết kiệm {formatCurrency(savings)}</span>}

      <ul className={styles.planFeatureList}>
        {features.map(feature => (
          <li key={`${plan.id}-${feature}`}>
            <Check size={14} color="#047857" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`btn ${isPopular ? 'btn-primary' : 'btn-outline'} ${styles.fullButton}`}
        onClick={() => onCheckout(plan.id)}
        disabled={isLoading}
      >
        Chọn gói {plan.name}
      </button>
    </article>
  );
}
