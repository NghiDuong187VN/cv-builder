'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Crown, ShieldCheck, Sparkles, X } from 'lucide-react';
import TemplateThumbnail from '@/components/templates/TemplateThumbnail';
import styles from '@/components/templates/TemplatesPage.module.css';
import type { TemplateLibraryItem } from '@/components/templates/templateCatalog';

export default function TemplatePreviewModal({
  template,
  isPremiumUser,
  onClose,
  onUse,
}: {
  template: TemplateLibraryItem | null;
  isPremiumUser: boolean;
  onClose: () => void;
  onUse: (template: TemplateLibraryItem) => void;
}) {
  if (!template) return null;

  const locked = template.isPremium && !isPremiumUser;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalBackdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modalShell}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={event => event.stopPropagation()}
        >
          <div className={styles.modalHeader}>
            <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Đóng preview">
              <X size={18} />
            </button>
          </div>

          <div className={styles.modalContent}>
            <div className={styles.modalPreview}>
              <div className={styles.modalPaper}>
                <TemplateThumbnail template={template} large />
              </div>
            </div>

            <div className={styles.modalInfo}>
              <div>
                <p className={styles.modalKicker}>Preview mẫu CV</p>
                <h2 className={styles.modalTitle}>{template.name}</h2>
                <p className={styles.modalText} style={{ marginTop: 10 }}>
                  {template.description}
                </p>
              </div>

              <div className={styles.tagList}>
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
                {template.isNew ? <span className={`${styles.badge} ${styles.badgeNew}`}>Mới</span> : null}
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 10 }}>Phù hợp với ai</h3>
                <ul className={styles.modalList}>
                  <li>
                    <Sparkles size={15} color="var(--primary)" />
                    <span>{template.targetRole}</span>
                  </li>
                  <li>
                    <Sparkles size={15} color="var(--primary)" />
                    <span>{template.layoutType === '2col' ? 'Bố cục 2 cột, nổi bật phần kỹ năng và sidebar.' : 'Bố cục 1 cột, sạch và dễ đọc khi scan nhanh.'}</span>
                  </li>
                  <li>
                    <Sparkles size={15} color="var(--primary)" />
                    <span>{template.isAtsFriendly ? 'Phù hợp với hồ sơ cần ưu tiên ATS và tính rõ ràng.' : 'Phù hợp khi bạn muốn CV có cá tính hơn mà vẫn chuyên nghiệp.'}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 10 }}>Điểm nổi bật</h3>
                <div className={styles.tagList}>
                  {template.tags.map(tag => (
                    <span key={`${template.id}-modal-${tag}`} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <button
                  type="button"
                  className={`btn ${locked ? 'btn-outline' : 'btn-primary'}`}
                  onClick={() => onUse(template)}
                >
                  {locked ? 'Mở khóa Premium' : 'Dùng mẫu này'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Đóng preview
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
