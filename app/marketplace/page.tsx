'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, SlidersHorizontal, Zap,
  Shield, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import TemplateCard from '@/components/marketplace/TemplateCard';
import { getApprovedTemplates } from '@/lib/marketplace.firestore';
import { getOwnedTemplates, getFavoritesByUser, toggleFavorite } from '@/lib/marketplace.firestore';
import { useAuth } from '@/hooks/useAuth';
import type { MarketplaceTemplate } from '@/lib/marketplace.types';

const CATEGORIES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'modern', label: 'Hiện đại' },
  { value: 'minimal', label: 'Tối giản' },
  { value: 'professional', label: 'Chuyên nghiệp' },
  { value: 'creative', label: 'Sáng tạo' },
  { value: 'tech', label: 'Công nghệ' },
  { value: 'student', label: 'Sinh viên' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'executive', label: 'Điều hành' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'popular', label: 'Phổ biến' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
];

export default function MarketplacePage() {
  const { firebaseUser } = useAuth();
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc'>('newest');
  const [atsOnly, setAtsOnly] = useState(false);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { templates: data } = await getApprovedTemplates({
        category,
        isAtsFriendly: atsOnly || undefined,
        sortBy,
        search,
        pageSize: 40,
      });
      setTemplates(data);
    } finally {
      setLoading(false);
    }
  }, [category, atsOnly, sortBy, search]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      const [owned, favs] = await Promise.all([
        getOwnedTemplates(firebaseUser.uid),
        getFavoritesByUser(firebaseUser.uid),
      ]);
      setOwnedIds(new Set(owned.map((o) => o.templateId)));
      setFavoritedIds(new Set(favs.map((f) => f.templateId)));
    })();
  }, [firebaseUser]);

  async function handleFavoriteToggle(templateId: string) {
    if (!firebaseUser) return;
    const isFav = favoritedIds.has(templateId);
    // Optimistic update
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(templateId); else next.add(templateId);
      return next;
    });
    await toggleFavorite(firebaseUser.uid, templateId);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(248,250,255,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)', padding: '14px 0',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: '1.2rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
            <span className="gradient-text">CVFlow</span>
          </Link>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/dashboard" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
            <Link href="/seller/apply" className="btn btn-primary btn-sm">Bán template</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '56px 0 40px', background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, transparent 60%)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '5px 14px', borderRadius: '9999px', marginBottom: '16px',
              background: 'rgba(99,102,241,0.1)', color: 'var(--primary)',
              fontSize: '0.82rem', fontWeight: 700,
            }}>
              <Zap size={13} /> Marketplace
            </span>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '12px' }}>
              Thư viện template do cộng đồng thiết kế
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 28px' }}>
              Hàng trăm mẫu CV độc quyền từ designer chuyên nghiệp. Mua một lần, dùng mãi mãi.
            </p>

            {/* Search */}
            <div style={{
              display: 'flex', gap: '8px', maxWidth: '560px', margin: '0 auto',
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm template..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
              <button
                onClick={() => setShowFilters((p) => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '12px 18px', borderRadius: 'var(--radius-md)', fontWeight: 600,
                  background: showFilters ? 'var(--primary)' : 'var(--bg-card)',
                  color: showFilters ? 'white' : 'var(--text-primary)',
                  border: '1.5px solid var(--border)', cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                <SlidersHorizontal size={15} /> Lọc
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <div className="container" style={{ paddingTop: '16px' }}>
        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              style={{
                padding: '7px 16px', borderRadius: '9999px', border: '1.5px solid',
                fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap',
                background: category === cat.value ? 'var(--primary)' : 'var(--bg-card)',
                borderColor: category === cat.value ? 'var(--primary)' : 'var(--border)',
                color: category === cat.value ? 'white' : 'var(--text-secondary)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Extra filters row */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
              padding: '16px', background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: '14px', marginTop: '12px',
            }}
          >
            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sắp xếp:</span>
              <div style={{ position: 'relative' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  style={{
                    appearance: 'none', padding: '7px 28px 7px 12px',
                    borderRadius: '9px', border: '1.5px solid var(--border)',
                    background: 'var(--bg)', color: 'var(--text-primary)',
                    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* ATS toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={atsOnly} onChange={(e) => setAtsOnly(e.target.checked)} />
              <Shield size={13} color="#059669" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ATS-friendly only</span>
            </label>
          </motion.div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 4px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {loading ? 'Đang tải...' : `${templates.length} template`}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', paddingBottom: '80px' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: '20px' }} />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</p>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>Không tìm thấy template nào</p>
            <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', paddingBottom: '80px' }}>
            {templates.map((t, i) => (
              <TemplateCard
                key={t.id}
                template={t}
                index={i}
                isOwned={ownedIds.has(t.id)}
                isFavorited={favoritedIds.has(t.id)}
                onFavoriteToggle={firebaseUser ? handleFavoriteToggle : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
