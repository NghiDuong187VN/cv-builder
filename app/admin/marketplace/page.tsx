'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Pause, Eye, User, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getPendingTemplates } from '@/lib/marketplace.firestore';
import { adminReviewTemplate } from '@/lib/marketplace.api';
import { getIdToken } from 'firebase/auth';
import toast from 'react-hot-toast';
import type { MarketplaceTemplate } from '@/lib/marketplace.types';

export default function AdminMarketplacePage() {
  const { firebaseUser, isAdmin, loading } = useAuth();
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<MarketplaceTemplate | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) { setFetching(false); return; }
    (async () => {
      const data = await getPendingTemplates();
      setTemplates(data);
      setFetching(false);
    })();
  }, [isAdmin, loading]);

  async function handleAction(templateId: string, action: 'approve' | 'reject' | 'suspend') {
    if (!firebaseUser) return;
    if (action === 'reject' && !rejectReason.trim()) {
      toast.error('Nhập lý do từ chối');
      return;
    }
    setProcessing(true);
    try {
      const token = await getIdToken(firebaseUser);
      const res = await adminReviewTemplate({ templateId, action, rejectionReason: rejectReason || undefined }, token);
      if (res.success) {
        toast.success(action === 'approve' ? 'Đã duyệt template ✅' : action === 'reject' ? 'Đã từ chối ❌' : 'Đã tạm dừng ⏸');
        setTemplates((p) => p.filter((t) => t.id !== templateId));
        setActiveTemplate(null);
        setRejectReason('');
      } else {
        toast.error(res.error ?? 'Lỗi');
      }
    } finally {
      setProcessing(false);
    }
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            <ChevronLeft size={14} /> Admin
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Duyệt Template Marketplace</h1>
          <span style={{ padding: '3px 10px', borderRadius: '9999px', background: '#f59e0b', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
            {templates.length} chờ duyệt
          </span>
        </div>

        {fetching ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '14px' }} />)}
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <CheckCircle size={48} color="#059669" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Không có template nào chờ duyệt 🎉</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: activeTemplate ? '1fr 400px' : '1fr', gap: '24px' }}>
            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {templates.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { setActiveTemplate(t); setRejectReason(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px', background: 'var(--bg-card)',
                    border: `1.5px solid ${activeTemplate?.id === t.id ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '14px', cursor: 'pointer', transition: 'var(--transition)',
                  }}
                >
                  <div style={{ width: '56px', height: '70px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#f1f5f9', position: 'relative' }}>
                    <Image src={t.thumbnailUrl || '/placeholder-template.png'} alt={t.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{t.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.shortDescription}</p>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><User size={11} /> {t.sellerName}</span>
                      <span>· {t.category}</span>
                      <span>· {t.priceCredits} cr</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={(e) => { e.stopPropagation(); setActiveTemplate(t); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                      <Eye size={13} /> Chi tiết
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleAction(t.id, 'approve'); }} disabled={processing} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: '#059669', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                      <CheckCircle size={13} /> Duyệt
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Detail panel */}
            {activeTemplate && (
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ position: 'sticky', top: '20px', alignSelf: 'start', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}
              >
                {/* Preview */}
                <div style={{ aspectRatio: '3/4', background: '#f1f5f9', position: 'relative' }}>
                  <Image src={activeTemplate.thumbnailUrl || '/placeholder-template.png'} alt={activeTemplate.name} fill style={{ objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '8px' }}>{activeTemplate.name}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>{activeTemplate.fullDescription}</p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <span className="badge badge-primary">{activeTemplate.category}</span>
                    {activeTemplate.isAtsFriendly && <span style={{ padding: '3px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#059669' }}>ATS</span>}
                    <span style={{ padding: '3px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)' }}>{activeTemplate.priceCredits} cr</span>
                  </div>

                  {/* Reject reason */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px' }}>Lý do từ chối (nếu từ chối)</label>
                    <textarea
                      rows={3}
                      className="input"
                      placeholder="Nhập lý do từ chối..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      style={{ resize: 'none', fontSize: '0.82rem' }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => handleAction(activeTemplate.id, 'approve')} disabled={processing} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: '10px', background: '#059669', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                      <CheckCircle size={16} /> Duyệt template
                    </button>
                    <button onClick={() => handleAction(activeTemplate.id, 'reject')} disabled={processing || !rejectReason.trim()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', borderRadius: '10px', background: rejectReason.trim() ? '#ef4444' : 'var(--border)', color: rejectReason.trim() ? 'white' : 'var(--text-muted)', border: 'none', cursor: rejectReason.trim() ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.9rem' }}>
                      <XCircle size={16} /> Từ chối
                    </button>
                    <button onClick={() => handleAction(activeTemplate.id, 'suspend')} disabled={processing} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                      <Pause size={14} /> Tạm dừng
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
