'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Plus, X, Shield, Zap, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getSellerProfile } from '@/lib/marketplace.firestore';
import { submitSellerTemplate } from '@/lib/marketplace.api';
import { getIdToken } from 'firebase/auth';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['modern', 'minimal', 'professional', 'creative', 'tech', 'student', 'marketing', 'sales', 'executive'];
const STYLES = ['single-column', 'two-column', 'sidebar', 'timeline', 'infographic'];
const ROLES = ['all', 'developer', 'designer', 'marketing', 'sales', 'accountant', 'student', 'executive'];
const PRICE_PRESETS = [
  { credits: 5, label: '5 credits (~5.000đ)' },
  { credits: 10, label: '10 credits (~10.000đ)' },
  { credits: 20, label: '20 credits (~20.000đ)' },
  { credits: 30, label: '30 credits (~30.000đ)' },
  { credits: 50, label: '50 credits (~50.000đ)' },
];

export default function SellerNewTemplatePage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [sellerOk, setSellerOk] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    shortDescription: '',
    fullDescription: '',
    category: 'modern',
    style: 'single-column',
    targetRole: 'all',
    layoutType: '1col',
    isAtsFriendly: false,
    isPremiumStyle: false,
    priceCredits: 10,
    thumbnailUrl: '',
    tags: [] as string[],
  });

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) { setSellerOk(false); return; }
    (async () => {
      const s = await getSellerProfile(firebaseUser.uid);
      setSellerOk(s?.status === 'approved');
    })();
  }, [firebaseUser, loading]);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || form.tags.includes(t) || form.tags.length >= 10) return;
    setForm((p) => ({ ...p, tags: [...p.tags, t] }));
    setTagInput('');
  }

  function removeTag(tag: string) {
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  }

  function addPreviewUrl() {
    const url = prompt('Nhập URL ảnh xem trước:');
    if (url) setPreviewUrls((p) => [...p, url]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!form.name || !form.shortDescription || !form.fullDescription || !form.thumbnailUrl) {
      toast.error('Vui lòng điền đủ thông tin bắt buộc và URL ảnh thumbnail');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getIdToken(firebaseUser);
      const res = await submitSellerTemplate({ ...form, previewImageUrls: previewUrls }, token);
      if (res.success) {
        toast.success('Template đã được gửi duyệt! Chúng tôi sẽ xem xét sớm nhất có thể.');
        router.push('/seller/dashboard');
      } else {
        toast.error(res.error ?? 'Có lỗi xảy ra');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sellerOk === null) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="skeleton" style={{ width: '600px', height: '500px', borderRadius: '20px' }} /></div>;
  }

  if (!sellerOk) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ fontSize: '3rem' }}>🔒</p>
        <h1 style={{ fontWeight: 800 }}>Seller chưa được duyệt</h1>
        <Link href="/seller/apply" className="btn btn-primary">Đăng ký bán template</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        {/* Back */}
        <Link href="/seller/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem', marginBottom: '24px' }}>
          <ChevronLeft size={15} /> Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
              <Upload size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Upload template mới</h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Template sẽ chờ admin duyệt trước khi public</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Basic info */}
            <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Thông tin cơ bản</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Tên template <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="input" required placeholder="VD: Gradient Executive Pro" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Mô tả ngắn <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="input" required placeholder="Tóm tắt trong 1-2 câu" value={form.shortDescription} onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))} />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{form.shortDescription.length}/120 ký tự</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Mô tả chi tiết <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea className="input" required rows={4} placeholder="Mô tả đầy đủ về template, đặc điểm nổi bật, phù hợp cho ai, các phần bố cục..." value={form.fullDescription} onChange={(e) => setForm((p) => ({ ...p, fullDescription: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
              </div>
            </section>

            {/* Classification */}
            <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Phân loại</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Danh mục</label>
                  <select className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Phong cách</label>
                  <select className="input" value={form.style} onChange={(e) => setForm((p) => ({ ...p, style: e.target.value }))}>
                    {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Phù hợp vị trí</label>
                  <select className="input" value={form.targetRole} onChange={(e) => setForm((p) => ({ ...p, targetRole: e.target.value }))}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Bố cục</label>
                  <select className="input" value={form.layoutType} onChange={(e) => setForm((p) => ({ ...p, layoutType: e.target.value }))}>
                    <option value="1col">1 cột</option>
                    <option value="2col">2 cột</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', background: form.isAtsFriendly ? 'rgba(16,185,129,0.1)' : 'var(--bg)', border: '1.5px solid', borderColor: form.isAtsFriendly ? '#059669' : 'var(--border)', borderRadius: '10px' }}>
                  <input type="checkbox" checked={form.isAtsFriendly} onChange={(e) => setForm((p) => ({ ...p, isAtsFriendly: e.target.checked }))} />
                  <Shield size={15} color={form.isAtsFriendly ? '#059669' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: form.isAtsFriendly ? '#059669' : 'var(--text-secondary)' }}>ATS-friendly</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', background: form.isPremiumStyle ? 'rgba(245,158,11,0.1)' : 'var(--bg)', border: '1.5px solid', borderColor: form.isPremiumStyle ? '#d97706' : 'var(--border)', borderRadius: '10px' }}>
                  <input type="checkbox" checked={form.isPremiumStyle} onChange={(e) => setForm((p) => ({ ...p, isPremiumStyle: e.target.checked }))} />
                  <Zap size={15} color={form.isPremiumStyle ? '#d97706' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: form.isPremiumStyle ? '#d97706' : 'var(--text-secondary)' }}>Premium Style</span>
                </label>
              </div>
            </section>

            {/* Tags */}
            <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Tags</h2>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input className="input" placeholder="Nhập tag rồi nhấn Add" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} style={{ flex: 1 }} />
                <button type="button" onClick={addTag} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}><Plus size={15} /></button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {form.tags.map((tag) => (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600 }}>
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', color: 'var(--primary)' }}><X size={12} /></button>
                  </span>
                ))}
              </div>
            </section>

            {/* Images */}
            <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Hình ảnh</h2>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>URL Thumbnail <span style={{ color: '#ef4444' }}>*</span></label>
                <input className="input" required placeholder="https://your-cdn.com/thumbnail.png" value={form.thumbnailUrl} onChange={(e) => setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))} />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ảnh tỉ lệ 3:4, tối thiểu 400×533px</p>
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Ảnh xem trước ({previewUrls.length}/5)</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {previewUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                      <span style={{ display: 'block', padding: '6px 10px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                      <button type="button" onClick={() => setPreviewUrls((p) => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><X size={10} /></button>
                    </div>
                  ))}
                  {previewUrls.length < 5 && (
                    <button type="button" onClick={addPreviewUrl} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'var(--bg)', border: '1.5px dashed var(--border)', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <Plus size={13} /> Thêm ảnh
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Price */}
            <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Giá bán</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {PRICE_PRESETS.map((p) => (
                  <button
                    key={p.credits}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, priceCredits: p.credits }))}
                    style={{
                      padding: '10px', borderRadius: '10px', cursor: 'pointer',
                      border: '2px solid', fontWeight: 600, fontSize: '0.82rem',
                      borderColor: form.priceCredits === p.credits ? 'var(--primary)' : 'var(--border)',
                      background: form.priceCredits === p.credits ? 'rgba(99,102,241,0.1)' : 'var(--bg)',
                      color: form.priceCredits === p.credits ? 'var(--primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                Bạn nhận: <strong>{Math.floor(form.priceCredits * 0.85)} credits</strong> (85% sau khi platform thu 15%)
              </p>
            </section>

            {/* Terms */}
            <div style={{ padding: '14px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              ✅ Tôi xác nhận đây là tác phẩm gốc của tôi. Tôi đồng ý với điều khoản marketplace của CVFlow và hiểu rằng platform thu 15% commission trên mỗi giao dịch.
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
              {submitting ? 'Đang gửi...' : '🚀 Gửi để duyệt'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
