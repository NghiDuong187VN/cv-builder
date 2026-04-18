import { HERO_SUMMARY_CARDS } from '@/components/pricing/pricingData';
import styles from '@/components/pricing/PricingExperience.module.css';

const toneClassMap = {
  free: styles.summaryCardFree,
  credits: styles.summaryCardCredits,
  premium: styles.summaryCardPremium,
};

export default function PricingHero() {
  return (
    <section className={styles.heroSection}>
      <div className="container">
        <div className={styles.heroWrap}>
          <h1 className={styles.heroTitle}>Chọn cách dùng phù hợp với bạn</h1>
          <p className={styles.heroDesc}>
            Bắt đầu miễn phí, nâng cấp Premium để tối ưu CV bằng AI, hoặc nạp credits khi chỉ cần dùng một vài tính năng trả phí.
          </p>

          <div className={styles.summaryGrid}>
            {HERO_SUMMARY_CARDS.map(card => (
              <article key={card.title} className={`${styles.summaryCard} ${toneClassMap[card.tone]}`}>
                <h3>{card.title}</h3>
                <p>{card.subtitle}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
