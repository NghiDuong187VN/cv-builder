'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Zap, ExternalLink, Package } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getOrdersByBuyer, getOwnedTemplates } from '@/lib/marketplace.firestore';
import type { MarketplaceOrder, TemplateOwnership } from '@/lib/marketplace.types';

export default function PurchasesPage() {
  const { firebaseUser, loading } = useAuth();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [ownerships, setOwnerships] = useState<TemplateOwnership[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) { setFetching(false); return; }
    (async () => {
      const [o, own] = await Promise.all([
        getOrdersByBuyer(firebaseUser.uid),
        getOwnedTemplates(firebaseUser.uid),
      ]);
      setOrders(o);
      setOwnerships(own);
      setFetching(false);
    })();
  }, [firebaseUser, loading]);

  function formatDate(d: unknown) {
    if (!d) return '—';
    const date = d instanceof Date ? d : typeof (d as { toDate?: () => Date }).toDate === 'function' ? (d as { toDate: () => Date }).toDate() : new Date(d as string);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  if (!firebaseUser && !loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <ShoppingBag size={48} color="var(--primary)" />
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem' }}>Đăng nhập để xem lịch sử mua</h1>
        <Link href="/auth" className="btn btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Lịch sử mua</h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{orders.length} đơn hàng · {ownerships.length} template đã sở hữu</p>
            </div>
          </div>

          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '14px' }} />)}
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px' }}>
              <Package size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>Chưa mua template nào</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>Khám phá marketplace và mua template đầu tiên của bạn!</p>
              <Link href="/marketplace" className="btn btn-primary">Khám phá Marketplace</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px', background: 'var(--bg-card)',
                    border: '1px solid var(--border)', borderRadius: '14px',
                  }}
                >
                  {/* Order icon */}
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShoppingBag size={20} color="var(--primary)" />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.templateName}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDate(order.createdAt)} · Đơn #{order.id.slice(-8)}
                    </p>
                  </div>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.08)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                    <Zap size={13} /> {order.priceCredits} cr
                  </div>

                  {/* View template */}
                  <Link
                    href={`/marketplace/${order.templateSlug}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 12px', borderRadius: '9px', background: 'rgba(99,102,241,0.08)', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0 }}
                  >
                    <ExternalLink size={13} /> Xem
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
