'use client';

import { motion } from 'framer-motion';
import { Check, Coins, Crown, Minus, Wallet } from 'lucide-react';
import Link from 'next/link';
import { getStartingPriceLabel } from '@/lib/billing';

/* ─── Data types ─────────────────────────────────────────── */
type CellValue =
  | boolean          // true = checkmark, false = dash
  | string;          // text label

interface CompareRow {
  label: string;
  free: CellValue;
  premium: CellValue;
  credits: CellValue;
}

interface CompareGroup {
  title: string;
  rows: CompareRow[];
}

/* ─── Data ───────────────────────────────────────────────── */
const COMPARE_GROUPS: CompareGroup[] = [
  {
    title: 'Tạo & lưu CV',
    rows: [
      {
        label: 'Số lượng CV',
        free: 'Tối đa 3 CV',
        premium: 'Không giới hạn',
        credits: 'Không giới hạn',
      },
      {
        label: 'Template Premium',
        free: false,
        premium: true,
        credits: '1 credit / lần',
      },
      {
        label: 'PDF không watermark',
        free: false,
        premium: true,
        credits: '1 credit / lần',
      },
    ],
  },
  {
    title: 'AI & tối ưu nội dung',
    rows: [
      {
        label: 'AI Summary',
        free: '3 lần / ngày',
        premium: 'Không giới hạn',
        credits: '2 credits / lần',
      },
      {
        label: 'AI Rewrite',
        free: false,
        premium: true,
        credits: '2 credits / lần',
      },
      {
        label: 'ATS Review',
        free: false,
        premium: true,
        credits: '5 credits / lần',
      },
      {
        label: 'Cover Letter',
        free: false,
        premium: true,
        credits: '5 credits / lần',
      },
    ],
  },
  {
    title: 'Hồ sơ & theo dõi',
    rows: [
      {
        label: 'Public Profile nâng cao',
        free: false,
        premium: true,
        credits: false,
      },
      {
        label: 'Application Tracker',
        free: false,
        premium: true,
        credits: false,
      },
    ],
  },
  {
    title: 'Phù hợp với ai',
    rows: [
      {
        label: 'Phù hợp với ai',
        free: 'Mới bắt đầu tìm việc',
        premium: 'Đang ứng tuyển tích cực',
        credits: 'Chỉ dùng một vài tính năng',
      },
    ],
  },
];

/* ─── Cell renderer ──────────────────────────────────────── */
function Cell({ value, col }: { value: CellValue; col: 'free' | 'premium' | 'credits' }) {
  if (value === true) {
    const color = col === 'premium' ? '#6366f1' : col === 'credits' ? '#f59e0b' : '#10b981';
    return (
      <span className={`fc-cell-icon fc-cell-icon--${col}`}>
        <Check size={13} strokeWidth={3} color={color} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="fc-cell-icon fc-cell-icon--muted">
        <Minus size={13} strokeWidth={2.5} />
      </span>
    );
  }
  return <span className={`fc-cell-text fc-cell-text--${col}`}>{value}</span>;
}

