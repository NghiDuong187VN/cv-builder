'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Crown, Search } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getTemplates } from '@/lib/firestore';
import { Template } from '@/lib/types';

const CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'modern', label: 'Hiện đại' },
  { key: 'minimal', label: 'Tối giản' },
  { key: 'creative', label: 'Sáng tạo' },
  { key: 'professional', label: 'Chuyên nghiệp' },
  { key: 'student', label: 'Sinh viên' },
  { key: 'tech', label: 'Kỹ thuật' },
  { key: 'designer', label: 'Designer' },
  { key: 'marketing', label: 'Marketing' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTemplates().then(data => { setTemplates(data); setLoading(false); });
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

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        {/* Hero */}
        <div style={{ background: 'var(--gradient-primary)', padding: '48px 24px', textAlign: 'center', marginBottom: '48px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'white', marginBottom: '12px' }}>
              🎨 Kho Mẫu CV
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto 24px' }}>
              Chọn mẫu phù hợp với phong cách và ngành nghề của bạn
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '14px', padding: '10px 16px', maxWidth: '400px', margin: '0 auto',
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
          {/* Category Filters */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '32px', paddingBottom: '4px' }}>
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                style={{
                  padding: '8px 18px', borderRadius: '9999px', cursor: 'pointer',
                  whiteSpace: 'nowrap', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem',
                  background: category === c.key ? 'var(--primary)' : 'var(--bg-card)',
                  color: category === c.key ? 'white' : 'var(--text-secondary)',
                  border: category === c.key ? '1px solid transparent' : '1px solid var(--border)',
                  transition: 'var(--transition)',
                  boxShadow: category === c.key ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '300px', borderRadius: '20px' }} />)}
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
                <TemplateCard key={t.templateId} template={t} delay={i * 0.05} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

function TemplateCard({ template: t, delay }: { template: Template; delay: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card"
      style={{ overflow: 'hidden', padding: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Preview area */}
      <div style={{ position: 'relative', height: '200px', background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1] || t.colors[0]})`, overflow: 'hidden' }}>
        {/* Mock CV layout inside */}
        <div style={{ position: 'absolute', inset: 0, padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />
          {[100, 70, 85, 60, 90].map((w, i) => (
            <div key={i} style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.2)', width: `${w}%` }} />
          ))}
        </div>

        {/* Badges */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
          {t.tier === 'premium' && (
            <span style={{ padding: '3px 10px', background: 'linear-gradient(135deg, #f59e0b, #ec4899)', color: 'white', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Crown size={10} /> PREMIUM
            </span>
          )}
          {t.tier === 'free' && (
            <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.25)', color: 'white', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)' }}>
              MIỄN PHÍ
            </span>
          )}
        </div>

        {/* Hover overlay */}
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            <Link href={`/cv/new?template=${t.templateId}`} className="btn btn-primary btn-sm">Dùng mẫu này</Link>
          </motion.div>
        )}
      </div>

      <div style={{ padding: '14px 16px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{t.nameVi}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '10px' }}>{t.descriptionVi.slice(0, 60)}...</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {t.colors.map((c, i) => (
              <div key={i} style={{ width: '16px', height: '16px', borderRadius: '50%', background: c, border: '2px solid var(--border)' }} />
            ))}
          </div>
          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>⬇ {t.usageCount} lượt dùng</span>
        </div>
      </div>
    </motion.div>
  );
}
