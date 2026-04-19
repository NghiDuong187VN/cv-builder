'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Wallet, Package, Star, Plus, Eye, Clock,
  CheckCircle2, AlertCircle, XCircle, Upload, ChevronRight, Coins,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import {
  getSellerProfile,
  getTemplatesBySeller,
  getEarningsBySeller,
} from '@/lib/marketplace.firestore';
import type {
  SellerProfile,
  MarketplaceTemplate,
  SellerEarningTransaction,
} from '@/lib/marketplace.types';

// ─── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{size?: number; color?: string}> }> = {
  approved: { label: 'Đã duyệt', color: '#059669', icon: CheckCircle2 },
  pending_review: { label: 'Chờ duyệt', color: '#d97706', icon: Clock },
  rejected: { label: 'Bị từ chối', color: '#ef4444', icon: XCircle },
  draft: { label: 'Nháp', color: '#94a3b8', icon: Package },
  suspended: { label: 'Tạm dừng', color: '#ef4444', icon: AlertCircle },
};

// ─── Skeleton ───────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div style={{ minHeight: '100vh', padding: '40px 0', background: 'var(--bg)' }}>
      <div className="container">
        <div style={{ height: '60px', marginBottom: '32px' }} className="skeleton" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '40px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '96px', borderRadius: '16px' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
          <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />
          <div className="skeleton" style={{ height: '400px', borderRadius: '16px' }} />
        </div>
      </div>
    </div>
  );
}

