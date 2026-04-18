'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Search, Lock, Eye, Zap, Briefcase, GraduationCap, Code2, Palette, TrendingUp, Calculator } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getTemplates, TEMPLATES } from '@/lib/firestore';
import { Template } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import PremiumBanner from '@/components/ui/PremiumBanner';

const CATEGORIES = [
  { key: 'all', label: 'Tất cả', icon: null },
  { key: 'modern', label: 'Hiện đại', icon: Zap },
  { key: 'minimal', label: 'Tối giản', icon: null },
  { key: 'creative', label: 'Sáng tạo', icon: Palette },
  { key: 'professional', label: 'Chuyên nghiệp', icon: Briefcase },
  { key: 'student', label: 'Sinh viên', icon: GraduationCap },
  { key: 'tech', label: 'Kỹ thuật / IT', icon: Code2 },
  { key: 'marketing', label: 'Marketing', icon: TrendingUp },
  { key: 'accountant', label: 'Kế toán', icon: Calculator },
];

const TEMPLATE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  ats: { label: 'ATS-friendly', color: '#059669', bg: 'rgba(16,185,129,0.12)' },
  popular: { label: 'Phổ biến', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  student: { label: 'Cho sinh viên', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  professional: { label: 'Chuyên nghiệp', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  new: { label: 'Mới', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES as Template[]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isPremium = user?.plan === 'premium';

  useEffect(() => {
    // Không cần gọi getTemplates nữa để không bị lỗi 0 mẫu,
    // hoặc có thể gọi rồi ghi đè nếu tồn tại, nhưng hiện tại static data là đủ.
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = templates;
    if (category !== 'all') result = result.filter(t => t.category === category);
    if (q) {
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.nameVi.toLowerCase().includes(q)
      );
    }
    return result;
  }, [category, search, templates]);

  const freeCount = templates.filter(t => t.tier === 'free').length;
  const premiumCount = templates.filter(t => t.tier === 'premium').length;

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        {/* Hero */}
        <div style={{
          background: 'var(--gradient-primary)',
          padding: '56px 24px 48px',
          textAlign: 'center',
          marginBottom: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(236,72,153,0.2)', filter: 'blur(40px)' }} />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 14px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '9999px', color: 'white', fontSize: '0.78rem', fontWeight: 600 }}>
                ✅ {freeCount} mẫu miễn phí
              </span>
              <span style={{ padding: '4px 14px', background: 'rgba(245,158,11,0.3)', border: '1px solid rgba(245,158,11,0.5)', borderRadius: '9999px', color: 'white', fontSize: '0.78rem', fontWeight: 600 }}>
                👑 {premiumCount} mẫu cao cấp
              </span>
            </div>
            <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', color: 'white', marginBottom: '14px', lineHeight: 1.25, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
              🎨 Kho Mẫu CV Chuyên Nghiệp
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.75 }}>
              Từ sinh viên đến chuyên gia — tìm mẫu phù hợp phong cách và ngành nghề của bạn.
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '14px', padding: '10px 16px', maxWidth: '420px', margin: '0 auto',
              backdropFilter: 'blur(8px)',
            }}>
              <Search size={18} color="rgba(255,255,255,0.8)" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm mẫu CV..."
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontFamily: 'inherit', fontSize: '0.95rem', flex: 1 }}
              />
            </div>
          </motion.div>
        </div>

        <div className="container">
          {/* Premium banner for free users */}
          {!isPremium && (
            <div style={{ marginBottom: '28px' }}>
              <PremiumBanner variant="compact" context="templates" />
            </div>
          )}

          {/* Category Filters */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '32px', paddingBottom: '4px' }}>
            {CATEGORIES.map(c => {
              const count = c.key === 'all'
                ? templates.length
                : templates.filter(t => t.category === c.key).length;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '9999px', cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-body), inherit',
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                    letterSpacing: '0.01em',
                    background: category === c.key ? 'var(--primary)' : 'var(--bg-card)',
                    color: category === c.key ? 'white' : 'var(--text-secondary)',
                    border: category === c.key ? '1px solid transparent' : '1px solid var(--border)',
                    transition: 'var(--transition)',
                    boxShadow: category === c.key ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
                  }}
                >
                  {c.icon && <c.icon size={13} />}
                  {c.label}
                  {count > 0 && (
                    <span style={{
                      fontSize: '0.7rem', padding: '0 6px', borderRadius: '9999px',
                      background: category === c.key ? 'rgba(255,255,255,0.25)' : 'rgba(99,102,241,0.1)',
                      color: category === c.key ? 'white' : 'var(--primary)',
                      fontWeight: 700,
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '320px', borderRadius: '20px' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{ fontSize: '3rem' }}>🔍</p>
              <h3 style={{ fontWeight: 700, marginTop: '16px', marginBottom: '8px' }}>Không tìm thấy mẫu</h3>
              <p style={{ color: 'var(--text-muted)' }}>Thử tìm kiếm với từ khóa khác</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '60px' }}>
              {filtered.map((t, i) => (
                <TemplateCard key={t.templateId} template={t} delay={i * 0.04} isPremiumUser={isPremium} />
              ))}
            </div>
          )}

          {/* Bottom upsell if free user */}
          {!isPremium && premiumCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ marginBottom: '60px' }}
            >
              <PremiumBanner variant="inline" context="templates" />
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

