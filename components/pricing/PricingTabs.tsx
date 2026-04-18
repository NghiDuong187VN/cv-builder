import { Coins, Crown } from 'lucide-react';
import styles from '@/components/pricing/PricingExperience.module.css';

export type PricingTab = 'premium' | 'credits';

export default function PricingTabs({
  activeTab,
  onChange,
}: {
  activeTab: PricingTab;
  onChange: (tab: PricingTab) => void;
}) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Lựa chọn gói">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'premium'}
        className={`${styles.tab} ${activeTab === 'premium' ? styles.tabActive : ''}`}
        onClick={() => onChange('premium')}
      >
        <Crown size={15} />
        Gói Premium
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'credits'}
        className={`${styles.tab} ${activeTab === 'credits' ? styles.tabActive : ''}`}
        onClick={() => onChange('credits')}
      >
        <Coins size={15} />
        Nạp Credits
      </button>
    </div>
  );
}
