'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSellerProfile } from '@/lib/marketplace.firestore';
import { applyAsSeller } from '@/lib/marketplace.api';
import { getIdToken } from 'firebase/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { SellerProfile } from '@/lib/marketplace.types';

export default function SellerApplyPage() {
  const { user, firebaseUser, loading } = useAuth();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ displayName: '', bio: '', website: '', portfolio: '' });

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) { setCheckingStatus(false); return; }
    (async () => {
      const profile = await getSellerProfile(firebaseUser.uid);
      setSeller(profile);
      if (profile) {
        setForm({
          displayName: profile.displayName,
          bio: profile.bio,
          website: profile.website ?? '',
          portfolio: profile.portfolio ?? '',
        });
      } else if (user) {
        setForm((p) => ({ ...p, displayName: user.displayName ?? '' }));
      }
      setCheckingStatus(false);
    })();
  }, [firebaseUser, loading, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!form.displayName.trim() || !form.bio.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getIdToken(firebaseUser);
      const res = await applyAsSeller(form, token);
      if (res.success) {
        toast.success('Đơn đăng ký seller đã được gửi thành công!');
        setSeller({ ...form, uid: firebaseUser.uid, status: 'pending', totalSalesCount: 0, totalEarningsCredits: 0, pendingEarningsCredits: 0, availableEarningsCredits: 0, paidOutEarningsCredits: 0, averageRating: 0, reviewCount: 0, createdAt: new Date(), updatedAt: new Date() });
      } else {
        toast.error(res.error ?? 'Có lỗi xảy ra');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || checkingStatus) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: '480px', height: '400px', borderRadius: '20px' }} />
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <Store size={48} color="var(--primary)" />
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem' }}>Đăng nhập để đăng ký bán template</h1>
        <Link href="/auth" className="btn btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  // Approved seller
  if (seller?.status === 'approved') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <CheckCircle size={56} color="#059669" />
        <h1 style={{ fontWeight: 800, fontSize: '1.6rem', color: '#059669' }}>Bạn đã là Seller!</h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
          Tài khoản seller của bạn đã được duyệt. Bắt đầu upload template để kiếm tiền ngay hôm nay.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/seller/dashboard" className="btn btn-primary">Dashboard Seller</Link>
          <Link href="/seller/templates/new" className="btn btn-secondary">Upload template mới</Link>
        </div>
      </div>
    );
  }

  // Pending
  if (seller?.status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <Clock size={56} color="#f59e0b" />
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#d97706' }}>Đang chờ duyệt</h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
          Đơn đăng ký seller của bạn đang được admin xem xét. Thường mất 1-2 ngày làm việc.
        </p>
        <Link href="/" className="btn btn-secondary">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '60px 0 80px' }}>
      <div className="container" style={{ maxWidth: '640px' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 16px',
              background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
            }}>
              <Store size={28} color="white" />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Đăng ký bán template</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Chia sẻ thiết kế của bạn và kiếm thu nhập từ cộng đồng CVFlow. Platform thu 15% commission.
            </p>
          </div>

          {/* Rejected notice */}
          {seller?.status === 'rejected' && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '12px', marginBottom: '24px',
            }}>
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.9rem' }}>Đơn trước bị từ chối</p>
                <p style={{ fontSize: '0.82rem', color: '#ef4444', marginTop: '4px' }}>
                  {seller.rejectionReason ?? 'Không đáp ứng yêu cầu.'}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Bạn có thể nộp lại đơn bên dưới.</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '8px' }}>
                Tên hiển thị <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                className="input"
                required
                placeholder="VD: Studio Design Co."
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '8px' }}>
                Giới thiệu bản thân <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="input"
                required
                rows={4}
                placeholder="Mô tả kinh nghiệm thiết kế, chuyên môn và loại template bạn sẽ tạo..."
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '8px' }}>Website</label>
                <input className="input" placeholder="https://yoursite.com" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '8px' }}>Portfolio</label>
                <input className="input" placeholder="https://behance.net/..." value={form.portfolio} onChange={(e) => setForm((p) => ({ ...p, portfolio: e.target.value }))} />
              </div>
            </div>

            {/* Terms notice */}
            <div style={{
              padding: '14px 16px', background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px',
              fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6,
            }}>
              ⚡ Bằng cách đăng ký, bạn đồng ý rằng mọi template bán trên CVFlow phải là tác phẩm gốc của bạn.
              Platform thu <strong>15% commission</strong> trên mỗi giao dịch. Buyer chỉ mua quyền dùng trong CVFlow, không phải source code.
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary btn-lg" style={{ marginTop: '4px' }}>
              {submitting ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
