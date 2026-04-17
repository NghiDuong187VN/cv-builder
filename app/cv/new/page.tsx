'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, ChevronRight, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useQuotaStatus } from '@/hooks/useQuotaStatus';
import { createCV, getTemplates, seedTemplates } from '@/lib/firestore';
import { Template } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import MobileEditorWarning from '@/components/cv/editor/MobileEditorWarning';
import QuotaUsageCard from '@/components/cv/editor/QuotaUsageCard';
import { FREE_AI_DAILY_LIMIT } from '@/lib/ai';
import { FREE_CV_LIMIT } from '@/lib/quota';
import toast from 'react-hot-toast';

const STYLE_FILTERS = [
  { key: 'all', label: 'Tất Cả' },
  { key: 'modern', label: 'Hiện Đại' },
  { key: 'minimal', label: 'Thanh Lịch' },
  { key: 'harvard', label: 'Harvard' },
  { key: 'creative', label: 'Sáng Tạo' },
  { key: 'professional', label: 'Chuyên Nghiệp' },
];

const ROLE_FILTERS = [
  { key: 'all', label: '🌐 Tất cả' },
  { key: 'developer', label: '💻 Lập Trình Viên' },
  { key: 'marketing', label: '📣 Marketing' },
  { key: 'sales', label: '💼 Kinh Doanh' },
  { key: 'accountant', label: '📊 Kế Toán' },
  { key: 'designer', label: '🎨 Designer' },
  { key: 'student', label: '🎓 Sinh Viên' },
];

