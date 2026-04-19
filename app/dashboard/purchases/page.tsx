'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Zap, ExternalLink, Package,
  CheckCircle2, ArrowRight, Star,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import {
  getOrdersByBuyer,
  getOwnedTemplates,
  getMarketplaceTemplateById,
} from '@/lib/marketplace.firestore';
import type { MarketplaceOrder, TemplateOwnership, MarketplaceTemplate } from '@/lib/marketplace.types';

function formatDate(d: unknown): string {
  if (!d) return '—';
  try {
    const date =
      d instanceof Date
        ? d
        : typeof (d as { toDate?: () => Date }).toDate === 'function'
        ? (d as { toDate: () => Date }).toDate()
        : new Date(d as string);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

export default function PurchasesPage() {
  const { firebaseUser, loading } = useAuth();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [ownerships, setOwnerships] = useState<TemplateOwnership[]>([]);
  const [templateMap, setTemplateMap] = useState<Record<string, MarketplaceTemplate>>({});
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

      // Fetch template details for thumbnails
      const uniqueIds = [...new Set(o.map((ord) => ord.templateId))];
      const tmplResults = await Promise.all(uniqueIds.map((id) => getMarketplaceTemplateById(id)));
      const map: Record<string, MarketplaceTemplate> = {};
      tmplResults.forEach((t) => { if (t) map[t.id] = t; });
      setTemplateMap(map);

      setFetching(false);
    })();
  }, [firebaseUser, loading]);

  // ── Not logged in ───────────────────────────────────────────────────────────
  if (!firebaseUser && !loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg)' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShoppingBag size={32} color="var(--primary)" />
        </div>
        <h1 style={{ fontWeight: 800, fontSize: '1.4rem' }}>Đăng nhập để xem lịch sử mua</h1>
        <Link href="/auth" className="btn btn-primary">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.3)', flexShrink: 0 }}>
              <ShoppingBag size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Lịch sử mua</h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {fetching ? 'Đang tải...' : `${ownerships.length} template đã sở hữu · ${orders.length} đơn hàng`}
              </p>
            </div>
          </div>

          {/* Owned stats banner */}
          {!fetching && ownerships.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
              background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)',
              borderRadius: '14px', marginBottom: '24px',
            }}>
              <CheckCircle2 size={22} color="#059669" />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: '#059669', fontSize: '0.92rem' }}>
                  Bạn đang sở hữu {ownerships.length} template
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Truy cập bất kỳ lúc nào trong CVFlow editor.
                </p>
              </div>
              <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '9px', background: '#059669', color: 'white', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                Dùng ngay <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {/* Content */}
          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '88px', borderRadius: '14px' }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(99,102,241,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Package size={28} color="var(--primary)" />
              </div>
              <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>Chưa mua template nào</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: 1.6 }}>
                Khám phá hàng trăm mẫu CV từ designer chuyên nghiệp.<br />
                Dùng credits để mua và sử dụng vĩnh viễn trong CVFlow.
              </p>
              <Link href="/marketplace" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Khám phá Marketplace <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {orders.map((order, i) => {
                const tmpl = templateMap[order.templateId];
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '14px 18px', background: 'var(--bg-card)',
                      border: '1px solid var(--border)', borderRadius: '14px',
                      transition: 'var(--transition)',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: '52px', height: '64px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#f1f5f9', position: 'relative' }}>
                      {tmpl?.thumbnailUrl ? (
                        <Image src={tmpl.thumbnailUrl} alt={order.templateName} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} color="#cbd5e1" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.templateName}
                        </p>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '9999px', background: 'rgba(5,150,105,0.1)', color: '#059669', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>
                          <CheckCircle2 size={9} /> Đã sở hữu
                        </span>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {formatDate(order.createdAt)} · #{order.id.slice(-8).toUpperCase()}
                      </p>
                      {tmpl?.averageRating && tmpl.averageRating > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                          <Star size={10} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {tmpl.averageRating.toFixed(1)} ({tmpl.reviewCount})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '9999px', background: 'rgba(99,102,241,0.08)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>
                      <Zap size={12} /> {order.priceCredits} cr
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <Link
                        href={`/marketplace/${order.templateSlug}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '6px 10px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                        title="Xem trong marketplace"
                      >
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