export default function SellerDashboardPage() {
  const { firebaseUser, loading } = useAuth();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [earnings, setEarnings] = useState<SellerEarningTransaction[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) { setFetching(false); return; }
    (async () => {
      const [sp, tmpl, earn] = await Promise.all([
        getSellerProfile(firebaseUser.uid),
        getTemplatesBySeller(firebaseUser.uid),
        getEarningsBySeller(firebaseUser.uid),
      ]);
      setSeller(sp);
      setTemplates(tmpl);
      setEarnings(earn);
      setFetching(false);
    })();
  }, [firebaseUser, loading]);

  if (fetching || loading) return <DashboardSkeleton />;

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!firebaseUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg)' }}>
        <p style={{ fontSize: '3rem' }}>🔐</p>
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem' }}>Đăng nhập để xem Seller Dashboard</h1>
        <Link href="/auth" className="btn btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  // ── Pending seller ──────────────────────────────────────────────────────────
  if (!seller || seller.status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', background: 'var(--bg)', padding: '40px' }}>
        {seller ? (
          <>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={32} color="#d97706" />
            </div>
            <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#d97706' }}>Đơn đăng ký đang chờ duyệt</h1>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '440px', lineHeight: 1.6 }}>
              Admin đang xem xét hồ sơ của bạn. Thường mất 1–2 ngày làm việc.
              Bạn sẽ được thông báo qua email khi kết quả có.
            </p>
            <Link href="/" className="btn btn-secondary">Về trang chủ</Link>
          </>
        ) : (
          <>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={32} color="var(--primary)" />
            </div>
            <h1 style={{ fontWeight: 800, fontSize: '1.5rem' }}>Bạn chưa phải Seller</h1>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px', lineHeight: 1.6 }}>
              Đăng ký trở thành seller để upload template và kiếm thu nhập từ cộng đồng CVFlow.
            </p>
            <Link href="/seller/apply" className="btn btn-primary">Đăng ký bán template →</Link>
          </>
        )}
      </div>
    );
  }

  // ── Rejected seller ─────────────────────────────────────────────────────────
  if (seller.status === 'rejected') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg)', padding: '40px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <XCircle size={32} color="#ef4444" />
        </div>
        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#ef4444' }}>Đơn đăng ký bị từ chối</h1>
        {seller.rejectionReason && (
          <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', maxWidth: '480px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.88rem', color: '#ef4444' }}>{seller.rejectionReason}</p>
          </div>
        )}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Bạn có thể nộp lại đơn đăng ký.</p>
        <Link href="/seller/apply" className="btn btn-primary">Nộp lại đơn →</Link>
      </div>
    );
  }

  // ── Suspended seller ────────────────────────────────────────────────────────
  if (seller.status === 'suspended') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg)' }}>
        <AlertCircle size={48} color="#ef4444" />
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#ef4444' }}>Tài khoản seller tạm dừng</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Vui lòng liên hệ support để biết thêm thông tin.</p>
        <Link href="/support" className="btn btn-secondary">Liên hệ Support</Link>
      </div>
    );
  }

  // ── Main dashboard ──────────────────────────────────────────────────────────
  const templatesByStatus = {
    approved: templates.filter((t) => t.status === 'approved').length,
    pending: templates.filter((t) => t.status === 'pending_review').length,
    rejected: templates.filter((t) => t.status === 'rejected').length,
  };

  const statCards = [
    {
      label: 'Tổng doanh thu',
      value: seller.totalEarningsCredits,
      unit: 'credits',
      icon: Wallet,
      color: '#059669',
      bg: 'rgba(5,150,105,0.08)',
      note: `Đang chờ: ${seller.pendingEarningsCredits} cr`,
    },
    {
      label: 'Lượt bán',
      value: seller.totalSalesCount,
      unit: 'đơn',
      icon: TrendingUp,
      color: 'var(--primary)',
      bg: 'rgba(99,102,241,0.08)',
      note: earnings.length > 0 ? `${earnings.length} giao dịch` : 'Chưa có giao dịch',
    },
    {
      label: 'Templates',
      value: templates.length,
      unit: 'mẫu',
      icon: Package,
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.08)',
      note: `${templatesByStatus.approved} đã duyệt · ${templatesByStatus.pending} chờ`,
    },
    {
      label: 'Đánh giá TB',
      value: seller.averageRating > 0 ? seller.averageRating.toFixed(1) : '—',
      unit: '/ 5',
      icon: Star,
      color: '#d97706',
      bg: 'rgba(217,119,6,0.08)',
      note: `${seller.reviewCount} đánh giá`,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 0 80px' }}>
      <div className="container">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Seller Dashboard</h1>
              <span style={{ padding: '3px 10px', borderRadius: '9999px', background: 'rgba(5,150,105,0.1)', color: '#059669', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(5,150,105,0.2)' }}>
                ● Đã duyệt
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Xin chào, <strong style={{ color: 'var(--text-primary)' }}>{seller.displayName}</strong> 👋
            </p>
          </div>
          <Link href="/seller/templates/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} /> Upload template mới
          </Link>
        </motion.div>

        {/* ── Stat Cards ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={18} color={s.color} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {s.value}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px' }}>{s.unit}</span>
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{s.note}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr min(380px, 100%)', gap: '28px' }}>
          {/* Templates list */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Templates của bạn</h2>
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span style={{ color: '#059669', fontWeight: 600 }}>{templatesByStatus.approved} đã duyệt</span>
                {templatesByStatus.pending > 0 && <span style={{ color: '#d97706', fontWeight: 600 }}>· {templatesByStatus.pending} chờ</span>}
                {templatesByStatus.rejected > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>· {templatesByStatus.rejected} từ chối</span>}
              </div>
            </div>

            {templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 24px', background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Upload size={28} color="var(--primary)" />
                </div>
                <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '8px' }}>Chưa có template nào</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.6 }}>
                  Upload template đầu tiên của bạn để bắt đầu kiếm thu nhập.
                </p>
                <Link href="/seller/templates/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={15} /> Upload template đầu tiên
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {templates.map((t, i) => {
                  const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.draft;
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: '14px', padding: '14px', transition: 'var(--transition)',
                      }}
                    >
                      <div style={{ width: '56px', height: '70px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#f1f5f9', position: 'relative' }}>
                        <Image src={t.thumbnailUrl || '/placeholder-cv.png'} alt={t.name} fill style={{ objectFit: 'cover' }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px' }}>{t.shortDescription}</p>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: sc.color }}>
                            <sc.icon size={10} /> {sc.label}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {t.totalSalesCount} lượt bán
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                            <Coins size={10} /> {t.priceCredits} cr
                          </span>
                        </div>
                        {t.status === 'rejected' && t.rejectionReason && (
                          <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '4px', fontStyle: 'italic' }}>
                            Lý do: {t.rejectionReason}
                          </p>
                        )}
                      </div>

                      {t.status === 'approved' && (
                        <Link
                          href={`/marketplace/${t.slug}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 12px', borderRadius: '9px', background: 'rgba(99,102,241,0.08)', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0 }}
                        >
                          <Eye size={13} /> Xem <ChevronRight size={13} />
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Earnings panel */}
          <div>
            {/* Earnings breakdown */}
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>Thu nhập</h2>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
              {[
                { label: 'Tổng kiếm được', value: seller.totalEarningsCredits, color: '#059669', icon: '💰' },
                { label: 'Đang chờ xử lý', value: seller.pendingEarningsCredits, color: '#d97706', icon: '⏳' },
                { label: 'Khả dụng', value: seller.availableEarningsCredits, color: 'var(--primary)', icon: '✅' },
                { label: 'Đã thanh toán', value: seller.paidOutEarningsCredits, color: 'var(--text-muted)', icon: '📤' },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>{row.icon}</span>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{row.label}</p>
                  </div>
                  <p style={{ fontWeight: 800, fontSize: '0.95rem', color: row.color }}>
                    {row.value} <span style={{ fontWeight: 500, fontSize: '0.78rem' }}>cr</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Recent transactions */}
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Giao dịch gần đây
            </h3>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
              {earnings.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Wallet size={28} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>Chưa có giao dịch</p>
                  <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>Thu nhập sẽ hiện ở đây khi có người mua template.</p>
                </div>
              ) : (
                earnings.slice(0, 8).map((e, i) => (
                  <div key={e.id} style={{
                    padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: i < Math.min(earnings.length - 1, 7) ? '1px solid var(--border)' : 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        {e.templateName}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {e.status === 'pending' ? '⏳ Đang chờ xử lý' : e.status === 'available' ? '✅ Khả dụng' : e.status === 'paid' ? '💸 Đã thanh toán' : e.status}
                      </p>
                    </div>
                    <p style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem', flexShrink: 0 }}>
                      +{e.creditsAmount} cr
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
