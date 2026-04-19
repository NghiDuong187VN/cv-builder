'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, User,
  ChevronLeft, ChevronRight, ExternalLink, Store,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getPendingSellerProfiles, getAllSellerProfiles } from '@/lib/marketplace.firestore';
import { adminReviewSeller } from '@/lib/marketplace.api';
import { getIdToken } from 'firebase/auth';
import toast from 'react-hot-toast';
import type { SellerProfile } from '@/lib/marketplace.types';

type TabKey = 'pending' | 'all';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ duyệt', color: '#d97706', bg: 'rgba(245,158,11,0.1)' },
  approved: { label: 'Đã duyệt', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  rejected: { label: 'Từ chối', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  suspended: { label: 'Tạm dừng', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
};

function SellerCard({
  seller,
  isActive,
  onClick,
}: {
  seller: SellerProfile;
  isActive: boolean;
  onClick: () => void;
}) {
  const s = STATUS_STYLE[seller.status] ?? STATUS_STYLE.pending;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
        background: 'var(--bg-card)',
        border: `1.5px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: isActive ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
      }}
    >
      {/* Avatar */}
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f1f5f9', position: 'relative' }}>
        {seller.avatarUrl ? (
          <Image src={seller.avatarUrl} alt={seller.displayName} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-primary)' }}>
            <User size={22} color="white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {seller.displayName}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
          {seller.bio}
        </p>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 700, background: s.bg, color: s.color }}>
          {s.label}
        </span>
      </div>

      <ChevronRight size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
    </div>
  );
}

export default function AdminSellerReviewPage() {
  const { firebaseUser, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<TabKey>('pending');
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [allSellers, setAllSellers] = useState<SellerProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeSeller, setActiveSeller] = useState<SellerProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Load data
  useEffect(() => {
    if (loading) return;
    if (!isAdmin) { setFetching(false); return; }
    (async () => {
      const [pending, all] = await Promise.all([
        getPendingSellerProfiles(),
        getAllSellerProfiles(),
      ]);
      setSellers(pending);
      setAllSellers(all);
      setFetching(false);
    })();
  }, [isAdmin, loading]);

  const displayList = tab === 'pending' ? sellers : allSellers;

  async function handleAction(sellerId: string, action: 'approve' | 'reject') {
    if (!firebaseUser) return;
    if (action === 'reject' && !rejectReason.trim()) {
      toast.error('Nhập lý do từ chối trước');
      return;
    }
    setProcessing(true);
    try {
      const token = await getIdToken(firebaseUser);
      const res = await adminReviewSeller(
        { sellerId, action, rejectionReason: rejectReason || undefined },
        token
      );
      if (res.success) {
        const label = action === 'approve' ? 'Đã duyệt seller ✅' : 'Đã từ chối seller ❌';
        toast.success(label);

        // Update local state
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const updater = (arr: SellerProfile[]) =>
          arr.map((s) =>
            s.uid === sellerId
              ? { ...s, status: newStatus as SellerProfile['status'], rejectionReason: rejectReason || undefined }
              : s
          );
        setSellers((p) => p.filter((s) => s.uid !== sellerId)); // remove from pending tab
        setAllSellers(updater);
        setActiveSeller((p) => (p?.uid === sellerId ? { ...p, status: newStatus as SellerProfile['status'] } : p));
        setRejectReason('');
      } else {
        toast.error(res.error ?? 'Lỗi xảy ra');
      }
    } finally {
      setProcessing(false);
    }
  }

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (!isAdmin && !loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <p style={{ fontSize: '3rem' }}>🔒</p>
        <h1 style={{ fontWeight: 800 }}>Chỉ Admin mới truy cập được</h1>
        <Link href="/" className="btn btn-secondary">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Link href="/admin/marketplace" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
              <ChevronLeft size={14} /> Admin Marketplace
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Duyệt Seller Profiles</h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {sellers.length} seller đang chờ duyệt
              </p>
            </div>
            {sellers.length > 0 && (
              <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '9999px', background: '#d97706', color: 'white', fontSize: '0.78rem', fontWeight: 700 }}>
                {sellers.length} pending
              </span>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
            {([
              { key: 'pending', label: `Chờ duyệt (${sellers.length})` },
              { key: 'all', label: `Tất cả (${allSellers.length})` },
            ] as { key: TabKey; label: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setActiveSeller(null); }}
                style={{
                  padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
                  fontWeight: tab === t.key ? 700 : 500, fontSize: '0.9rem',
                  color: tab === t.key ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: `2.5px solid ${tab === t.key ? 'var(--primary)' : 'transparent'}`,
                  transition: 'all 0.15s', marginBottom: '-1px',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {fetching ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '88px', borderRadius: '14px' }} />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <CheckCircle size={48} color="#059669" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {tab === 'pending' ? 'Không có seller nào chờ duyệt 🎉' : 'Chưa có seller nào đăng ký'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: activeSeller ? '1fr min(440px, 100%)' : '1fr', gap: '24px' }}>
            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <AnimatePresence>
                {displayList.map((seller, i) => (
                  <motion.div
                    key={seller.uid}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <SellerCard
                      seller={seller}
                      isActive={activeSeller?.uid === seller.uid}
                      onClick={() => {
                        setActiveSeller(activeSeller?.uid === seller.uid ? null : seller);
                        setRejectReason('');
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Detail panel */}
            <AnimatePresence>
              {activeSeller && (
                <motion.div
                  key={activeSeller.uid}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  style={{
                    position: 'sticky', top: '20px', alignSelf: 'start',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '20px', overflow: 'hidden',
                  }}
                >
                  {/* Seller header */}
                  <div style={{ padding: '20px 20px 0', background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#f1f5f9' }}>
                        {activeSeller.avatarUrl ? (
                          <Image src={activeSeller.avatarUrl} alt={activeSeller.displayName} fill style={{ objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-primary)' }}>
                            <User size={28} color="white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>{activeSeller.displayName}</p>
                        {(() => {
                          const s = STATUS_STYLE[activeSeller.status] ?? STATUS_STYLE.pending;
                          return (
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color }}>
                              {s.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Bio */}
                    <div>
                      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Giới thiệu</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{activeSeller.bio}</p>
                    </div>

                    {/* Links */}
                    {(activeSeller.website || activeSeller.portfolio) && (
                      <div>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Links</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {activeSeller.website && (
                            <a href={activeSeller.website} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
                              <ExternalLink size={12} /> {activeSeller.website}
                            </a>
                          )}
                          {activeSeller.portfolio && (
                            <a href={activeSeller.portfolio} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
                              <ExternalLink size={12} /> Portfolio: {activeSeller.portfolio}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rejection notice if rejected */}
                    {activeSeller.status === 'rejected' && activeSeller.rejectionReason && (
                      <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
                        <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '0.8rem', color: '#ef4444', lineHeight: 1.6 }}>{activeSeller.rejectionReason}</p>
                      </div>
                    )}

                    {/* Only show action buttons if pending */}
                    {activeSeller.status === 'pending' && (
                      <>
                        {/* Reject reason */}
                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px' }}>
                            Lý do từ chối <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(bắt buộc khi từ chối)</span>
                          </label>
                          <textarea
                            rows={3}
                            className="input"
                            placeholder="Nhập lý do từ chối để seller biết cách cải thiện..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            style={{ resize: 'none', fontSize: '0.82rem' }}
                          />
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            onClick={() => handleAction(activeSeller.uid, 'approve')}
                            disabled={processing}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              padding: '13px', borderRadius: '12px', background: '#059669',
                              color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                              opacity: processing ? 0.7 : 1,
                            }}
                          >
                            <CheckCircle size={17} /> Duyệt Seller
                          </button>
                          <button
                            onClick={() => handleAction(activeSeller.uid, 'reject')}
                            disabled={processing || !rejectReason.trim()}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              padding: '13px', borderRadius: '12px',
                              background: rejectReason.trim() ? '#ef4444' : 'var(--border)',
                              color: rejectReason.trim() ? 'white' : 'var(--text-muted)',
                              border: 'none', cursor: rejectReason.trim() ? 'pointer' : 'not-allowed',
                              fontWeight: 700, fontSize: '0.9rem', opacity: processing ? 0.7 : 1,
                            }}
                          >
                            <XCircle size={17} /> Từ chối
                          </button>
                        </div>
                      </>
                    )}

                    {/* Already approved: show info */}
                    {activeSeller.status === 'approved' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: '10px' }}>
                        <CheckCircle size={15} color="#059669" />
                        <p style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>Seller đã được duyệt và hoạt động.</p>
                      </div>
                    )}

                    {/* Stats */}
                    {(activeSeller.totalSalesCount > 0 || activeSeller.totalEarningsCredits > 0) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {[
                          { label: 'Lượt bán', value: activeSeller.totalSalesCount },
                          { label: 'Credits kiếm được', value: activeSeller.totalEarningsCredits },
                        ].map((stat) => (
                          <div key={stat.label} style={{ padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
