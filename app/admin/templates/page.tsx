'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { PlusCircle, Search, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

import AdminShell from '@/components/admin/AdminShell';
import { seedTemplates } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import type { Template } from '@/lib/types';

export default function AdminTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');

  const loadTemplates = async () => {
    const snap = await getDocs(collection(db, 'templates'));
    const list = snap.docs.map(d => ({ ...d.data(), templateId: d.id } as Template));
    setTemplates(list);
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.nameVi || '').toLowerCase().includes(q) ||
        (t.templateId || '').toLowerCase().includes(q)
    );
  }, [templates, search]);

  const updateTemplate = async (templateId: string, patch: Partial<Template>, success: string) => {
    setSavingId(templateId);
    try {
      await updateDoc(doc(db, 'templates', templateId), patch as Record<string, unknown>);
      setTemplates(prev => prev.map(t => (t.templateId === templateId ? { ...t, ...patch } : t)));
      toast.success(success);
    } catch (error) {
      console.error(error);
      toast.error('Cập nhật template thất bại');
    } finally {
      setSavingId(null);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await seedTemplates();
      toast.success('Đã seed templates mặc định');
      await loadTemplates();
    } catch (error) {
      console.error(error);
      toast.error('Seed templates thất bại');
      setLoading(false);
    }
  };

  const handleCreateBlank = async () => {
    const id = `custom-${Date.now()}`;
    const blank: Template = {
      templateId: id,
      name: 'Custom Template',
      nameVi: 'Template Tùy Chỉnh',
      category: 'modern',
      role: 'all',
      tier: 'free',
      previewUrl: '',
      description: 'Custom template',
      descriptionVi: 'Template do admin tạo',
      colors: ['#6366f1', '#8b5cf6'],
      isActive: true,
      usageCount: 0,
      createdAt: new Date(),
    };

    try {
      await setDoc(doc(db, 'templates', id), { ...blank, createdAt: new Date() });
      setTemplates(prev => [blank, ...prev]);
      toast.success('Đã tạo template mới');
    } catch (error) {
      console.error(error);
      toast.error('Không thể tạo template');
    }
  };

  return (
    <AdminShell title="Template Management" subtitle="Bật/tắt template, cấu hình tier và seed dữ liệu">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '9px 12px' }}>
          <Search size={15} color="rgba(255,255,255,0.45)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm template..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', width: '220px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleSeed} className="btn btn-outline btn-sm">
            <Sparkles size={14} /> Seed default
          </button>
          <button onClick={handleCreateBlank} className="btn btn-primary btn-sm">
            <PlusCircle size={14} /> Tạo template
          </button>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Template', 'Category', 'Role', 'Tier', 'Status', 'Usage', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '18px 12px', color: 'rgba(255,255,255,0.55)' }}>
                  Loading templates...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '18px 12px', color: 'rgba(255,255,255,0.45)' }}>
                  Không có template phù hợp.
                </td>
              </tr>
            ) : (
              filtered
                .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
                .map(t => {
                  const busy = savingId === t.templateId;
                  return (
                    <tr key={t.templateId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: '0.86rem' }}>{t.nameVi || t.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.74rem' }}>{t.templateId}</p>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>{t.category}</td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>{t.role || 'all'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '9999px', background: t.tier === 'premium' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.1)', color: t.tier === 'premium' ? '#f59e0b' : 'rgba(255,255,255,0.68)', fontWeight: 700 }}>
                          {t.tier}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: t.isActive ? '#34d399' : '#f87171', fontSize: '0.8rem', fontWeight: 600 }}>{t.isActive ? 'Active' : 'Hidden'}</td>
                      <td style={{ padding: '10px 12px', color: '#93c5fd', fontWeight: 700, fontSize: '0.84rem' }}>{(t.usageCount || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            disabled={busy}
                            onClick={() => updateTemplate(t.templateId, { isActive: !t.isActive }, t.isActive ? 'Đã ẩn template' : 'Đã bật template')}
                            className="btn btn-ghost btn-sm"
                            style={{ border: '1px solid rgba(148,163,184,0.35)' }}
                          >
                            {t.isActive ? 'Ẩn' : 'Bật'}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => updateTemplate(t.templateId, { tier: t.tier === 'premium' ? 'free' : 'premium' }, t.tier === 'premium' ? 'Đã chuyển về free' : 'Đã chuyển premium')}
                            className="btn btn-ghost btn-sm"
                            style={{ border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b' }}
                          >
                            {t.tier === 'premium' ? 'Set free' : 'Set premium'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

