'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Zap, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { purchaseTemplate } from '@/lib/marketplace.api';
import toast from 'react-hot-toast';
import { getIdToken } from 'firebase/auth';
import type { MarketplaceTemplate } from '@/lib/marketplace.types';

interface PurchaseButtonProps {
  template: MarketplaceTemplate;
  isOwned: boolean;
  onPurchaseSuccess?: () => void;
}

export default function PurchaseButton({ template, isOwned, onPurchaseSuccess }: PurchaseButtonProps) {
  const { user, firebaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const userCredits = user?.credits ?? 0;
  const canAfford = userCredits >= template.priceCredits;

  async function handlePurchase() {
    if (!firebaseUser) {
      toast.error('Vui lòng đăng nhập để mua template');
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
        setSuccess(true);
        toast.success('Mua template thành công! 🎉');
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

  if (isOwned || success) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '16px 20px', borderRadius: '14px',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
        }}>
          <Check size={20} color="#059669" />
          <div>
            <p style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>Bạn đã sở hữu template này!</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Bắt đầu tạo CV với mẫu này ngay bây giờ.
            </p>
          </div>
        </div>
        <a
          href="/dashboard"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '14px 24px', borderRadius: '12px', fontWeight: 700,
            background: 'var(--gradient-primary)', color: 'white',
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            transition: 'all 0.25s',
          }}
        >
          Dùng template ngay →
        </a>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Credits info */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderRadius: '12px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
      }}>
        <div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Giá</p>
          <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
            {template.priceCredits} credits
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Credits của bạn</p>
          <p style={{
            fontWeight: 700, fontSize: '1rem',
            color: canAfford ? 'var(--text-primary)' : '#ef4444',
          }}>
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
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            <AlertCircle size={15} color="#ef4444" />
            <p style={{ fontSize: '0.8rem', color: '#ef4444' }}>
              Cần thêm {template.priceCredits - userCredits} credits.{' '}
              <a href="/pricing" style={{ fontWeight: 700, color: '#ef4444' }}>Nạp ngay</a>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main purchase button */}
      <button
        onClick={handlePurchase}
        disabled={loading || !user || !canAfford}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '16px 24px', borderRadius: '14px', fontWeight: 700, fontSize: '1rem',
          background: user && canAfford ? 'var(--gradient-primary)' : 'var(--border)',
          color: user && canAfford ? 'white' : 'var(--text-muted)',
          border: 'none', cursor: user && canAfford ? 'pointer' : 'not-allowed',
          boxShadow: user && canAfford ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
          transition: 'all 0.25s',
        }}
      >
        {loading ? (
          <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang xử lý...</>
        ) : (
          <><ShoppingCart size={18} /> Mua với {template.priceCredits} credits</>
        )}
      </button>

      {!user && (
        <a
          href="/auth"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px', borderRadius: '12px', fontWeight: 600,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.9rem',
          }}
        >
          Đăng nhập để mua
        </a>
      )}

      {/* Guarantee note */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
      }}>
        <Zap size={13} color="#059669" />
        <p style={{ fontSize: '0.75rem', color: '#059669' }}>
          Quyền dùng template vĩnh viễn trong CVFlow — không phải mua source code.
        </p>
      </div>
    </div>
  );
}
