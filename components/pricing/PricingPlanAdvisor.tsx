import styles from '@/components/pricing/PricingExperience.module.css';
import { PLAN_ADVICE_CARDS } from '@/components/pricing/pricingData';

export default function PricingPlanAdvisor() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <h2>Bạn nên chọn gói nào?</h2>
          <p>3 gợi ý ngắn để bạn chọn đúng theo nhu cầu sử dụng thực tế.</p>
        </div>

        <div className={styles.advisorGrid}>
          {PLAN_ADVICE_CARDS.map(card => (
            <article key={card.title} className={styles.advisorCard}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <p>{card.caption}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
