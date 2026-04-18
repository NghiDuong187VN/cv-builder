import styles from '@/components/pricing/PricingExperience.module.css';
import { COMPARISON_ROWS } from '@/components/pricing/pricingData';

function renderCell(value: string | boolean) {
  if (value === true) return <span className={styles.check}>✓</span>;
  if (value === false) return <span className={styles.minus}>—</span>;
  return value;
}

export default function ComparisonTable() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <h2>So sánh nhanh Free, Credits và Premium</h2>
          <p>Giữ lại các tiêu chí quan trọng nhất để bạn chọn gói trong vài giây.</p>
        </div>

        <div className={styles.comparisonWrap}>
          <div className={styles.comparisonScroll}>
            <table className={styles.comparisonTable}>
              <thead className={styles.comparisonHead}>
                <tr>
                  <th>Tính năng</th>
                  <th>Free</th>
                  <th>Credits</th>
                  <th className={styles.comparisonPremiumCol}>Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map(row => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{renderCell(row.free)}</td>
                    <td>{renderCell(row.credits)}</td>
                    <td className={styles.comparisonPremiumCol}>{renderCell(row.premium)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileCompare}>
            {[
              { title: 'Free', key: 'free' as const },
              { title: 'Credits', key: 'credits' as const },
              { title: 'Premium', key: 'premium' as const },
            ].map(plan => (
              <article key={plan.title} className={styles.mobileCompareCard}>
                <h3>{plan.title}</h3>
                {COMPARISON_ROWS.map(row => (
                  <div key={`${plan.key}-${row.label}`} className={styles.mobileCompareItem}>
                    <span>{row.label}</span>
                    <strong>{renderCell(row[plan.key])}</strong>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
