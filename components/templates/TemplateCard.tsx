import { Crown, Eye, ShieldCheck, Sparkles } from 'lucide-react';
import TemplateThumbnail from '@/components/templates/TemplateThumbnail';
import styles from '@/components/templates/TemplatesPage.module.css';
import type { TemplateLibraryItem } from '@/components/templates/templateCatalog';

export default function TemplateCard({
  template,
  isPremiumUser,
  onPreview,
  onUse,
}: {
  template: TemplateLibraryItem;
  isPremiumUser: boolean;
  onPreview: (template: TemplateLibraryItem) => void;
  onUse: (template: TemplateLibraryItem) => void;
}) {
  const locked = template.isPremium && !isPremiumUser;

  return (
    <article className={styles.card}>
      <div style={{ position: 'relative' }}>
        <TemplateThumbnail template={template} />

        <div className={styles.badgeStack}>
          <div className={styles.badgeGroup}>
            <span className={`${styles.badge} ${template.isPremium ? styles.badgePremium : styles.badgeFree}`}>
              {template.isPremium ? (
                <>
                  <Crown size={11} />
                  Premium
                </>
              ) : (
                'Free'
              )}
            </span>
            {template.isAtsFriendly ? (
              <span className={`${styles.badge} ${styles.badgeAts}`}>
                <ShieldCheck size={11} />
                ATS-friendly
              </span>
            ) : null}
          </div>

          {template.isNew ? <span className={`${styles.badge} ${styles.badgeNew}`}>Mới</span> : null}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTitleRow}>
          <div>
            <h3 className={styles.cardTitle}>{template.name}</h3>
            <p className={styles.cardTarget}>{template.targetRole}</p>
          </div>
        </div>

        <p className={styles.cardDesc}>{template.description}</p>

        <div className={styles.tagList}>
          {template.tags.slice(0, 5).map(tag => (
            <span key={`${template.id}-${tag}`} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.cardActions}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onPreview(template)}>
            <Eye size={15} />
            Xem trước
          </button>
          <button
            type="button"
            className={`btn ${locked ? 'btn-outline' : 'btn-primary'} btn-sm`}
            onClick={() => onUse(template)}
          >
            {locked ? (
              <>
                <Sparkles size={15} />
                Mở khóa Premium
              </>
            ) : (
              'Dùng mẫu này'
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
