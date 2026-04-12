'use client';
import { Education } from '@/lib/types';
import { Plus, Trash2, GripVertical, GraduationCap } from 'lucide-react';

interface Props { data: Education[]; onChange: (d: Education[]) => void; }

const newEdu = (): Education => ({
  id: Date.now().toString(), school: '', degree: '', field: '', from: '', to: '', gpa: '', achievements: '',
});

export default function EducationForm({ data, onChange }: Props) {
  const update = (i: number, field: keyof Education, val: string) => {
    const list = [...data]; list[i] = { ...list[i], [field]: val }; onChange(list);
  };
  const remove = (i: number) => onChange(data.filter((_, j) => j !== i));
  const add = () => onChange([...data, newEdu()]);

  return (
    <div>
      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '6px' }}>💡 Mẹo về học vấn</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Ghi GPA nếu &gt; 3.2/4.0 hoặc &gt; 8.0/10.0. Liệt kê thành tích học tập và học bổng.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(99,102,241,0.03)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
            <GraduationCap size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có học vấn nào</p>
          </div>
        )}

        {data.map((edu, i) => (
          <div key={edu.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(99,102,241,0.04)', borderBottom: '1px solid var(--border)' }}>
              <GripVertical size={16} color="var(--text-muted)" />
              <p style={{ flex: 1, fontWeight: 700, fontSize: '0.9rem' }}>{edu.school || 'Trường học mới'}</p>
              <button onClick={() => remove(i)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ef4444' }}>
                <Trash2 size={14} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Tên trường *</label>
                <input className="input" placeholder="Đại học Bách Khoa TP.HCM" value={edu.school} onChange={e => update(i, 'school', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Bằng cấp *</label>
                  <select className="input" value={edu.degree} onChange={e => update(i, 'degree', e.target.value)}>
                    <option value="">-- Chọn --</option>
                    <option>Trung học phổ thông</option>
                    <option>Cao đẳng</option>
                    <option>Cử nhân</option>
                    <option>Kỹ sư</option>
                    <option>Thạc sĩ</option>
                    <option>Tiến sĩ</option>
                    <option>Chứng chỉ</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Chuyên ngành</label>
                  <input className="input" placeholder="Kỹ thuật phần mềm" value={edu.field} onChange={e => update(i, 'field', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Từ năm</label>
                  <input className="input" type="month" value={edu.from} onChange={e => update(i, 'from', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Đến năm</label>
                  <input className="input" type="month" value={edu.to} onChange={e => update(i, 'to', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>GPA</label>
                  <input className="input" placeholder="3.8/4.0" value={edu.gpa || ''} onChange={e => update(i, 'gpa', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Thành tích / Học bổng</label>
                <textarea className="input" rows={3} placeholder="Học bổng xuất sắc, Giải nhất cuộc thi..." value={edu.achievements || ''} onChange={e => update(i, 'achievements', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>
        ))}

        <button onClick={add} className="btn btn-outline" style={{ justifyContent: 'center', borderStyle: 'dashed' }}>
          <Plus size={16} /> Thêm học vấn
        </button>
      </div>
    </div>
  );
}
