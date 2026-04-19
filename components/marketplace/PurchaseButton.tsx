'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Check, Loader2, AlertCircle,
  Sparkles, X, ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { purchaseTemplate } from '@/lib/marketplace.api';
import toast from 'react-hot-toast';
import { getIdToken } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import type { MarketplaceTemplate } from '@/lib/marketplace.types';

interface PurchaseButtonProps {
  template: MarketplaceTemplate;
  isOwned: boolean;
  onPurchaseSuccess?: () => void;
}

// ─── Modal tạo CV sau mua ───────────────────────────────────────────────────────
function CreateCvModal({
  template,
  onClose,
}: {
  template: MarketplaceTemplate;
  onClose: () => void;
}) {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState(`CV ${template.name} ${new Date().getFullYear()}`);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!firebaseUser || !title.trim()) return;
    setCreating(true);
    try {
      const token = await getIdToken(firebaseUser);
      const res = await fetch('/api/cv/create-from-marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ marketplaceTemplateId: template.id, title: title.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.cvId) {
        toast.success('CV đã được tạo thành công! 🎉');
        router.push(`/cv/${data.cvId}/edit`);
      } else {
        toast.error(data.error ?? 'Không thể tạo CV');
        setCreating(false);
      }
    } catch {
      toast.error('Có lỗi xảy ra');
      setCreating(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          background: 'var(--bg-card)', borderRadius: '24px', padding: '36px',
          maxWidth: '460px', width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>

        {/* Success icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(5,150,105,0.1)', border: '2px solid rgba(5,150,105,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Check size={28} color="#059669" />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: '6px' }}>
            Mua thành công! 🎉
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Template <strong>{template.name}</strong> đã thuộc về bạn.<br />
            Đặt tên CV và bắt đầu chỉnh sửa ngay.
          </p>
        </div>

        {/* CV title input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
            Tên CV
          </label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
            placeholder="VD: CV Frontend Developer 2026"
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Để sau
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim()}
            className="btn btn-primary"
            style={{ flex: 2, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {creating ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tạo...</>
            ) : (
              <><Sparkles size={16} /> Tạo CV ngay →</>
            )}
          </button>
        </div>

        {/* OR go to dashboard */}
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Hoặc xem tại{' '}
          <a href="/dashboard/purchases" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Lịch sử mua
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── Main PurchaseButton ────────────────────────────────────────────────────────
export default function PurchaseButton({ template, isOwned, onPurchaseSuccess }: PurchaseButtonProps) {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [justPurchased, setJustPurchased] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const userCredits = user?.credits ?? 0;
  const canAfford = userCredits >= template.priceCredits;
  const showOwned = isOwned || justPurchased;

  async function handlePurchase() {
    if (!firebaseUser) {
      toast.error('Vui lòng đăng nhập để mua template');
      router.push('/auth');
      return;
    }
    if (!canAfford) {
      toast.error(`Không đủ credits. Cần ${template.priceCredits}, hiện có ${userCredits}.`);
      return;
    }

    setLoading(true);
    try {
      const token = await getIdToken(firebaseUser);
      const result = await purchaseTemplate(template.id, token);

      if (result.success) {
        setJustPurchased(true);
        setShowCreateModal(true);
        onPurchaseSuccess?.();
      } else {
        toast.error(result.error ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  // ── Owned state ─────────────────────────────────────────────────────────────
  if (showOwned) {
    return (
      <>
        <AnimatePresence>
          {showCreateModal && (
            <CreateCvModal
              template={template}
              onClose={() => setShowCreateModal(false)}
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          {/* Owned badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 18px', borderRadius: '12px',
            background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)',
          }}>
            <Check size={20} color="#059669" />
            <div>
              <p style={{ fontWeight: 700, color: '#059669', fontSize: '0.9rem' }}>Bạn đã sở hữu template này!</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Có thể dùng ngay trong CVFlow editor.
              </p>
            </div>
          </div>

          {/* Primary CTA: Tạo CV ngay */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', border: 'none' }}
          >
            <Sparkles size={17} /> Tạo CV với template này
          </button>

          {/* Secondary: Xem lịch sử mua */}
          <a
            href="/dashboard/purchases"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '11px', borderRadius: '10px', fontWeight: 600,
              background: 'var(--bg)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem',
            }}
          >
            <ArrowRight size={14} /> Xem lịch sử mua
          </a>
        </motion.div>
      </>
    );
  }

  // ── Not owned state ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Credits info */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderRadius: '12px',
        background: 'var(--bg)', border: '1px solid var(--border)',
      }}>
        <div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Giá</p>
          <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary)' }}>
            {template.priceCredits} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>credits</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Credits của bạn</p>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: canAfford ? 'var(--text-primary)' : '#ef4444' }}>
            {user ? userCredits : '—'}
          </p>
        </div>
      </div>

      {/* Not enough credits warning */}
      <AnimatePresence>
        {user && !canAfford && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertCircle size={14} color="#ef4444" />
            <p style={{ fontSize: '0.78rem', color: '#ef4444' }}>
              Cần thêm {template.priceCredits - userCredits} credits.{' '}
              <a href="/pricing" style={{ fontWeight: 700, color: '#ef4444' }}>Nạp ngay</a>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy button */}
      <button
        onClick={handlePurchase}
        disabled={loading || !user || !canAfford}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '16px 24px', borderRadius: '14px', fontWeight: 700, fontSize: '1rem',
          background: user && canAfford ? 'var(--gradient-primary)' : 'var(--border)',
          color: user && canAfford ? 'white' : 'var(--text-muted)',
          border: 'none', cursor: user && canAfford ? 'pointer' : 'not-allowed',
          boxShadow: user && canAfford ? '0 4px 20px rgba(99,102,241,0.35)' : 'none',
          transition: 'all 0.25s',
        }}
      >
        {loading ? (
          <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang xử lý...</>
        ) : (
          <><ShoppingCart size={18} /> Mua với {template.priceCredits} credits</>
        )}
      </button>

      {/* Login CTA if not logged in */}
      {!user && (
        <a
          href="/auth"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontWeight: 600, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.9rem' }}
        >
          Đăng nhập để mua
        </a>
      )}

      {/* Policy note */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '10px 13px', borderRadius: '10px', background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.12)' }}>
        <Check size={13} color="#059669" style={{ marginTop: '2px', flexShrink: 0 }} />
        <p style={{ fontSize: '0.72rem', color: '#059669', lineHeight: 1.5 }}>
          Quyền sử dụng vĩnh viễn trong CVFlow. Không phải mua source code. Không được resale.
        </p>
      </div>
    </div>
  );
}