/* ─── Component ──────────────────────────────────────────── */
export default function FeatureComparison() {
  return (
    <section className="section" style={{ background: 'rgba(99,102,241,0.02)' }}>
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '40px' }}
        >
          <div className="fc-eyebrow">So sánh các gói</div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginBottom: '12px' }}>
            Free, Premium hay Credits —{' '}
            <span className="gradient-text">gói nào phù hợp với bạn?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.75 }}>
            Chỉ cần dùng một vài tính năng? Hãy xem tab <strong>Nạp Credits</strong> trên trang Giá —{' '}
            dùng bao nhiêu trả bấy nhiêu, không cần gói tháng.
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="fc-shell"
        >
          <div className="fc-scroll">
            <div className="fc-table">

              {/* Column headers */}
              <div className="fc-header fc-row">
                <div className="fc-col fc-col--feature">
                  <span className="fc-header-label">Tính năng</span>
                </div>

                {/* Free */}
                <div className="fc-col fc-col--free">
                  <div className="fc-plan-chip fc-plan-chip--free">
                    <Wallet size={14} /> Free
                  </div>
                  <strong className="fc-plan-price">0đ mãi mãi</strong>
                </div>

                {/* Premium */}
                <div className="fc-col fc-col--premium">
                  <div className="fc-plan-chip fc-plan-chip--premium">
                    <Crown size={14} /> Premium
                  </div>
                  <strong className="fc-plan-price">Từ {getStartingPriceLabel()}</strong>
                </div>

                {/* Credits */}
                <div className="fc-col fc-col--credits">
                  <div className="fc-plan-chip fc-plan-chip--credits">
                    <Coins size={14} /> Credits
                  </div>
                  <strong className="fc-plan-price">1.000đ / credit</strong>
                </div>
              </div>

              {/* Groups */}
              {COMPARE_GROUPS.map(group => (
                <div key={group.title}>
                  <div className="fc-group-title">{group.title}</div>

                  {group.rows.map((row, i) => (
                    <div
                      key={row.label}
                      className={`fc-row ${i % 2 === 1 ? 'fc-row--alt' : ''}`}
                    >
                      <div className="fc-col fc-col--feature fc-feature-label">
                        {row.label}
                      </div>
                      <div className="fc-col fc-col--free">
                        <Cell value={row.free} col="free" />
                      </div>
                      <div className="fc-col fc-col--premium">
                        <Cell value={row.premium} col="premium" />
                      </div>
                      <div className="fc-col fc-col--credits">
                        <Cell value={row.credits} col="credits" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Footer CTAs */}
              <div className="fc-footer fc-row">
                <div className="fc-col fc-col--feature fc-footer-copy">
                  Chọn đúng theo nhịp ứng tuyển của bạn.
                </div>
                <div className="fc-col fc-col--free">
                  <Link href="/auth" className="fc-cta fc-cta--free">
                    Bắt đầu miễn phí
                  </Link>
                </div>
                <div className="fc-col fc-col--premium">
                  <Link href="/pricing" className="fc-cta fc-cta--premium">
                    Xem gói Premium
                  </Link>
                </div>
                <div className="fc-col fc-col--credits">
                  <Link href="/pricing" className="fc-cta fc-cta--credits">
                    Nạp Credits
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .fc-eyebrow {
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

        /* Shell & scroll wrapper */
        .fc-shell {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: var(--shadow-xl);
        }
        .fc-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .fc-table {
          min-width: 680px;
        }

        /* Row layout */
        .fc-row {
          display: grid;
          grid-template-columns: minmax(200px, 1.6fr) repeat(3, minmax(120px, 1fr));
          border-bottom: 1px solid var(--border);
        }
        .fc-row:last-child {
          border-bottom: none;
        }
        .fc-row--alt {
          background: rgba(99, 102, 241, 0.015);
        }

        /* Column base */
        .fc-col {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .fc-col--feature {
          justify-content: flex-start;
          text-align: left;
          border-right: 1px solid var(--border);
        }
        .fc-col--premium {
          background: rgba(99, 102, 241, 0.025);
        }

        /* Header row */
        .fc-header {
          background: rgba(99, 102, 241, 0.04);
          border-bottom: 2px solid var(--border);
        }
        .fc-header .fc-col {
          padding: 18px 16px;
          flex-direction: column;
          gap: 8px;
        }
        .fc-header-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          align-self: flex-start;
        }
        .fc-plan-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .fc-plan-chip--free {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }
        .fc-plan-chip--premium {
          background: var(--gradient-primary);
          color: white;
        }
        .fc-plan-chip--credits {
          background: rgba(245, 158, 11, 0.12);
          color: #b45309;
        }
        .fc-plan-price {
          font-size: 0.88rem;
          color: var(--text-primary);
        }

        /* Group title */
        .fc-group-title {
          padding: 10px 16px;
          background: rgba(99, 102, 241, 0.05);
          border-bottom: 1px solid var(--border);
          border-top: 1px solid var(--border);
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Feature label */
        .fc-feature-label {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Cell icon */
        .fc-cell-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .fc-cell-icon--free {
          background: rgba(16, 185, 129, 0.1);
        }
        .fc-cell-icon--premium {
          background: rgba(99, 102, 241, 0.1);
        }
        .fc-cell-icon--credits {
          background: rgba(245, 158, 11, 0.1);
        }
        .fc-cell-icon--muted {
          background: rgba(148, 163, 184, 0.1);
          color: var(--text-muted);
        }

        /* Cell text */
        .fc-cell-text {
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.4;
        }
        .fc-cell-text--free    { color: #059669; }
        .fc-cell-text--premium { color: var(--primary); }
        .fc-cell-text--credits { color: #b45309; }

        /* Footer row */
        .fc-footer {
          background: rgba(99, 102, 241, 0.03);
          border-top: 2px solid var(--border);
        }
        .fc-footer .fc-col {
          padding: 16px;
        }
        .fc-footer-copy {
          font-size: 0.84rem;
          color: var(--text-muted);
          font-style: italic;
        }

        /* CTAs */
        .fc-cta {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.82rem;
          padding: 10px 12px;
          border-radius: 12px;
          transition: var(--transition);
        }
        .fc-cta--free {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .fc-cta--free:hover {
          background: rgba(16, 185, 129, 0.18);
        }
        .fc-cta--premium {
          background: var(--gradient-primary);
          color: white;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }
        .fc-cta--premium:hover {
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
          transform: translateY(-1px);
        }
        .fc-cta--credits {
          background: rgba(245, 158, 11, 0.1);
          color: #b45309;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .fc-cta--credits:hover {
          background: rgba(245, 158, 11, 0.18);
        }

        /* Mobile hint */
        @media (max-width: 720px) {
          .fc-shell::before {
            content: '← Vuốt ngang để xem đầy đủ';
            display: block;
            padding: 10px 16px;
            font-size: 0.75rem;
            color: var(--text-muted);
            font-style: italic;
            border-bottom: 1px solid var(--border);
            background: rgba(99, 102, 241, 0.03);
          }
        }
      `}</style>
    </section>
  );
}