function TemplateCard({ template: t, delay, isPremiumUser }: { template: Template; delay: number; isPremiumUser: boolean }) {
  const [hovered, setHovered] = useState(false);
  const isLocked = t.tier === 'premium' && !isPremiumUser;

  // Assign smart badges based on category / tier
  const extraBadges: string[] = [];
  if (t.category === 'minimal' || t.category === 'professional') extraBadges.push('ats');
  if (t.usageCount > 500) extraBadges.push('popular');
  if (t.category === 'student') extraBadges.push('student');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card"
      style={{ overflow: 'hidden', padding: 0, cursor: isLocked ? 'default' : 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Preview area */}
      <div style={{
        position: 'relative', height: '210px',
        background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1] || t.colors[0]})`,
        overflow: 'hidden',
        filter: isLocked ? 'brightness(0.85)' : 'none',
        transition: 'filter 0.3s',
      }}>
        {/* Mock CV layout – style aware */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden' }}>
          {/* Sidebar layout for 2-col templates */}
          {(t.category === 'modern' || t.category === 'creative' || t.templateId.includes('sidebar') || t.templateId.includes('executive') || t.templateId.includes('tech')) ? (
            <>
              {/* Left sidebar */}
              <div style={{ width: '35%', height: '100%', background: 'rgba(0,0,0,0.25)', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.35)', margin: '0 auto 6px' }} />
                <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.45)', width: '80%', margin: '0 auto' }} />
                <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.25)', width: '60%', margin: '0 auto' }} />
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', margin: '4px 0' }} />
                {[70, 90, 55, 80].map((w, i) => (
                  <div key={i} style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)', width: `${w}%` }} />
                ))}
              </div>
              {/* Right content */}
              <div style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ height: '7px', borderRadius: '3px', background: 'rgba(255,255,255,0.5)', width: '85%' }} />
                <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.25)', width: '60%' }} />
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', margin: '4px 0' }} />
                {[95, 70, 80, 55, 75, 50, 65].map((w, i) => (
                  <div key={i} style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)', width: `${w}%` }} />
                ))}
              </div>
            </>
          ) : (
            /* Single column layout */
            <div style={{ width: '100%', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: '7px', borderRadius: '4px', background: 'rgba(255,255,255,0.55)', width: '65%', marginBottom: '5px' }} />
                  <div style={{ height: '4px', borderRadius: '3px', background: 'rgba(255,255,255,0.3)', width: '45%' }} />
                </div>
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '2px 0' }} />
              {[90, 65, 85, 50, 75, 45, 70].map((w, i) => (
                <div key={i} style={{ height: '4px', borderRadius: '3px', background: 'rgba(255,255,255,0.2)', width: `${w}%` }} />
              ))}
            </div>
          )}
        </div>

        {/* Tier badges */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', flexDirection: 'column', alignItems: 'flex-end' }}>
          {t.tier === 'premium' && (
            <span style={{ padding: '3px 10px', background: 'linear-gradient(135deg, #f59e0b, #ec4899)', color: 'white', borderRadius: '9999px', fontSize: '0.66rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Crown size={9} /> PREMIUM
            </span>
          )}
          {t.tier === 'free' && (
            <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.22)', color: 'white', borderRadius: '9999px', fontSize: '0.66rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)' }}>
              MIỄN PHÍ
            </span>
          )}
        </div>

        {/* Lock overlay for premium templates */}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
              backdropFilter: 'blur(2px)',
            }}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(245,158,11,0.5)' }}>
              <Lock size={20} color="white" />
            </div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '0.82rem', textAlign: 'center', lineHeight: 1.4, maxWidth: '140px' }}>
              Mở khóa với Premium
            </p>
            <Link
              href="/pricing"
              onClick={e => e.stopPropagation()}
              style={{
                padding: '7px 18px', borderRadius: '9999px',
                background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                color: 'white', fontSize: '0.78rem', fontWeight: 700,
                textDecoration: 'none', whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
              }}
            >
              Nâng cấp ngay →
            </Link>
          </motion.div>
        )}

        {/* Hover overlay for free/unlocked templates */}
        {!isLocked && hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Link href={`/cv/new?template=${t.templateId}`} className="btn btn-primary btn-sm">
              Dùng mẫu này
            </Link>
            <Link
              href={`/cv/new?template=${t.templateId}&preview=1`}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: 'white', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
            >
              <Eye size={13} /> Xem thử
            </Link>
          </motion.div>
        )}
      </div>

      {/* Card info */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <h3 style={{
            fontWeight: 700,
            fontSize: 'var(--text-base)',
            color: 'var(--text-primary)',
            lineHeight: 'var(--leading-snug)',
            fontFamily: 'var(--font-heading)',
          }}>{t.nameVi}</h3>
          {isLocked && <Crown size={14} color="#f59e0b" />}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: '10px', lineHeight: 1.65 }}>
          {t.descriptionVi.slice(0, 65)}...
        </p>

        {/* Smart badges */}
        {extraBadges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
            {extraBadges.map(b => {
              const badge = (TEMPLATE_BADGES as Record<string, { label: string; color: string; bg: string }>)[b];
              if (!badge) return null;
              return (
                <span key={b} style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 700, color: badge.color, background: badge.bg }}>
                  {badge.label}
                </span>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {t.colors.map((c, i) => (
              <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', background: c, border: '2px solid var(--border)' }} />
            ))}
          </div>
          <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              lineHeight: 1,
            }}>
            ⬇ {t.usageCount.toLocaleString()} lượt dùng
          </span>
        </div>
      </div>
    </motion.div>
  );
}