// Màu gradient preview cho mỗi template
const TEMPLATE_VISUAL: Record<string, {bg: string, accent: string, pattern: string}> = {
  'modern-01':       { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', accent: '#a78bfa', pattern: '1col' },
  'minimal-01':      { bg: 'linear-gradient(135deg,#1e293b,#475569)', accent: '#94a3b8', pattern: '2col' },
  'harvard-01':      { bg: 'linear-gradient(135deg,#1a1a1a,#4a4a4a)', accent: '#888',    pattern: '1col' },
  'creative-01':     { bg: 'linear-gradient(135deg,#ec4899,#f59e0b)', accent: '#fde68a', pattern: '2col' },
  'tech-01':         { bg: 'linear-gradient(135deg,#064e3b,#1e293b)', accent: '#10b981', pattern: '1col' },
  'professional-01': { bg: 'linear-gradient(135deg,#1e3a5f,#2d5986)', accent: '#c9a84c', pattern: '1col' },
  'student-01':      { bg: 'linear-gradient(135deg,#06b6d4,#6366f1)', accent: '#a5f3fc', pattern: '1col' },
  'marketing-01':    { bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', accent: '#fde68a', pattern: '2col' },
};

function TemplateMiniPreview({ visual, pattern }: { visual: typeof TEMPLATE_VISUAL[string]; pattern: string }) {
  const is2col = pattern === '2col';
  return (
    <div style={{ width: '100%', height: '100%', background: '#f8fafc', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: visual.bg, padding: is2col ? '10px 8px' : '12px', display: 'flex', gap: '6px', alignItems: is2col ? 'flex-start' : 'center' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.8)', width: '70%', marginBottom: '3px' }} />
          <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.5)', width: '50%' }} />
        </div>
      </div>
      {/* Body */}
      {is2col ? (
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ width: '35%', background: 'rgba(0,0,0,0.05)', padding: '6px 5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[3, 2, 3, 2].map((w, i) => <div key={i} style={{ height: '3px', borderRadius: '1px', background: visual.accent, width: `${w * 25}%`, opacity: 0.6 }} />)}
          </div>
          <div style={{ flex: 1, padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[4,3,4,2,3].map((w, i) => <div key={i} style={{ height: '3px', borderRadius: '1px', background: '#cbd5e1', width: `${w*20}%` }} />)}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ height: '3px', background: visual.accent, width: '40%', borderRadius: '1px', opacity: 0.7 }} />
          {[4,3,4,2,4,3].map((w,i) => <div key={i} style={{ height: '2px', borderRadius: '1px', background: '#cbd5e1', width: `${w*18}%` }} />)}
        </div>
      )}
    </div>
  );
}

export default function NewCVPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();
  const { quotaStatus, quotaLoading } = useQuotaStatus(firebaseUser);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [styleFilter, setStyleFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [cvTitle, setCvTitle] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showCvLimitModal, setShowCvLimitModal] = useState(false);

  useEffect(() => {
    if (!loading && !firebaseUser) router.push('/auth');
  }, [loading, firebaseUser, router]);

  useEffect(() => {
    getTemplates().then(async data => {
      if (data.length === 0) {
        await seedTemplates();
        const seeded = await getTemplates();
        setTemplates(seeded);
      } else {
        setTemplates(data);
      }
      setTemplatesLoading(false);
    }).catch(() => setTemplatesLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return templates.filter(t => {
      const matchStyle = styleFilter === 'all' || t.category === styleFilter;
      const matchRole = roleFilter === 'all' || t.role === roleFilter || t.role === 'all';
      const matchSearch = !search || t.nameVi.toLowerCase().includes(search.toLowerCase()) || t.descriptionVi.toLowerCase().includes(search.toLowerCase());
      return matchStyle && matchRole && matchSearch;
    });
  }, [templates, styleFilter, roleFilter, search]);

  const aiLimit = quotaStatus?.aiLimit ?? FREE_AI_DAILY_LIMIT;
  const aiUsed = quotaStatus?.usedToday ?? 0;
  const cvLimit = quotaStatus?.cvLimit ?? FREE_CV_LIMIT;
  const cvUsed = quotaStatus?.cvCount ?? 0;
  const atCvLimit = quotaStatus?.cvLimit !== null && (quotaStatus?.cvRemaining ?? 0) <= 0;

  const handleUseTemplate = (template: Template) => {
    if (quotaLoading) {
      toast('Đang kiểm tra quota tài khoản...');
      return;
    }
    if (atCvLimit) {
      setShowCvLimitModal(true);
      return;
    }
    setSelectedTemplate(template);
    setCvTitle(`CV ${template.nameVi} ${new Date().getFullYear()}`);
    setPreviewTemplate(null);
    setShowNameModal(true);
  };

  const handleCreate = async () => {
    if (atCvLimit) {
      setShowCvLimitModal(true);
      return;
    }
    if (!firebaseUser || !selectedTemplate || !cvTitle.trim()) {
      toast.error('Vui lòng nhập tên CV');
      return;
    }
    setCreating(true);
    try {
      const cvId = await createCV(firebaseUser.uid, {
        title: cvTitle.trim(),
        templateId: selectedTemplate.templateId,
        isPublic: false,
        language: 'vi',
        theme: {
          primaryColor: selectedTemplate.colors[0],
          secondaryColor: selectedTemplate.colors[1] || selectedTemplate.colors[0],
          font: 'Plus Jakarta Sans',
          layout: '1col',
          showAvatar: true,
          accentStyle: 'gradient',
        },
      });
      toast.success('Tạo CV thành công! 🎉');
      router.push(`/cv/${cvId}/edit`);
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
      setCreating(false);
    }
  };

  return (
    <>
      <MobileEditorWarning storageKey="cv-new-mobile-warning" />
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-base)' }}>
        {/* Header */}
        <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '24px 0' }}>
          <div className="container" style={{ padding: '0 24px' }}>
            <Link href="/cv" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}>
              <ArrowLeft size={16} /> Quay lại
            </Link>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontWeight: 900, fontSize: '2rem', marginBottom: '6px' }}>
                  ✨ Chọn Mẫu CV
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {templates.length} mẫu miễn phí & cao cấp — chọn mẫu phù hợp với bạn nhất
                </p>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  placeholder="Tìm kiếm mẫu..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: '36px', width: '220px' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <QuotaUsageCard aiUsed={aiUsed} aiLimit={aiLimit} cvUsed={cvUsed} cvLimit={cvLimit} />
          </div>

          {/* Filter Tabs */}
          <div style={{ marginBottom: '24px' }}>
            {/* Style filters */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phong cách</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {STYLE_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setStyleFilter(f.key)}
                    className="btn btn-sm"
                    style={{
                      background: styleFilter === f.key ? 'var(--primary)' : 'var(--bg-card)',
                      color: styleFilter === f.key ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${styleFilter === f.key ? 'var(--primary)' : 'var(--border)'}`,
                    }}
                  >{f.label}</button>
                ))}
              </div>
            </div>
            {/* Role filters */}
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vị trí ứng tuyển</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ROLE_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setRoleFilter(f.key)}
                    className="btn btn-sm"
                    style={{
                      background: roleFilter === f.key ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                      color: roleFilter === f.key ? 'var(--primary)' : 'var(--text-secondary)',
                      border: `1px solid ${roleFilter === f.key ? 'var(--primary)' : 'var(--border)'}`,
                    }}
                  >{f.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid */}
          {templatesLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '20px' }}>
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '280px', borderRadius: '16px' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</p>
              <p style={{ fontWeight: 700 }}>Không tìm thấy mẫu phù hợp</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '20px' }}>
              {filtered.map((t, i) => {
                const visual = TEMPLATE_VISUAL[t.templateId] || { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', accent: '#a78bfa', pattern: '1col' };
                const isSelected = selectedTemplate?.templateId === t.templateId;
                return (
                  <motion.div
                    key={t.templateId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div
                      style={{
                        borderRadius: '16px',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        overflow: 'hidden',
                        background: 'var(--bg-card)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = isSelected ? 'var(--shadow-glow)' : 'var(--shadow-sm)';
                      }}
                    >
                      {/* Mini preview */}
                      <div
                        style={{ height: '180px', padding: '10px', background: '#f1f5f9', position: 'relative' }}
                        onClick={() => setPreviewTemplate(previewTemplate?.templateId === t.templateId ? null : t)}
                      >
                        <TemplateMiniPreview visual={visual} pattern={visual.pattern} />
                        {t.tier === 'premium' && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'linear-gradient(135deg,#f59e0b,#ec4899)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px' }}>
                            PREMIUM
                          </div>
                        )}
                        {isSelected && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                            <div style={{ background: 'var(--primary)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={16} color="white" />
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ padding: '14px 16px' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{t.nameVi}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>{t.descriptionVi}</p>
                        <button
                          onClick={() => handleUseTemplate(t)}
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          Dùng mẫu này <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Đặt tên CV */}
      <AnimatePresence>
        {showCvLimitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={e => { if (e.target === e.currentTarget) setShowCvLimitModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', maxWidth: '440px', width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}
            >
              <h2 style={{ fontWeight: 800, fontSize: '1.35rem', marginBottom: '8px' }}>Đã đạt giới hạn gói Free</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '20px' }}>
                Tài khoản Free chỉ tạo tối đa {FREE_CV_LIMIT} CV. Nâng cấp Premium để tạo thêm CV mới và tiếp tục dùng đầy đủ công cụ.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowCvLimitModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Để sau
                </button>
                <Link href="/pricing" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCvLimitModal(false)}>
                  Nâng cấp Premium
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showNameModal && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={e => { if (e.target === e.currentTarget) setShowNameModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '40px', maxWidth: '440px', width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}
            >
              {/* Template info */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '28px', padding: '14px 16px', background: 'rgba(99,102,241,0.06)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: TEMPLATE_VISUAL[selectedTemplate.templateId]?.bg || 'var(--gradient-primary)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedTemplate.nameVi}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedTemplate.descriptionVi}</p>
                </div>
              </div>

              <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '8px' }}>Đặt tên cho CV</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Tên CV giúp bạn dễ phân biệt khi có nhiều phiên bản.
              </p>

              <input
                className="input"
                style={{ marginBottom: '20px' }}
                placeholder="VD: CV Frontend Developer 2025"
                value={cvTitle}
                onChange={e => setCvTitle(e.target.value)}
                onKeyPress={e => { if (e.key === 'Enter') handleCreate(); }}
                autoFocus
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowNameModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Hủy
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !cvTitle.trim()}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center', opacity: creating || !cvTitle.trim() ? 0.7 : 1 }}
                >
                  {creating ? '⏳ Đang tạo...' : <><Sparkles size={16} /> Tạo & Chỉnh Sửa CV</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
