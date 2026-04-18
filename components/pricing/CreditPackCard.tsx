import type { TopUpPackageConfig } from '@/lib/billing';
import { CREDIT_RATE_VND } from '@/lib/billing';
import styles from '@/components/pricing/PricingExperience.module.css';
import { formatCurrency } from '@/components/pricing/utils';

export default function CreditPackCard({
  pack,
  isLoading,
  onCheckout,
}: {
  pack: TopUpPackageConfig;
  isLoading: boolean;
  onCheckout: (packageId: string) => void;
}) {
  const baseCredits = pack.amount / CREDIT_RATE_VND;
  const bonus = pack.credits - baseCredits;

  return (
    <article className={styles.creditCard}>
      <h3>{formatCurrency(pack.amount)}</h3>
      <p>{pack.credits} credits</p>
      {bonus > 0 ? <span className={styles.creditBonus}>+{bonus} credits tặng</span> : null}
      <button
        type="button"
        className={`btn btn-outline ${styles.fullButton}`}
        onClick={() => onCheckout(pack.id)}
        disabled={isLoading}
      >
        Nạp ngay
      </button>
    </article>
  );
}
