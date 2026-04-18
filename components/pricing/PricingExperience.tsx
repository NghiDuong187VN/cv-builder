'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CircleDollarSign, Copy, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import CreditPackCard from '@/components/pricing/CreditPackCard';
import PlanCard from '@/components/pricing/PlanCard';
import PricingTabs, { type PricingTab } from '@/components/pricing/PricingTabs';
import styles from '@/components/pricing/PricingExperience.module.css';
import {
  CREDIT_RATE_VND,
  CREDIT_USAGE_TABLE,
  MIN_CUSTOM_TOPUP,
  PREMIUM_PLANS,
  TOP_UP_PACKAGES,
} from '@/lib/billing';
import { useAuth } from '@/hooks/useAuth';
import { SUPPORT_INFO } from '@/lib/creator';
import { CREDIT_EXPLAINERS, PREMIUM_FEATURE_HIGHLIGHTS } from '@/components/pricing/pricingData';
import { formatCurrency } from '@/components/pricing/utils';

type CheckoutItem = {
  type: 'subscription' | 'credit';
  id: string;
  name: string;
  amount: number;
  credits?: number;
};

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
      toast.error('Không thể sao chép, vui lòng copy thủ công.');
    }
  };

  const openMail = (subject: string, lines: string[]) => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:${SUPPORT_INFO.email}?subject=${encodedSubject}&body=${encodedBody}`;
  };

  return (
    <div className="co-backdrop" onClick={onClose}>
      <motion.div
        className="co-modal"
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ duration: 0.18 }}
        onClick={event => event.stopPropagation()}
      >
        <div className="co-head">
          <div className="co-icon">
            <CircleDollarSign size={21} color="#6366f1" />
          </div>
          <div>
            <p className="co-kicker">Thanh toán thủ công</p>
            <h3 className="co-title">Xác nhận gói bạn đã chọn</h3>
          </div>
        </div>

        <div className="co-summary">
          <div>
            <span className="co-label">Tên gói</span>
            <strong>{item.name}</strong>
          </div>
          <div>
            <span className="co-label">Số tiền</span>
            <strong>{formatCurrency(item.amount)}</strong>
          </div>
          {item.credits ? (
            <div>
              <span className="co-label">Credits nhận được</span>
              <strong>{item.credits} credits</strong>
            </div>
          ) : null}
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
            <strong>Sau khi chuyển khoản, vui lòng gửi ảnh xác nhận qua email hỗ trợ.</strong>
            <p>
              {SUPPORT_INFO.email}
              {SUPPORT_INFO.phone ? ` · ${SUPPORT_INFO.phone}` : ''}
            </p>
          </div>
        </div>

        <div className="co-actions">
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() =>
              openMail(`Xác nhận thanh toán ${item.name}`, [
                'Chào CVFlow,',
                '',
                `Tôi đã thanh toán cho: ${item.name}`,
                `Email tài khoản: ${userEmail}`,
                `Số tiền: ${formatCurrency(item.amount)}`,
                `Nội dung chuyển khoản: ${transferContent}`,
                '',
                'Tôi đã đính kèm ảnh xác nhận thanh toán.',
              ])
            }
          >
            Tôi đã thanh toán
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() =>
              openMail('Liên hệ hỗ trợ thanh toán CVFlow', [
                'Chào CVFlow,',
                '',
                `Tôi cần hỗ trợ thanh toán cho: ${item.name}`,
                `Email tài khoản: ${userEmail}`,
              ])
            }
          >
            Liên hệ hỗ trợ
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </motion.div>

      <style jsx>{`
        .co-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.62);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          z-index: 80;
        }

        .co-modal {
          width: min(100%, 540px);
          border: 1px solid var(--border);
          border-radius: 24px;
          background: var(--bg-card);
          box-shadow: var(--shadow-xl);
          padding: 22px;
          display: grid;
          gap: 14px;
        }

        .co-head {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .co-icon {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          background: rgba(99, 102, 241, 0.12);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .co-kicker {
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .co-title {
          font-size: 1.1rem;
          font-weight: 800;
        }

        .co-summary {
          border-radius: 14px;
          border: 1px solid var(--border);
          background: rgba(99, 102, 241, 0.04);
          padding: 14px;
          display: grid;
          gap: 8px;
        }

        .co-summary > div {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .co-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .co-transfer {
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--bg);
          padding: 12px;
          display: grid;
          gap: 8px;
        }

        .co-transfer-head {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: center;
        }

        .co-transfer-head span {
          font-size: 0.83rem;
          font-weight: 700;
        }

        .co-copy-btn {
          border: none;
          background: transparent;
          color: var(--primary);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }

        .co-transfer code {
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.05);
          padding: 9px;
          font-size: 0.84rem;
          line-height: 1.5;
          word-break: break-word;
        }

        .co-note {
          border-radius: 14px;
          border: 1px solid rgba(99, 102, 241, 0.18);
          background: rgba(99, 102, 241, 0.08);
          padding: 12px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-size: 0.82rem;
        }

        .co-note p {
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .co-actions {
          display: grid;
          gap: 7px;
        }

        @media (max-width: 640px) {
          .co-modal {
            padding: 18px;
          }
        }
      `}</style>
    </div>
  );
}

export default function PricingExperience() {
  const [activeTab, setActiveTab] = useState<PricingTab>('premium');
  const [customAmount, setCustomAmount] = useState('');
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const router = useRouter();
  const { firebaseUser, user, loading } = useAuth();

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
    const pack = TOP_UP_PACKAGES.find(item => item.id === packageId);
    if (!pack) return;
    openCheckout({
      type: 'credit',
      id: pack.id,
      name: `Nạp ${pack.credits} credits`,
      amount: pack.amount,
      credits: pack.credits,
    });
  };

  const handleCustomTopUp = () => {
    const normalized = Number(customAmount.replace(/[^\d]/g, ''));

    if (!normalized || normalized < MIN_CUSTOM_TOPUP) {
      toast.error(`Vui lòng nhập từ ${formatCurrency(MIN_CUSTOM_TOPUP)} trở lên.`);
      return;
    }

    if (normalized % CREDIT_RATE_VND !== 0) {
      toast.error(`Số tiền cần chia hết cho ${formatCurrency(CREDIT_RATE_VND)}.`);
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

  return (
    <section className={styles.section} id="pricing-decision">
      <div className="container">
        <div className={styles.sectionHead}>
          <h2>Chọn gói phù hợp trong 10 giây</h2>
          <p>Ưu tiên hiển thị lựa chọn mua trước, rõ ràng giữa Premium và Credits.</p>
        </div>

        <div className={styles.decisionTop}>
          <aside className={styles.freeMiniCard}>
            <div className={styles.freeMiniHeader}>
              <h3>Free</h3>
              <span className={styles.freeBadge}>0đ</span>
            </div>
            <p>Bắt đầu miễn phí, phù hợp để tạo CV đầu tiên trước khi nâng cấp.</p>
            <ul className={styles.freeMiniList}>
              <li>
                <Check size={14} color="#047857" />
                Tối đa 3 CV
              </li>
              <li>
                <Check size={14} color="#047857" />
                Xuất PDF cơ bản
              </li>
              <li>
                <Check size={14} color="#047857" />
                AI Summary 3 lần/ngày
              </li>
            </ul>
            <a href="/auth" className={`btn btn-secondary ${styles.fullButton}`} style={{ marginTop: 12 }}>
              Bắt đầu miễn phí
            </a>
          </aside>

          <div className={styles.choiceWrap}>
            <p className={styles.choiceNote}>
              Premium dành cho nhu cầu tối ưu toàn diện. Credits dành cho nhu cầu dùng theo lượt.
            </p>
            <PricingTabs activeTab={activeTab} onChange={setActiveTab} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'premium' ? (
              <>
                <div className={styles.premiumGrid}>
                  {PREMIUM_PLANS.map(plan => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isLoading={loading}
                      onCheckout={handlePremiumCheckout}
                      features={PREMIUM_FEATURE_HIGHLIGHTS}
                    />
                  ))}
                </div>
                <p className={styles.trustNote}>
                  Thanh toán thủ công an toàn · Hỗ trợ qua email {SUPPORT_INFO.email}
                </p>
              </>
            ) : (
              <>
                <div className={styles.creditsHeader}>
                  <div>
                    <p className={styles.creditsHeaderTitle}>1.000đ = 1 credit</p>
                    <p className={styles.creditsHeaderSub}>Nạp theo nhu cầu, không cần đăng ký gói tháng.</p>
                  </div>
                  <span className={styles.freeBadge}>Credits không hết hạn</span>
                </div>

                <div className={styles.creditsGrid}>
                  {TOP_UP_PACKAGES.map(pack => (
                    <CreditPackCard
                      key={pack.id}
                      pack={pack}
                      isLoading={loading}
                      onCheckout={handleTopUpCheckout}
                    />
                  ))}

                  <article className={styles.creditCard}>
                    <h3>Tùy chọn</h3>
                    <p>Nhập số tiền muốn nạp (tối thiểu {formatCurrency(MIN_CUSTOM_TOPUP)}).</p>
                    <div className={styles.creditCustomGrid}>
                      <input
                        type="number"
                        className="input"
                        min={MIN_CUSTOM_TOPUP}
                        step={CREDIT_RATE_VND}
                        placeholder="Ví dụ: 40000"
                        value={customAmount}
                        onChange={event => setCustomAmount(event.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleCustomTopUp}
                        disabled={loading}
                      >
                        Nạp
                      </button>
                    </div>
                  </article>
                </div>

                <div className={styles.creditInfoGrid}>
                  {CREDIT_EXPLAINERS.map(explainer => (
                    <article key={explainer.title} className={styles.creditInfoCard}>
                      <h3>{explainer.title}</h3>
                      <p>{explainer.body}</p>
                    </article>
                  ))}
                </div>

                <div className={`${styles.creditInfoCard} ${styles.usageBlock}`}>
                  <h3>Credits dùng để làm gì</h3>
                  <div className={styles.usageGrid}>
                    {CREDIT_USAGE_TABLE.map(item => (
                      <article key={item.label} className={styles.usageItem}>
                        <h4>{item.label}</h4>
                        <p className={styles.usageCost}>{item.credits} credits/lần</p>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {checkoutItem ? (
          <CheckoutModal
            item={checkoutItem}
            userEmail={userEmail}
            onClose={() => setCheckoutItem(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
