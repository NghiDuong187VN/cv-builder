'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  CircleDollarSign,
  Coins,
  Copy,
  Crown,
  Mail,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  FREE_PLAN_FEATURES,
  PLAN_GUIDE_OPTIONS,
  PREMIUM_PLAN_FEATURES,
  PREMIUM_PLANS,
  TOP_UP_PACKAGES,
} from '@/lib/billing';
import { SUPPORT_INFO } from '@/lib/creator';

type CheckoutItem = {
  type: 'subscription' | 'credit';
  id: string;
  name: string;
  amount: number;
  credits?: number;
};

const premiumHighlights = [
  'Không giới hạn số CV trong tài khoản',
  'Mở khóa toàn bộ template Premium và xuất bản CV sạch hơn',
  'Tối ưu nội dung theo từng vị trí ứng tuyển bằng AI',
];

function formatCurrency(amount: number) {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export default function PricingSection() {
  const router = useRouter();
  const { firebaseUser, user, loading } = useAuth();
  const [customAmount, setCustomAmount] = useState('');
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);

  const userEmail = firebaseUser?.email || user?.email || 'email-cua-ban';

  const ensureAuthenticated = () => {
    if (loading) return false;

    if (!firebaseUser) {
      router.push('/auth');
      return false;
    }

    return true;
  };

  const openCheckout = (item: CheckoutItem) => {
    if (!ensureAuthenticated()) return;
    setCheckoutItem(item);
  };

  const handlePremiumCheckout = (planId: string) => {
    const plan = PREMIUM_PLANS.find(item => item.id === planId);
    if (!plan) return;

    openCheckout({
      type: 'subscription',
      id: plan.id,
      name: `Premium ${plan.name}`,
      amount: plan.price,
    });
  };

  const handleTopUpCheckout = (packageId: string) => {
    const selectedPackage = TOP_UP_PACKAGES.find(item => item.id === packageId);
    if (!selectedPackage) return;

    openCheckout({
      type: 'credit',
      id: selectedPackage.id,
      name: `${selectedPackage.label} lượt tạo CV Premium`,
      amount: selectedPackage.amount,
      credits: selectedPackage.credits,
    });
  };

  const handleCustomTopUp = () => {
    const normalizedAmount = Number(customAmount.replace(/[^\d]/g, ''));

    if (!normalizedAmount || normalizedAmount < 1000) {
      toast.error('Vui lòng nhập số tiền từ 1.000đ trở lên.');
      return;
    }

    if (normalizedAmount % 1000 !== 0) {
      toast.error('Số tiền nạp cần chia hết cho 1.000đ để quy đổi đúng số lượt.');
      return;
    }

    openCheckout({
      type: 'credit',
      id: `custom_${normalizedAmount}`,
      name: `Nạp ${normalizedAmount / 1000} lượt tạo CV Premium`,
      amount: normalizedAmount,
      credits: normalizedAmount / 1000,
    });
  };

  const transferContent = useMemo(() => {
    if (!checkoutItem) return '';
    return `CVFLOW + ${userEmail} + ${checkoutItem.name}`;
  }, [checkoutItem, userEmail]);

  const handleCopyTransferContent = async () => {
    if (!transferContent) return;

    try {
      await navigator.clipboard.writeText(transferContent);
      toast.success('Đã sao chép nội dung chuyển khoản.');
    } catch (error) {
      console.error(error);
      toast.error('Không thể sao chép, bạn vui lòng copy thủ công.');
    }
  };

  const handlePaymentConfirmed = () => {
    if (!checkoutItem) return;

    const subject = encodeURIComponent(`Xác nhận thanh toán ${checkoutItem.name}`);
    const body = encodeURIComponent([
      'Chào CVFlow,',
      '',
      `Tôi đã thanh toán cho gói: ${checkoutItem.name}`,
      `Email tài khoản: ${userEmail}`,
      `Số tiền: ${formatCurrency(checkoutItem.amount)}`,
      `Nội dung chuyển khoản: ${transferContent}`,
      '',
      'Tôi sẽ đính kèm ảnh xác nhận thanh toán trong email này.',
    ].join('\n'));

    window.location.href = `mailto:${SUPPORT_INFO.email}?subject=${subject}&body=${body}`;
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Liên hệ hỗ trợ thanh toán CVFlow');
    const body = encodeURIComponent([
      'Chào CVFlow,',
      '',
      `Tôi cần hỗ trợ thanh toán cho: ${checkoutItem?.name || 'gói dịch vụ'}`,
      `Email tài khoản: ${userEmail}`,
    ].join('\n'));

    window.location.href = `mailto:${SUPPORT_INFO.email}?subject=${subject}&body=${body}`;
  };

  return (
    <section className="section" id="pricing" style={{ background: 'rgba(99,102,241,0.025)', position: 'relative' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '40px' }}
        >
          <div className="pricing-eyebrow">
            <ShieldCheck size={14} color="#0f766e" />
            <span>Rõ ràng, dễ chọn, đúng nhu cầu</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '14px' }}>
            Chọn cách dùng CVFlow <span className="gradient-text">phù hợp nhất</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '760px', margin: '0 auto', lineHeight: 1.75 }}>
            Bạn có thể bắt đầu miễn phí, mua lượt khi chỉ cần tạo một vài CV Premium, hoặc chọn Premium để tối ưu hồ sơ liên tục cho nhiều vị trí ứng tuyển.
          </p>
        </motion.div>

        <div className="pricing-overview-grid">
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overview-card"
          >
            <div className="card-icon card-icon-free">
              <Wallet size={18} />
            </div>
            <div className="plan-pill">Free Forever</div>
            <h3>0đ mãi mãi</h3>
            <p className="overview-description">
              Dành cho người muốn bắt đầu nhanh với CV cơ bản, vẫn có đủ công cụ để tạo hồ sơ và chia sẻ ngay.
            </p>
            <ul className="feature-list">
              {FREE_PLAN_FEATURES.map(feature => (
                <li key={feature}>
                  <Check size={16} color="#10b981" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => router.push(firebaseUser ? '/dashboard' : '/auth')}
              disabled={loading}
            >
              Bắt đầu miễn phí
            </button>
            <p className="fit-note">Phù hợp nếu bạn chỉ cần CV cơ bản để bắt đầu ứng tuyển.</p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overview-card overview-card-premium"
          >
            <div className="card-icon card-icon-premium">
              <Crown size={18} />
            </div>
            <div className="card-badge">Premium linh hoạt</div>
            <div className="premium-heading-row">
              <div>
                <h3 style={{ marginBottom: '8px' }}>Từ 49.000đ</h3>
                <p className="overview-description" style={{ marginBottom: 0 }}>
                  Mở khóa bộ công cụ Premium đầy đủ nếu bạn đang nộp nhiều CV và muốn tối ưu hồ sơ thật nhanh.
                </p>
              </div>
              <div className="premium-highlight-box">
                <span>4 chu kỳ</span>
                <strong>1, 3, 6, 12 tháng</strong>
              </div>
            </div>
            <ul className="feature-list">
              {PREMIUM_PLAN_FEATURES.map(feature => (
                <li key={feature}>
                  <Check size={16} color="#10b981" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mini-highlights">
              {premiumHighlights.map(item => (
                <div key={item} className="mini-highlight-item">
                  <Sparkles size={14} color="#7c3aed" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => document.getElementById('premium-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Xem gói Premium
            </button>
            <p className="fit-note">Phù hợp nếu bạn đang tối ưu nhiều hồ sơ cho nhiều cơ hội khác nhau.</p>
          </motion.article>
        </div>

        <motion.div
          id="premium-plans"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginTop: '56px' }}
        >
          <div className="section-head-row">
            <div>
              <p className="section-kicker">Premium Plans</p>
              <h3 className="section-title">Chọn gói Premium theo thời gian bạn cần</h3>
            </div>
            <p className="section-subtitle">
              Gói 3 tháng được làm nổi bật cho đa số người dùng đang tìm việc. Gói 1 năm có chi phí trung bình mỗi tháng tiết kiệm nhất.
            </p>
          </div>

          <div className="premium-grid">
            {PREMIUM_PLANS.map(plan => {
              const monthlySavings = plan.price < 49000 * Math.round(plan.durationDays / 30)
                ? 49000 * Math.round(plan.durationDays / 30) - plan.price
                : 0;

              return (
                <article
                  key={plan.id}
                  className={`premium-card ${plan.badge === 'Phổ biến nhất' ? 'premium-card-featured' : ''}`}
                >
                  {plan.badge && (
                    <div className={`plan-badge ${plan.badge === 'Tiết kiệm nhất' ? 'plan-badge-success' : ''}`}>
                      {plan.badge}
                    </div>
                  )}
                  <div className="premium-card-header">
                    <div>
                      <p className="plan-name">{plan.name}</p>
                      <h4>{formatCurrency(plan.price)}</h4>
                    </div>
                    <div className="avg-price-box">
                      <span>Trung bình</span>
                      <strong>{formatCurrency(plan.avgPerMonth)}/tháng</strong>
                    </div>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                  <div className="plan-meta-row">
                    <span className="plan-duration">Thời hạn: {plan.duration}</span>
                    {monthlySavings > 0 && <span className="plan-saving">Tiết kiệm {formatCurrency(monthlySavings)}</span>}
                  </div>
                  <button
                    type="button"
                    className={plan.badge === 'Phổ biến nhất' ? 'btn btn-primary' : 'btn btn-outline'}
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={loading}
                    onClick={() => handlePremiumCheckout(plan.id)}
                  >
                    {plan.ctaLabel}
                  </button>
                </article>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginTop: '56px' }}
        >
          <div className="topup-shell">
            <div className="section-head-row" style={{ marginBottom: '24px' }}>
              <div>
                <p className="section-kicker">Mua lượt tạo CV Premium</p>
                <h3 className="section-title">Nạp đúng số lượt bạn cần</h3>
              </div>
              <p className="section-subtitle">
                Quy tắc quy đổi rõ ràng: <strong>1.000đ = 1 lượt</strong>. Một lượt tương ứng với một lần tạo hoặc xuất CV Premium hoàn chỉnh.
              </p>
            </div>

            <div className="topup-info-bar">
              <div>
                <strong>1 lượt = 1 lần tạo/xuất CV Premium hoàn chỉnh.</strong>
                <span>Rất phù hợp khi bạn chỉ cần 1-2 CV Premium mà không muốn đăng ký gói tháng.</span>
              </div>
              <div className="topup-info-chip">
                <Coins size={16} color="#f59e0b" />
                <span>1.000đ = 1 lượt</span>
              </div>
            </div>

            <div className="topup-grid">
              {TOP_UP_PACKAGES.map(item => (
                <article key={item.id} className="topup-card">
                  <div className="topup-card-top">
                    <span className="topup-credits">{item.credits} lượt</span>
                    <span className="topup-amount">{formatCurrency(item.amount)}</span>
                  </div>
                  <p className="topup-description">{item.description}</p>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={loading}
                    onClick={() => handleTopUpCheckout(item.id)}
                  >
                    {item.ctaLabel}
                  </button>
                </article>
              ))}

              <article className="topup-card topup-card-custom">
                <div className="topup-card-top">
                  <span className="topup-credits">Tùy chọn số tiền nạp</span>
                  <span className="topup-amount">Tự quy đổi</span>
                </div>
                <p className="topup-description">
                  Nhập đúng số tiền bạn muốn nạp, hệ thống sẽ quy đổi theo tỷ lệ 1.000đ = 1 lượt.
                </p>
                <div className="custom-topup-form">
                  <input
                    type="number"
                    className="input"
                    min={1000}
                    step={1000}
                    placeholder="Ví dụ: 25000"
                    value={customAmount}
                    onChange={event => setCustomAmount(event.target.value)}
                  />
                  <button type="button" className="btn btn-primary" disabled={loading} onClick={handleCustomTopUp}>
                    Mua lượt tạo CV
                  </button>
                </div>
              </article>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginTop: '56px' }}
        >
          <div className="section-head-row" style={{ marginBottom: '24px' }}>
            <div>
              <p className="section-kicker">Bạn nên chọn gói nào?</p>
              <h3 className="section-title">Một vài gợi ý nhanh để dễ quyết định</h3>
            </div>
            <p className="section-subtitle">
              Không cần mua quá nhiều ngay từ đầu. Hãy chọn đúng theo nhịp ứng tuyển thực tế của bạn.
            </p>
          </div>

          <div className="guide-grid">
            {PLAN_GUIDE_OPTIONS.map(option => (
              <article key={option.id} className="guide-card">
                <p className="guide-situation">{option.situation}</p>
                <h4>{option.recommendation}</h4>
                <p>{option.description}</p>
              </article>
            ))}
          </div>
        </motion.div>
      </div>

      {checkoutItem && (
        <div className="checkout-backdrop" onClick={() => setCheckoutItem(null)}>
          <div className="checkout-modal" onClick={event => event.stopPropagation()}>
            <div className="checkout-modal-head">
              <div className="checkout-icon">
                <CircleDollarSign size={22} color="#6366f1" />
              </div>
              <div>
                <p className="section-kicker" style={{ marginBottom: '6px' }}>Thanh toán thủ công</p>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Xác nhận gói bạn đã chọn</h3>
              </div>
            </div>

            <div className="checkout-summary">
              <div>
                <span className="checkout-label">Tên gói</span>
                <strong>{checkoutItem.name}</strong>
              </div>
              <div>
                <span className="checkout-label">Giá tiền</span>
                <strong>{formatCurrency(checkoutItem.amount)}</strong>
              </div>
              {checkoutItem.credits ? (
                <div>
                  <span className="checkout-label">Số lượt quy đổi</span>
                  <strong>{checkoutItem.credits} lượt</strong>
                </div>
              ) : null}
            </div>

            <div className="transfer-box">
              <div className="transfer-box-head">
                <span>Nội dung chuyển khoản gợi ý</span>
                <button type="button" className="copy-button" onClick={handleCopyTransferContent}>
                  <Copy size={14} /> Sao chép
                </button>
              </div>
              <code>{transferContent}</code>
            </div>

            <div className="manual-note">
              <Mail size={16} color="#6366f1" />
              <div>
                <strong>Sau khi thanh toán, vui lòng gửi ảnh xác nhận qua email hỗ trợ.</strong>
                <p>
                  Email hỗ trợ: <a href={`mailto:${SUPPORT_INFO.email}`}>{SUPPORT_INFO.email}</a>
                  {SUPPORT_INFO.phone ? <> | {SUPPORT_INFO.phone}</> : null}
                </p>
              </div>
            </div>

            <div className="checkout-actions">
              <button type="button" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handlePaymentConfirmed}>
                Tôi đã thanh toán
              </button>
              <button type="button" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={handleContactSupport}>
                Liên hệ hỗ trợ
              </button>
              <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCheckoutItem(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pricing-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          background: rgba(13, 148, 136, 0.08);
          border: 1px solid rgba(13, 148, 136, 0.18);
          color: #0f766e;
          font-size: 0.82rem;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .pricing-overview-grid,
        .premium-grid,
        .topup-grid,
        .guide-grid {
          display: grid;
          gap: 20px;
        }

        .pricing-overview-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .overview-card,
        .premium-card,
        .topup-card,
        .guide-card,
        .topup-shell {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px;
          box-shadow: var(--shadow-sm);
        }

        .overview-card {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .overview-card-premium {
          border-color: rgba(99, 102, 241, 0.24);
          box-shadow: 0 18px 45px rgba(99, 102, 241, 0.12);
          position: relative;
          overflow: hidden;
        }

        .overview-card-premium::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 5px;
          background: linear-gradient(135deg, #6366f1, #ec4899);
        }

        .card-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-icon-free {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }

        .card-icon-premium {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }

        .plan-pill,
        .card-badge,
        .plan-badge,
        .section-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .plan-pill,
        .section-kicker {
          color: var(--primary);
        }

        .card-badge,
        .plan-badge {
          padding: 6px 12px;
          border-radius: 999px;
          color: white;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          width: fit-content;
        }

        .plan-badge-success {
          background: linear-gradient(135deg, #059669, #0ea5e9);
        }

        .overview-card h3,
        .premium-card h4,
        .guide-card h4 {
          font-size: 1.6rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 0;
        }

        .overview-description,
        .plan-description,
        .topup-description,
        .guide-card p,
        .section-subtitle {
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 10px;
          flex: 1;
        }

        .feature-list li,
        .mini-highlight-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: var(--text-secondary);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .premium-heading-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .premium-highlight-box,
        .avg-price-box,
        .topup-info-chip {
          border-radius: 16px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.14);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 140px;
          text-align: right;
        }

        .premium-highlight-box span,
        .avg-price-box span,
        .checkout-label {
          color: var(--text-muted);
          font-size: 0.78rem;
        }

        .premium-highlight-box strong,
        .avg-price-box strong,
        .checkout-summary strong {
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .mini-highlights {
          display: grid;
          gap: 10px;
          padding: 16px;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 18px;
        }

        .fit-note {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .section-head-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
          gap: 20px;
          align-items: end;
          margin-bottom: 20px;
        }

        .section-title {
          margin: 8px 0 0;
          font-size: clamp(1.35rem, 2vw, 2rem);
          font-weight: 800;
          line-height: 1.25;
        }

        .premium-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: stretch;
        }

        .premium-card {
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: relative;
        }

        .premium-card-featured {
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 18px 45px rgba(99, 102, 241, 0.16);
          transform: translateY(-6px);
        }

        .premium-card-header,
        .topup-card-top,
        .transfer-box-head,
        .checkout-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .plan-name,
        .guide-situation,
        .topup-credits {
          margin: 0;
          color: var(--text-primary);
          font-size: 1rem;
          font-weight: 700;
        }

        .plan-meta-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: auto;
        }

        .plan-duration,
        .plan-saving,
        .topup-amount {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .plan-duration {
          background: rgba(99, 102, 241, 0.08);
          color: var(--primary);
        }

        .plan-saving {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }

        .topup-shell {
          padding: 28px;
        }

        .topup-info-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 20px;
          border-radius: 18px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.16);
          margin-bottom: 24px;
        }

        .topup-info-bar strong,
        .topup-info-bar span {
          display: block;
        }

        .topup-info-bar span {
          color: var(--text-secondary);
          margin-top: 6px;
        }

        .topup-info-chip {
          min-width: auto;
          flex-direction: row;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.68);
        }

        .topup-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .topup-card {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .topup-amount {
          background: rgba(99, 102, 241, 0.08);
          color: var(--primary);
        }

        .topup-card-custom {
          border-style: dashed;
          grid-column: span 3;
        }

        .custom-topup-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
        }

        .guide-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .guide-card {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .guide-situation {
          color: var(--text-muted);
          font-size: 0.88rem;
        }

        .checkout-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.58);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 80;
        }

        .checkout-modal {
          width: min(100%, 560px);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28);
          display: grid;
          gap: 20px;
        }

        .checkout-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.1);
        }

        .checkout-summary {
          display: grid;
          gap: 14px;
          padding: 18px;
          border-radius: 18px;
          background: rgba(99, 102, 241, 0.04);
          border: 1px solid rgba(99, 102, 241, 0.1);
        }

        .checkout-summary div {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: baseline;
        }

        .transfer-box {
          border-radius: 18px;
          border: 1px solid var(--border);
          background: var(--bg-base);
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .transfer-box-head span {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .transfer-box code {
          display: block;
          padding: 14px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.04);
          color: var(--text-primary);
          font-size: 0.9rem;
          line-height: 1.6;
          word-break: break-word;
        }

        .copy-button {
          border: none;
          background: transparent;
          color: var(--primary);
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .manual-note {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.12);
        }

        .manual-note strong,
        .manual-note p {
          display: block;
          margin: 0;
          line-height: 1.7;
        }

        .manual-note p {
          color: var(--text-secondary);
          margin-top: 6px;
        }

        .manual-note a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }

        .checkout-actions {
          display: grid;
          gap: 10px;
        }

        @media (max-width: 1180px) {
          .premium-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .topup-grid,
          .guide-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .topup-card-custom {
            grid-column: span 2;
          }
        }

        @media (max-width: 840px) {
          .pricing-overview-grid,
          .premium-grid,
          .topup-grid,
          .guide-grid,
          .section-head-row,
          .custom-topup-form {
            grid-template-columns: minmax(0, 1fr);
          }

          .topup-card-custom {
            grid-column: span 1;
          }

          .premium-card-featured {
            transform: none;
          }

          .premium-heading-row,
          .premium-card-header,
          .topup-card-top,
          .topup-info-bar,
          .checkout-summary div,
          .checkout-modal-head {
            flex-direction: column;
            align-items: flex-start;
          }

          .premium-highlight-box,
          .avg-price-box {
            min-width: 0;
            width: 100%;
            text-align: left;
          }
        }

        @media (max-width: 640px) {
          .overview-card,
          .premium-card,
          .topup-shell,
          .topup-card,
          .guide-card,
          .checkout-modal {
            padding: 20px;
            border-radius: 20px;
          }

          .feature-list li,
          .mini-highlight-item,
          .topup-description,
          .guide-card p {
            font-size: 0.88rem;
          }

          .topup-info-bar {
            padding: 16px;
          }
        }
      `}</style>
    </section>
  );
}
