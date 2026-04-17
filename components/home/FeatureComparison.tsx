'use client';

import { motion } from 'framer-motion';
import { Check, Crown, Minus, Wallet } from 'lucide-react';
import Link from 'next/link';

type CellValue = boolean | string;

interface CompareRow {
  label: string;
  free: CellValue;
  premium: CellValue;
  highlight?: boolean;
}

interface CompareGroup {
  title: string;
  rows: CompareRow[];
}

const compareGroups: CompareGroup[] = [
  {
    title: 'Tạo và lưu CV',
    rows: [
      { label: 'Số CV có thể tạo', free: 'Tối đa 3 CV', premium: 'Không giới hạn' },
      { label: 'Mẫu CV cơ bản', free: true, premium: true },
      { label: 'Toàn bộ mẫu CV cao cấp', free: false, premium: true, highlight: true },
      { label: 'Xuất PDF', free: 'Cơ bản', premium: 'Premium, sạch hơn', highlight: true },
      { label: 'Chia sẻ link CV', free: true, premium: true },
    ],
  },
  {
    title: 'AI và tối ưu ứng tuyển',
    rows: [
      { label: 'AI tạo tóm tắt cơ bản', free: '3 lượt/ngày', premium: 'Không giới hạn theo gói', highlight: true },
      { label: 'AI viết lại kinh nghiệm theo vị trí', free: false, premium: true, highlight: true },
      { label: 'ATS Review theo JD', free: false, premium: true, highlight: true },
      { label: 'AI tạo cover letter theo target job/company/JD', free: false, premium: true, highlight: true },
      { label: 'Lưu cover letter vào tài khoản', free: false, premium: true },
      { label: 'Tối ưu CV cho nhiều vị trí khác nhau', free: false, premium: true },
    ],
  },
];

function Cell({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <div className="cell-icon success">
        <Check size={14} strokeWidth={3} />
      </div>
    );
  }

  if (value === false) {
    return (
      <div className="cell-icon muted">
        <Minus size={14} strokeWidth={3} />
      </div>
    );
  }

  return <span className="cell-text">{value}</span>;
}

export default function FeatureComparison() {
  return (
    <section className="section" style={{ background: 'rgba(99,102,241,0.02)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '40px' }}
        >
          <div className="comparison-eyebrow">So sánh Free và Premium</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginBottom: '12px' }}>
            Khác biệt nằm ở <span className="gradient-text">mức độ tối ưu hồ sơ</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.75 }}>
            Free đủ để bắt đầu. Premium phù hợp khi bạn muốn tạo nhiều CV, tối ưu theo từng vị trí và tận dụng AI để tăng tốc ứng tuyển.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="comparison-shell"
        >
          <div className="comparison-note">
            Cần 1-2 CV Premium? Bạn có thể dùng mục <strong>Mua lượt tạo CV Premium</strong> ở phía trên thay vì đăng ký gói tháng.
          </div>

          <div className="comparison-scroll">
            <div className="comparison-table">
              <div className="comparison-header comparison-grid">
                <div className="feature-col">
                  <span className="header-label">Tính năng</span>
                </div>
                <div className="plan-col">
                  <div className="plan-chip free-chip">
                    <Wallet size={16} />
                    <span>Free</span>
                  </div>
                  <strong>0đ mãi mãi</strong>
                </div>
                <div className="plan-col plan-col-premium">
                  <div className="plan-chip premium-chip">
                    <Crown size={16} />
                    <span>Premium</span>
                  </div>
                  <strong>Từ 49.000đ</strong>
                </div>
              </div>

              {compareGroups.map(group => (
                <div key={group.title}>
                  <div className="group-title">{group.title}</div>
                  {group.rows.map(row => (
                    <div key={row.label} className={`comparison-grid comparison-row ${row.highlight ? 'comparison-row-highlight' : ''}`}>
                      <div className="feature-col feature-label">{row.label}</div>
                      <div className="plan-col"><Cell value={row.free} /></div>
                      <div className="plan-col plan-col-premium"><Cell value={row.premium} /></div>
                    </div>
                  ))}
                </div>
              ))}

              <div className="comparison-grid comparison-footer">
                <div className="feature-col footer-copy">Chọn gói theo đúng nhịp ứng tuyển của bạn.</div>
                <div className="plan-col">
                  <Link href="/auth" className="table-cta table-cta-free">Bắt đầu miễn phí</Link>
                </div>
                <div className="plan-col plan-col-premium">
                  <Link href="#premium-plans" className="table-cta table-cta-premium">Xem gói Premium</Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .comparison-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.18);
          color: var(--primary);
          font-size: 0.82rem;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .comparison-shell {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: var(--shadow-xl);
        }

        .comparison-note {
          padding: 16px 20px;
          background: rgba(245, 158, 11, 0.08);
          border-bottom: 1px solid rgba(245, 158, 11, 0.16);
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .comparison-scroll {
          overflow-x: auto;
        }

        .comparison-table {
          min-width: 760px;
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) 180px 220px;
        }

        .comparison-header {
          background: rgba(99, 102, 241, 0.04);
          border-bottom: 1px solid var(--border);
        }

        .feature-col,
        .plan-col {
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .feature-col {
          justify-content: flex-start;
          text-align: left;
        }

        .plan-col {
          border-left: 1px solid var(--border);
          flex-direction: column;
          gap: 8px;
        }

        .plan-col-premium {
          background: rgba(99, 102, 241, 0.03);
        }

        .header-label {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .plan-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .free-chip {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }

        .premium-chip {
          background: linear-gradient(135deg, #f59e0b, #ec4899);
          color: white;
        }

        .group-title {
          padding: 12px 22px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: rgba(99, 102, 241, 0.04);
          font-size: 0.88rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .comparison-row {
          border-bottom: 1px solid var(--border);
        }

        .comparison-row-highlight {
          background: rgba(245, 158, 11, 0.04);
        }

        .feature-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .cell-icon {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .cell-icon.success {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }

        .cell-icon.muted {
          background: rgba(148, 163, 184, 0.12);
          color: var(--text-muted);
        }

        .cell-text {
          font-size: 0.86rem;
          line-height: 1.5;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .comparison-footer {
          background: rgba(99, 102, 241, 0.04);
        }

        .footer-copy {
          font-size: 0.88rem;
          color: var(--text-muted);
        }

        .table-cta {
          width: 100%;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.84rem;
          padding: 11px 14px;
          border-radius: 12px;
        }

        .table-cta-free {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }

        .table-cta-premium {
          background: linear-gradient(135deg, #f59e0b, #ec4899);
          color: white;
        }
      `}</style>
    </section>
  );
}
