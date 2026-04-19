'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Package, Star, Plus, Eye, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { getSellerProfile, getTemplatesBySeller, getEarningsBySeller } from '@/lib/marketplace.firestore';
import type { SellerProfile, MarketplaceTemplate, SellerEarningTransaction } from '@/lib/marketplace.types';

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

  if (fetching) {
    return (
      <div style={{ minHeight: '100vh', padding: '60px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '14px' }} />)}
        </div>
      </div>
    );
  }

  if (!seller || seller.status !== 'approved') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ fontSize: '3rem' }}>🔒</p>
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem' }}>Bạn chưa phải seller</h1>
        <Link href="/seller/apply" className="btn btn-primary">Đăng ký bán template</Link>
      </div>
    );
  }

  const statCards = [
    { label: 'Tổng doanh thu', value: `${seller.totalEarningsCredits} cr`, icon: DollarSign, color: '#059669' },
    { label: 'Đang chờ', value: `${seller.pendingEarningsCredits} cr`, icon: Clock, color: '#d97706' },
    { label: 'Tổng bán', value: seller.totalSalesCount, icon: TrendingUp, color: 'var(--primary)' },
    { label: 'Templates', value: templates.length, icon: Package, color: '#7c3aed' },
  ];

  const statusColor: Record<string, string> = {
    approved: '#059669', pending_review: '#d97706', rejected: '#ef4444',
    draft: 'var(--text-muted)', suspended: '#ef4444',
  };
  const statusLabel: Record<string, string> = {
    approved: 'Đã duyệt', pending_review: 'Chờ duyệt', rejected: 'Bị từ chối',
    draft: 'Nháp', suspended: 'Tạm dừng',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>Seller Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Chào {seller.displayName} 👋</p>
          </div>
          <Link href="/seller/templates/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Upload template mới
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px',
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={22} color={s.color} />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>{s.value}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
          {/* Templates list */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Templates của bạn</h2>
            {templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</p>
                <p style={{ fontWeight: 600, marginBottom: '8px' }}>Chưa có template nào</p>
                <Link href="/seller/templates/new" className="btn btn-primary btn-sm" style={{ marginTop: '12px', display: 'inline-flex' }}>Upload ngay</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {templates.map((t) => (
                  <div key={t.id} style={{
                    display: 'flex', gap: '16px', alignItems: 'center',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '14px', padding: '14px',
                  }}>
                    <div style={{ width: '56px', height: '70px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#f1f5f9', position: 'relative' }}>
                      <Image src={t.thumbnailUrl || '/placeholder-template.png'} alt={t.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '3px' }}>{t.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.shortDescription}</p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: statusColor[t.status] }}>● {statusLabel[t.status]}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.totalSalesCount} bán · {t.priceCredits} cr</span>
                      </div>
                    </div>
                    {t.status === 'approved' && (
                      <Link href={`/marketplace/${t.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0 }}>
                        <Eye size={13} /> Xem
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent earnings */}
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Thu nhập gần đây</h2>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
              {earnings.length === 0 ? (
                <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Chưa có giao dịch nào</p>
              ) : (
                earnings.slice(0, 10).map((e, i) => (
                  <div key={e.id} style={{
                    padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: i < Math.min(earnings.length - 1, 9) ? '1px solid var(--border)' : 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{e.templateName}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {e.status === 'pending' ? '⏳ Đang chờ' : e.status === 'available' ? '✅ Khả dụng' : e.status}
                      </p>
                    </div>
                    <p style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>+{e.creditsAmount} cr</p>
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
