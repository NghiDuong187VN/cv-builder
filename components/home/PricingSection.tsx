'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  CircleDollarSign,
  Coins,
  Copy,
  Crown,
  Mail,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  BASE_MONTHLY_PRICE,
  CREDIT_RATE_VND,
  CREDIT_USAGE_TABLE,
  MIN_CUSTOM_TOPUP,
  PREMIUM_PLAN_FEATURES,
  PREMIUM_PLANS,
  TOP_UP_PACKAGES,
} from '@/lib/billing';
import { SUPPORT_INFO } from '@/lib/creator';

type Tab = 'premium' | 'credits';

type CheckoutItem = {
  type: 'subscription' | 'credit';
  id: string;
  name: string;
  amount: number;
  credits?: number;
};

/** Labels per plan id (overrides config ctaLabel for UI spec) */
const CTA_LABELS: Record<string, string> = {
  premium_monthly: 'Dùng thử Premium',
  premium_quarterly: 'Chọn gói phổ biến nhất',
  premium_biannual: 'Chọn gói',
  premium_yearly: 'Chọn gói tiết kiệm nhất',
};

function formatCurrency(amount: number) {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

/* ─── Checkout modal ─────────────────────────────────────── */
function CheckoutModal({
  item,
  userEmail,
  onClose,
}: {
  item: CheckoutItem;
  userEmail: string;
  onClose: () => void;
}) {
  const transferContent = `CVFLOW + ${userEmail} + ${item.name}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transferContent);
      toast.success('Đã sao chép nội dung chuyển khoản.');
    } catch {
      toast.error('Không thể sao chép, bạn vui lòng copy thủ công.');
    }
  };

  const handleConfirmed = () => {
    const subject = encodeURIComponent(`Xác nhận thanh toán ${item.name}`);
    const body = encodeURIComponent(
      [
        'Chào CVFlow,',
        '',
        `Tôi đã thanh toán cho gói: ${item.name}`,
        `Email tài khoản: ${userEmail}`,
        `Số tiền: ${formatCurrency(item.amount)}`,
        `Nội dung chuyển khoản: ${transferContent}`,
        '',
        'Tôi sẽ đính kèm ảnh xác nhận thanh toán trong email này.',
      ].join('\n')
    );
    window.location.href = `mailto:${SUPPORT_INFO.email}?subject=${subject}&body=${body}`;
  };

  const handleSupport = () => {
    const subject = encodeURIComponent('Liên hệ hỗ trợ thanh toán CVFlow');
    const body = encodeURIComponent(
      ['Chào CVFlow,', '', `Tôi cần hỗ trợ thanh toán cho: ${item.name}`, `Email tài khoản: ${userEmail}`].join('\n')
    );
    window.location.href = `mailto:${SUPPORT_INFO.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="co-backdrop" onClick={onClose}>
      <motion.div
        className="co-modal"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="co-head">
          <div className="co-icon">
            <CircleDollarSign size={22} color="#6366f1" />
          </div>
          <div>
            <p className="co-kicker">Thanh toán thủ công</p>
            <h3 className="co-title">Xác nhận gói bạn đã chọn</h3>
          </div>
        </div>

        <div className="co-summary">
          <div><span className="co-label">Tên gói</span><strong>{item.name}</strong></div>
          <div><span className="co-label">Số tiền</span><strong>{formatCurrency(item.amount)}</strong></div>
          {item.credits != null && (
            <div><span className="co-label">Credits nhận được</span><strong>{item.credits} credits</strong></div>
          )}
        </div>

        <div className="co-transfer">
          <div className="co-transfer-head">
            <span>Nội dung chuyển khoản gợi ý</span>
            <button type="button" className="co-copy-btn" onClick={handleCopy}>
              <Copy size={13} /> Sao chép
            </button>
          </div>
          <code>{transferContent}</code>
        </div>

        <div className="co-note">
          <Mail size={16} color="#6366f1" />
          <div>
            <strong>Sau khi thanh toán, vui lòng gửi ảnh xác nhận qua email hỗ trợ.</strong>
            <p>
              Email hỗ trợ:{' '}
              <a href={`mailto:${SUPPORT_INFO.email}`}>{SUPPORT_INFO.email}</a>
              {SUPPORT_INFO.phone ? <> · {SUPPORT_INFO.phone}</> : null}
            </p>
          </div>
        </div>

        <div className="co-actions">
          <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleConfirmed}>
            Tôi đã thanh toán
          </button>
          <button type="button" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSupport}>
            Liên hệ hỗ trợ
          </button>
          <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
            Đóng
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Tab: Gói Premium ───────────────────────────────────── */
function PremiumTab({ onCheckout, loading }: { onCheckout: (planId: string) => void; loading: boolean }) {
  return (
    <div>
      {/* Plan grid */}
      <div className="pt-grid">
        {PREMIUM_PLANS.map(plan => {
          const basePrice = BASE_MONTHLY_PRICE * plan.months;
          const savings = basePrice - plan.price;
          const isFeatured = plan.badge === 'Phổ biến nhất';
          const ctaLabel = CTA_LABELS[plan.id] ?? plan.ctaLabel;

          return (
            <motion.article
              key={plan.id}
              className={`pt-card ${isFeatured ? 'pt-card--featured' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              {plan.badge && (
                <div className={`pt-badge ${plan.badge === 'Tiết kiệm nhất' ? 'pt-badge--green' : ''}`}>
                  {plan.badge === 'Phổ biến nhất' ? <Sparkles size={11} /> : <Crown size={11} />}
                  {plan.badge}
                </div>
              )}

              <div className="pt-card-top">
                <p className="pt-name">Premium {plan.name}</p>
                <div className="pt-price-row">
                  <span className="pt-price">{formatCurrency(plan.price)}</span>
                  {plan.months > 1 && (
                    <span className="pt-per-month">≈ {formatCurrency(plan.avgPerMonth)}/tháng</span>
                  )}
                </div>

                <div className="pt-chips">
                  <span className="pt-chip pt-chip--duration">
                    {plan.duration}
                  </span>
                  {savings > 0 && (
                    <span className="pt-chip pt-chip--saving">
                      Tiết kiệm {formatCurrency(savings)}
                    </span>
                  )}
                </div>
              </div>

              <ul className="pt-features">
                {PREMIUM_PLAN_FEATURES.map(feature => (
                  <li key={feature}>
                    <Check size={14} strokeWidth={2.5} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`btn ${isFeatured ? 'btn-primary' : 'btn-outline'} pt-cta`}
                disabled={loading}
                onClick={() => onCheckout(plan.id)}
              >
                {ctaLabel}
              </button>

              <p className="pt-desc">{plan.description}</p>
            </motion.article>
          );
        })}
      </div>

      {/* Trust message */}
      <p className="pt-footer-note">
        Thanh toán thủ công an toàn · Hỗ trợ qua email {SUPPORT_INFO.email}
      </p>
    </div>
  );
}

/* ─── Tab: Nạp Credits ───────────────────────────────────── */
function CreditsTab({
  onCheckout,
  loading,
  customAmount,
  setCustomAmount,
  onCustomCheckout,
}: {
  onCheckout: (packageId: string) => void;
  loading: boolean;
  customAmount: string;
  setCustomAmount: (v: string) => void;
  onCustomCheckout: () => void;
}) {
  return (
    <div>
      {/* Rate info bar */}
      <div className="cr-info-bar">
        <div className="cr-info-left">
          <Coins size={18} color="#f59e0b" />
          <div>
            <strong>1.000đ = 1 credit</strong>
            <span>Nạp credits và trả theo nhu cầu sử dụng — không cần gói tháng.</span>
          </div>
        </div>
        <div className="cr-info-note">Credits hiện không hết hạn</div>
      </div>

      {/* Pack grid */}
      <div className="cr-grid">
        {TOP_UP_PACKAGES.map(pack => {
          const baseCredits = pack.amount / CREDIT_RATE_VND;
          const bonus = pack.credits - baseCredits;
          return (
            <article key={pack.id} className="cr-card">
              <div className="cr-card-top">
                <span className="cr-credits">{pack.credits} <small>credits</small></span>
                {bonus > 0 && <span className="cr-bonus">+{bonus} tặng</span>}
              </div>
              <p className="cr-amount">{formatCurrency(pack.amount)}</p>
              <p className="cr-desc">{pack.description}</p>
              <button
                type="button"
                className="btn btn-outline cr-btn"
                disabled={loading}
                onClick={() => onCheckout(pack.id)}
              >
                Nạp ngay
              </button>
            </article>
          );
        })}

        {/* Custom amount card */}
        <article className="cr-card cr-card--custom">
          <div className="cr-card-top">
            <span className="cr-credits">Tùy chọn</span>
          </div>
          <p className="cr-desc">
            Nhập số tiền muốn nạp. Hệ thống quy đổi theo tỷ lệ{' '}
            <strong>1.000đ = 1 credit</strong>. Tối thiểu {formatCurrency(MIN_CUSTOM_TOPUP)}.
          </p>
          <div className="cr-custom-form">
            <input
              type="number"
              className="input"
              min={MIN_CUSTOM_TOPUP}
              step={CREDIT_RATE_VND}
              placeholder={`Ví dụ: ${MIN_CUSTOM_TOPUP}`}
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading}
              onClick={onCustomCheckout}
            >
              Nạp
            </button>
          </div>
        </article>
      </div>

      {/* Usage table */}
      <div className="cr-usage">
        <p className="cr-usage-title">
          <Zap size={15} />
          Credits dùng để làm gì?
        </p>
        <div className="cr-usage-grid">
          {CREDIT_USAGE_TABLE.map(row => (
            <div key={row.label} className="cr-usage-row">
              <span className="cr-usage-label">{row.label}</span>
              <span className="cr-usage-cost">
                <Coins size={12} />
                {row.credits} credit{row.credits > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
        <div className="cr-usage-notes">
          <div className="cr-note-item cr-note-item--blue">
            <span className="cr-note-dot" />
            <p>
              <strong>Đang có Premium:</strong> các tính năng nằm trong gói Premium sẽ được dùng tự do,{' '}
              không trừ credits. Credits chỉ bị trừ khi dùng tính năng ngoài phạm vi gói.
            </p>
          </div>
          <div className="cr-note-item cr-note-item--amber">
            <span className="cr-note-dot" />
            <p>
              <strong>Premium hết hạn:</strong> nếu bạn vẫn còn credits, bạn vẫn có thể dùng
              từng tính năng trả phí theo lượt bình thường — không bị mất quyền truy cập ngay lập tức.
            </p>
          </div>
          <div className="cr-note-item cr-note-item--green">
            <span className="cr-note-dot" />
            <p>
              <strong>Credits không hết hạn:</strong> số credits bạn nạp sẽ không bị xóa theo thời gian.
              Dùng đến khi hết, không áp lực.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function PricingSection() {
  const router = useRouter();
  const { firebaseUser, user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('premium');
  const [customAmount, setCustomAmount] = useState('');
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);

  const userEmail = firebaseUser?.email || user?.email || 'email-cua-ban';

  const ensureAuthenticated = () => {
    if (loading) return false;
    if (!firebaseUser) { router.push('/auth'); return false; }
    return true;
  };

  const openCheckout = (item: CheckoutItem) => {
    if (!ensureAuthenticated()) return;
    setCheckoutItem(item);
  };

  const handlePremiumCheckout = (planId: string) => {
    const plan = PREMIUM_PLANS.find(p => p.id === planId);
    if (!plan) return;
    openCheckout({ type: 'subscription', id: plan.id, name: `Premium ${plan.name}`, amount: plan.price });
  };

  const handleTopUpCheckout = (packageId: string) => {
    const pack = TOP_UP_PACKAGES.find(p => p.id === packageId);
    if (!pack) return;
    openCheckout({ type: 'credit', id: pack.id, name: `Nạp ${pack.credits} credits`, amount: pack.amount, credits: pack.credits });
  };

  const handleCustomTopUp = () => {
    const normalized = Number(customAmount.replace(/[^\d]/g, ''));
    if (!normalized || normalized < MIN_CUSTOM_TOPUP) {
      toast.error(`Vui lòng nhập số tiền từ ${formatCurrency(MIN_CUSTOM_TOPUP)} trở lên.`);
      return;
    }
    if (normalized % CREDIT_RATE_VND !== 0) {
      toast.error(`Số tiền nạp cần chia hết cho ${formatCurrency(CREDIT_RATE_VND)} để quy đổi đúng số credits.`);
      return;
    }
    openCheckout({
      type: 'credit',
      id: `custom_${normalized}`,
      name: `Nạp ${normalized / CREDIT_RATE_VND} credits`,
      amount: normalized,
      credits: normalized / CREDIT_RATE_VND,
    });
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'premium', label: 'Gói Premium', icon: <Crown size={16} /> },
    { id: 'credits', label: 'Nạp Credits', icon: <Coins size={16} /> },
  ];

  return (
    <section className="section" id="pricing" style={{ position: 'relative' }}>
      <div className="container">

        {/* Tab switcher */}
        <div className="ps-tabs-wrapper">
          <div className="ps-tabs" role="tablist">
            {TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`ps-tab ${activeTab === tab.id ? 'ps-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {activeTab === 'premium' ? (
              <PremiumTab onCheckout={handlePremiumCheckout} loading={loading} />
            ) : (
              <CreditsTab
                onCheckout={handleTopUpCheckout}
                loading={loading}
                customAmount={customAmount}
                setCustomAmount={setCustomAmount}
                onCustomCheckout={handleCustomTopUp}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Checkout modal */}
      <AnimatePresence>
        {checkoutItem && (
          <CheckoutModal
            item={checkoutItem}
            userEmail={userEmail}
            onClose={() => setCheckoutItem(null)}
          />
        )}
      </AnimatePresence>

      <style jsx>{`
        /* ── Tab switcher ── */
        .ps-tabs-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 40px;
        }
        .ps-tabs {
          display: inline-flex;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 9999px;
          padding: 5px;
          gap: 4px;
          box-shadow: var(--shadow-sm);
        }
        .ps-tab {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 22px;
          border-radius: 9999px;
          border: none;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          background: transparent;
          color: var(--text-secondary);
          transition: var(--transition);
          white-space: nowrap;
        }
        .ps-tab:hover {
          color: var(--primary);
        }
        .ps-tab--active {
          background: var(--gradient-primary);
          color: white;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
        }

        /* ── Premium tab grid ── */
        .pt-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          align-items: stretch;
        }
        .pt-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 26px 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
        }
        .pt-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-3px);
        }
        .pt-card--featured {
          border-color: rgba(99, 102, 241, 0.35);
          box-shadow: var(--shadow-lg);
          transform: translateY(-6px);
        }
        .pt-card--featured::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 4px;
          background: var(--gradient-primary);
          border-radius: 22px 22px 0 0;
        }

        /* Badge */
        .pt-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 9999px;
          font-size: 0.76rem;
          font-weight: 700;
          background: var(--gradient-primary);
          color: white;
          width: fit-content;
        }
        .pt-badge--green {
          background: linear-gradient(135deg, #059669, #0ea5e9);
        }

        .pt-card-top {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pt-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }
        .pt-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pt-price {
          font-size: 1.9rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }
        .pt-per-month {
          font-size: 0.82rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .pt-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .pt-chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 0.76rem;
          font-weight: 700;
        }
        .pt-chip--duration {
          background: rgba(99, 102, 241, 0.08);
          color: var(--primary);
        }
        .pt-chip--saving {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }

        /* Feature list */
        .pt-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 9px;
          flex: 1;
        }
        .pt-features li {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          font-size: 0.86rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .pt-features li svg {
          color: #10b981;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .pt-cta {
          width: 100%;
          justify-content: center;
          font-size: 0.88rem;
        }
        .pt-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin: 0;
        }
        .pt-footer-note {
          text-align: center;
          font-size: 0.82rem;
          color: var(--text-muted);
          margin-top: 28px;
        }

        /* ── Credits tab ── */
        .cr-info-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 22px;
          border-radius: 18px;
          background: rgba(245, 158, 11, 0.07);
          border: 1px solid rgba(245, 158, 11, 0.2);
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .cr-info-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .cr-info-left strong {
          display: block;
          font-size: 0.95rem;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .cr-info-left span {
          font-size: 0.84rem;
          color: var(--text-secondary);
        }
        .cr-info-note {
          font-size: 0.8rem;
          font-weight: 700;
          color: #059669;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 4px 12px;
          border-radius: 9999px;
          white-space: nowrap;
        }

        .cr-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .cr-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
        }
        .cr-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .cr-card--custom {
          border-style: dashed;
          grid-column: span 3;
        }
        .cr-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .cr-credits {
          font-size: 1.55rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }
        .cr-credits small {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .cr-bonus {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .cr-amount {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--primary);
          margin: 0;
        }
        .cr-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
          flex: 1;
        }
        .cr-btn {
          width: 100%;
          justify-content: center;
          font-size: 0.86rem;
        }
        .cr-custom-form {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }

        /* Usage table */
        .cr-usage {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }
        .cr-usage-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 18px;
        }
        .cr-usage-title svg { color: var(--primary); }
        .cr-usage-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .cr-usage-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.04);
          border: 1px solid rgba(99, 102, 241, 0.08);
        }
        .cr-usage-label {
          font-size: 0.86rem;
          color: var(--text-secondary);
        }
        .cr-usage-cost {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--primary);
          white-space: nowrap;
        }
        .cr-usage-notes {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cr-note-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.83rem;
          line-height: 1.65;
        }
        .cr-note-item p {
          margin: 0;
          color: var(--text-secondary);
        }
        .cr-note-item strong {
          color: var(--text-primary);
        }
        .cr-note-dot {
          flex-shrink: 0;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 5px;
        }
        .cr-note-item--blue {
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.12);
        }
        .cr-note-item--blue .cr-note-dot { background: #6366f1; }
        .cr-note-item--amber {
          background: rgba(245, 158, 11, 0.05);
          border: 1px solid rgba(245, 158, 11, 0.14);
        }
        .cr-note-item--amber .cr-note-dot { background: #f59e0b; }
        .cr-note-item--green {
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.14);
        }
        .cr-note-item--green .cr-note-dot { background: #10b981; }

        /* ── Checkout modal ── */
        .co-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 80;
        }
        .co-modal {
          width: min(100%, 540px);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.3);
          display: grid;
          gap: 18px;
        }
        .co-head {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .co-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: rgba(99, 102, 241, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .co-kicker {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .co-title {
          font-size: 1.2rem;
          font-weight: 800;
        }
        .co-summary {
          display: grid;
          gap: 12px;
          padding: 16px;
          border-radius: 16px;
          background: rgba(99, 102, 241, 0.04);
          border: 1px solid rgba(99, 102, 241, 0.1);
        }
        .co-summary > div {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }
        .co-label {
          font-size: 0.82rem;
          color: var(--text-muted);
        }
        .co-summary strong {
          font-size: 0.95rem;
          color: var(--text-primary);
        }
        .co-transfer {
          border-radius: 16px;
          border: 1px solid var(--border);
          background: var(--bg);
          padding: 14px;
          display: grid;
          gap: 10px;
        }
        .co-transfer-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .co-transfer-head span {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .co-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: none;
          background: transparent;
          color: var(--primary);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .co-transfer code {
          display: block;
          padding: 12px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.04);
          color: var(--text-primary);
          font-size: 0.88rem;
          word-break: break-word;
          line-height: 1.6;
        }
        .co-note {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.12);
          font-size: 0.86rem;
        }
        .co-note strong { display: block; margin-bottom: 4px; }
        .co-note p { color: var(--text-secondary); margin: 0; line-height: 1.6; }
        .co-note a { color: var(--primary); text-decoration: none; font-weight: 600; }
        .co-actions { display: grid; gap: 8px; }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .pt-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .pt-card--featured {
            transform: none;
          }
        }
        @media (max-width: 860px) {
          .cr-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .cr-card--custom {
            grid-column: span 2;
          }
          .cr-usage-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .pt-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .cr-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .cr-card--custom {
            grid-column: span 1;
          }
          .cr-custom-form {
            grid-template-columns: 1fr;
          }
          .ps-tab {
            padding: 9px 16px;
            font-size: 0.85rem;
          }
          .co-modal {
            padding: 20px;
            border-radius: 22px;
          }
        }
      `}</style>
    </section>
  );
}
