import styles from '@/components/pricing/PricingExperience.module.css';
import { PRICING_FAQS } from '@/components/pricing/pricingData';

export default function PricingFAQ() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <h2>Câu hỏi thường gặp</h2>
          <p>Nội dung ngắn gọn để bạn hiểu nhanh trước khi quyết định mua.</p>
        </div>

        <div className={styles.faqList}>
          {PRICING_FAQS.map(item => (
            <details key={item.q} className={styles.faqItem}>
              <summary className={styles.faqSummary}>
                {item.q}
                <span className={styles.faqIcon}>+</span>
              </summary>
              <div className={styles.faqAnswer}>{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
