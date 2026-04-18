import styles from '@/components/templates/TemplatesPage.module.css';
import {
  TEMPLATE_RECOMMENDATIONS,
  type TemplateLibraryItem,
} from '@/components/templates/templateCatalog';

export default function TemplateRecommendationSection({
  templates,
  onSelect,
}: {
  templates: TemplateLibraryItem[];
  onSelect: (template: TemplateLibraryItem) => void;
}) {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Chưa biết chọn mẫu nào?</h2>
            <p className={styles.sectionDesc}>Một vài gợi ý nhanh để bạn không phải đoán giữa quá nhiều lựa chọn.</p>
          </div>
        </div>

        <div className={styles.recommendGrid}>
          {TEMPLATE_RECOMMENDATIONS.map(item => {
            const template = templates.find(entry => entry.slug === item.templateSlug);
            if (!template) return null;

            return (
              <button
                key={item.templateSlug}
                type="button"
                className={styles.recommendCard}
                onClick={() => onSelect(template)}
                style={{ textAlign: 'left', cursor: 'pointer' }}
              >
                <p className={styles.recommendLabel}>{item.label}</p>
                <p className={styles.recommendValue}>{item.suggestion}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
