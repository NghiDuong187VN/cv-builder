'use client';
import { Project } from '@/lib/types';
import { Plus, Trash2, GripVertical, FolderGit2, X } from 'lucide-react';
import { useState } from 'react';

interface Props { data: Project[]; onChange: (d: Project[]) => void; }

const newProject = (): Project => ({
  id: Date.now().toString(), name: '', role: '', url: '', github: '', description: '', technologies: [], from: '', to: ''
});

export default function ProjectsForm({ data, onChange }: Props) {
  const [techInputs, setTechInputs] = useState<string[]>(data.map(() => ''));

  const update = (i: number, field: keyof Project, val: string | string[]) => {
    const list = [...data]; list[i] = { ...list[i], [field]: val }; onChange(list);
  };
  const remove = (i: number) => { onChange(data.filter((_, j) => j !== i)); setTechInputs(prev => prev.filter((_, j) => j !== i)); };
  const add = () => { onChange([...data, newProject()]); setTechInputs(prev => [...prev, '']); };

  const addTech = (i: number) => {
    const val = techInputs[i]?.trim();
    if (!val || data[i].technologies.includes(val)) return;
    update(i, 'technologies', [...data[i].technologies, val]);
    setTechInputs(prev => { const n = [...prev]; n[i] = ''; return n; });
  };

  const removeTech = (i: number, t: string) => update(i, 'technologies', data[i].technologies.filter(x => x !== t));

  return (
    <div>
      <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#06b6d4', marginBottom: '4px' }}>💡 Mẹo về dự án</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Mô tả vai trò của bạn, công nghệ dùng và kết quả đạt được. Link demo hoặc GitHub code sẽ giúp bạn nổi bật hơn.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(99,102,241,0.03)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
            <FolderGit2 size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có dự án nào</p>
          </div>
        )}

        {data.map((proj, i) => (
          <div key={proj.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(6,182,212,0.04)', borderBottom: '1px solid var(--border)' }}>
              <GripVertical size={16} color="var(--text-muted)" />
              <p style={{ flex: 1, fontWeight: 700, fontSize: '0.9rem' }}>{proj.name || 'Dự án mới'}</p>
              <button onClick={() => remove(i)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ef4444' }}>
                <Trash2 size={14} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Tên dự án *</label>
                  <input className="input" placeholder="App Quản lý CV" value={proj.name} onChange={e => update(i, 'name', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Vai trò</label>
                  <input className="input" placeholder="Frontend Developer" value={proj.role || ''} onChange={e => update(i, 'role', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Link Demo (URL)</label>
                  <input className="input" placeholder="https://..." value={proj.url || ''} onChange={e => update(i, 'url', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>GitHub</label>
                  <input className="input" placeholder="github.com/user/repo" value={proj.github || ''} onChange={e => update(i, 'github', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Công nghệ sử dụng</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {proj.technologies.map(t => (
                    <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                      {t}
                      <button onClick={() => removeTech(i, t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0', display: 'flex' }}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input className="input" placeholder="React, TypeScript..." value={techInputs[i] || ''} onChange={e => { const n = [...techInputs]; n[i] = e.target.value; setTechInputs(n); }}
                    onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(i); }}}
                    style={{ flex: 1 }} />
                  <button onClick={() => addTech(i)} className="btn btn-secondary btn-sm">Thêm</button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Mô tả dự án</label>
                <textarea className="input" rows={4} placeholder="Mô tả dự án, vấn đề giải quyết, kết quả đạt được..." value={proj.description} onChange={e => update(i, 'description', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>
        ))}
        <button onClick={add} className="btn btn-outline" style={{ justifyContent: 'center', borderStyle: 'dashed' }}>
          <Plus size={16} /> Thêm dự án
        </button>
      </div>
    </div>
  );
}
