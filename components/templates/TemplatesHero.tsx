import Link from 'next/link';
import { ArrowRight, Crown, LayoutGrid, Layers3, Sparkles } from 'lucide-react';
import TemplateThumbnail from '@/components/templates/TemplateThumbnail';
import styles from '@/components/templates/TemplatesPage.module.css';
import type { TemplateLibraryItem } from '@/components/templates/templateCatalog';

export default function TemplatesHero({
  featuredTemplates,
  freeCount,
  premiumCount,
  industryCount,
}: {
  featuredTemplates: TemplateLibraryItem[];
  freeCount: number;
  premiumCount: number;
  industryCount: number;
}) {
  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <Sparkles size={14} />
              Thư viện mẫu CV
            </div>
            <h1 className={styles.heroTitle}>Chọn mẫu CV phù hợp với ngành và phong cách của bạn</h1>
            <p className={styles.heroDesc}>
              Từ sinh viên, fresher đến người đi làm, CVFlow cung cấp các mẫu CV hiện đại, tối giản và ATS-friendly để bạn bắt đầu nhanh hơn.
            </p>

            <div className={styles.heroMeta}>
              <div className={styles.heroMetaCard}>
                <span className={styles.heroMetaValue}>{freeCount} mẫu Free</span>
                <span className={styles.heroMetaLabel}>Dùng ngay không mất phí</span>
              </div>
              <div className={styles.heroMetaCard}>
                <span className={styles.heroMetaValue}>{premiumCount} mẫu Premium</span>
                <span className={styles.heroMetaLabel}>Mở khóa để nâng cấp hồ sơ</span>
              </div>
              <div className={styles.heroMetaCard}>
                <span className={styles.heroMetaValue}>{industryCount} nhóm ngành</span>
                <span className={styles.heroMetaLabel}>Dễ lọc theo nhu cầu thực tế</span>
              </div>
              <div className={styles.heroMetaCard}>
                <span className={styles.heroMetaValue}>Vài giây để bắt đầu</span>
                <span className={styles.heroMetaLabel}>Chọn mẫu, preview và dùng ngay</span>
              </div>
            </div>

            <div className={styles.heroActions}>
              <Link href="/cv/new" className="btn btn-primary">
                Tạo CV miễn phí
                <ArrowRight size={16} />
              </Link>
              <Link href="/pricing" className="btn btn-secondary">
                <Crown size={16} />
                Xem gói Premium
              </Link>
            </div>
          </div>

          <div className={styles.heroPreview}>
            <div className={styles.sectionHeader} style={{ marginBottom: 14 }}>
              <div>
                <h2 className={styles.sectionTitle} style={{ fontSize: '1.1rem' }}>
                  Mẫu nổi bật hôm nay
                </h2>
                <p className={styles.sectionDesc} style={{ marginTop: 4, fontSize: '0.86rem' }}>
                  Free và Premium đều hiển thị rõ ngay từ đầu.
                </p>
              </div>
            </div>

            <div className={styles.heroPreviewGrid}>
              {featuredTemplates.slice(0, 4).map(template => (
                <div key={template.id} className={styles.heroPreviewCard}>
                  <TemplateThumbnail template={template} />
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 10,
                        alignItems: 'center',
                      }}
                    >
                      <strong style={{ fontSize: '0.84rem' }}>{template.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {template.isPremium ? <Crown size={12} /> : <LayoutGrid size={12} />}
                      </span>
                    </div>
                    <p style={{ marginTop: 4, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {template.tags.slice(0, 2).join(' · ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              <Layers3 size={14} />
              Xem trước nhanh, lọc theo ngành, dùng mẫu trong một luồng rõ ràng.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
