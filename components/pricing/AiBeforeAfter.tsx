import Link from 'next/link';
import styles from '@/components/pricing/PricingExperience.module.css';
import { AI_BEFORE_AFTER_SAMPLE } from '@/components/pricing/pricingData';

export default function AiBeforeAfter() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <h2>AI cải thiện CV như thế nào?</h2>
          <p>Bố cục trước/sau giúp bạn thấy rõ chất lượng nội dung được nâng cấp.</p>
        </div>

        <div className={styles.aiPanel}>
          <div className={styles.aiGrid}>
            <article className={`${styles.aiCol} ${styles.aiBefore}`}>
              <span className={`${styles.aiLabel} ${styles.aiLabelBefore}`}>Trước</span>
              <p className={styles.aiText}>{AI_BEFORE_AFTER_SAMPLE.before}</p>
            </article>
            <article className={`${styles.aiCol} ${styles.aiAfter}`}>
              <span className={`${styles.aiLabel} ${styles.aiLabelAfter}`}>Sau</span>
              <p className={styles.aiText}>{AI_BEFORE_AFTER_SAMPLE.after}</p>
              <ul className={styles.aiHighlightList}>
                {AI_BEFORE_AFTER_SAMPLE.highlights.map(item => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>

        <div className={styles.centerCta}>
          <Link href="#pricing-decision" className="btn btn-primary">
            Mở khóa AI từ 49.000đ/tháng
          </Link>
        </div>
      </div>
    </section>
  );
}
