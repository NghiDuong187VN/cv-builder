'use client';
import { Experience } from '@/lib/types';
import { Plus, Trash2, GripVertical, Briefcase } from 'lucide-react';

interface Props {
  data: Experience[];
  onChange: (data: Experience[]) => void;
  lang: 'vi' | 'en';
}

const TIPS = [
  '✅ Mô tả thành tích cụ thể, dùng số liệu: "Tăng doanh số 30%", "Quản lý team 5 người"',
  '✅ Bắt đầu bằng động từ hành động: Phát triển, Xây dựng, Quản lý, Tối ưu...',
  '✅ Sắp xếp từ gần nhất đến xa nhất (mới nhất lên trên)',
];

const newExp = (): Experience => ({
  id: Date.now().toString(),
  company: '', role: '', location: '', from: '', to: '', current: false, description: '',
});

export default function ExperienceForm({ data, onChange, lang }: Props) {
  const update = (i: number, field: keyof Experience, val: string | boolean) => {
    const list = [...data];
    list[i] = { ...list[i], [field]: val };
    onChange(list);
  };
  const remove = (i: number) => onChange(data.filter((_, j) => j !== i));
  const add = () => onChange([...data, newExp()]);

  return (
    <div>
      {/* Tips */}
      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#10b981', marginBottom: '8px' }}>💡 Mẹo viết kinh nghiệm</p>
        {TIPS.map((t, i) => <p key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>{t}</p>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(99,102,241,0.03)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
            <Briefcase size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có kinh nghiệm nào</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Thêm kinh nghiệm làm việc của bạn</p>
          </div>
        )}

        {data.map((exp, i) => (
          <div key={exp.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
            {/* Header thanh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(99,102,241,0.04)', borderBottom: '1px solid var(--border)' }}>
              <GripVertical size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {exp.role || 'Vị trí mới'} {exp.company ? `— ${exp.company}` : ''}
                </p>
              </div>
              <button onClick={() => remove(i)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Công ty *</label>
                  <input className="input" placeholder="Tên công ty" value={exp.company} onChange={e => update(i, 'company', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Vị trí *</label>
                  <input className="input" placeholder="Frontend Developer" value={exp.role} onChange={e => update(i, 'role', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Địa điểm</label>
                <input className="input" placeholder="Hồ Chí Minh" value={exp.location || ''} onChange={e => update(i, 'location', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Từ tháng *</label>
                  <input className="input" type="month" value={exp.from} onChange={e => update(i, 'from', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Đến tháng</label>
                  <input className="input" type="month" value={exp.to} disabled={exp.current} onChange={e => update(i, 'to', e.target.value)} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                <input type="checkbox" checked={exp.current} onChange={e => { update(i, 'current', e.target.checked); if (e.target.checked) update(i, 'to', ''); }} />
                Đang làm việc tại đây
              </label>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Mô tả công việc & thành tích</label>
                <textarea
                  className="input"
                  rows={5}
                  placeholder={"- Phát triển các tính năng mới cho sản phẩm...\n- Tối ưu hiệu suất trang web, giảm thời gian tải 40%...\n- Làm việc trong môi trường Agile/Scrum..."}
                  value={exp.description}
                  onChange={e => update(i, 'description', e.target.value)}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          </div>
        ))}

        <button onClick={add} className="btn btn-outline" style={{ justifyContent: 'center', borderStyle: 'dashed' }}>
          <Plus size={16} /> Thêm kinh nghiệm
        </button>
      </div>
    </div>
  );
}
