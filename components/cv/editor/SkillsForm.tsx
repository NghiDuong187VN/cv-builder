'use client';
import { Skill } from '@/lib/types';
import { Plus, Trash2, Wand2 } from 'lucide-react';

interface Props { data: Skill[]; onChange: (d: Skill[]) => void; }

const QUICK_ADD_SKILLS: Record<string, string[]> = {
  'Kỹ năng mềm': ['Giao tiếp', 'Làm việc nhóm', 'Giải quyết vấn đề', 'Tư duy phản biện', 'Quản lý thời gian'],
  'Frontend': ['HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Tailwind CSS'],
  'Backend': ['Node.js', 'Python', 'Java', 'PHP', 'Express.js', 'Django', 'Spring Boot'],
  'Database': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase'],
  'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Git'],
};

const LEVEL_LABELS: Record<number, string> = { 20: 'Cơ bản', 40: 'Trung bình', 60: 'Khá', 80: 'Tốt', 100: 'Chuyên gia' };

const newSkill = (): Skill => ({ name: '', level: 80, category: 'hard' });

export default function SkillsForm({ data, onChange }: Props) {
  const update = (i: number, field: keyof Skill, val: string | number) => {
    const list = [...data]; list[i] = { ...list[i], [field]: val }; onChange(list);
  };
  const remove = (i: number) => onChange(data.filter((_, j) => j !== i));
  const add = () => onChange([...data, newSkill()]);
  const quickAdd = (name: string) => { if (!data.find(s => s.name === name)) onChange([...data, { name, level: 80, category: 'hard' }]); };

  const levelLabel = (level: number) => {
    const key = Math.ceil(level / 20) * 20;
    return LEVEL_LABELS[Math.min(key, 100)] || 'Tốt';
  };

  return (
    <div>
      {/* Quick add */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          <Wand2 size={14} style={{ display: 'inline', marginRight: '4px' }} /> Thêm nhanh
        </p>
        {Object.entries(QUICK_ADD_SKILLS).map(([cat, skills]) => (
          <div key={cat} style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>{cat}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.map(s => {
                const added = data.some(d => d.name === s);
                return (
                  <button
                    key={s}
                    onClick={() => added ? onChange(data.filter(d => d.name !== s)) : quickAdd(s)}
                    style={{
                      fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '9999px',
                      background: added ? 'var(--primary)' : 'var(--bg-base)',
                      color: added ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${added ? 'var(--primary)' : 'var(--border)'}`,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >{added ? '✓ ' : '+ '}{s}</button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Danh sách kỹ năng</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.map((skill, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px' }}>
              <input
                className="input"
                placeholder="Tên kỹ năng"
                value={skill.name}
                onChange={e => update(i, 'name', e.target.value)}
                style={{ flex: 2, minWidth: 0 }}
              />
              <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <input
                  type="range" min={10} max={100} step={10}
                  value={skill.level}
                  onChange={e => update(i, 'level', Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span>{skill.level}%</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{levelLabel(skill.level)}</span>
                </div>
              </div>
              <button onClick={() => remove(i)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button onClick={add} className="btn btn-outline btn-sm" style={{ justifyContent: 'center', borderStyle: 'dashed' }}>
            <Plus size={14} /> Thêm kỹ năng khác
          </button>
        </div>
      </div>
    </div>
  );
}
