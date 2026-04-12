'use client';
import { CVTheme } from '@/lib/types';

interface Props {
  theme: CVTheme;
  templateId: string;
  onUpdate: (t: Partial<CVTheme>) => void;
  onChangeTemplate: (id: string) => void;
}

const COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Slate', value: '#1e293b' },
  { name: 'Pink', value: '#ec4899' },
];

const FONTS = [
  { name: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Mặc định)' },
  { name: 'Inter', label: 'Inter (Hiện đại)' },
  { name: 'Roboto', label: 'Roboto (Quen thuộc)' },
  { name: 'Merriweather', label: 'Merriweather (Học thuật)' },
  { name: 'Playfair Display', label: 'Playfair Display (Sang trọng)' },
  { name: 'Montserrat', label: 'Montserrat (Năng động)' },
];

const TEMPLATES_QUICK = [
  { id: 'modern-01', label: '✨ Hiện Đại', colors: ['#6366f1', '#8b5cf6'] },
  { id: 'minimal-01', label: '⬛ Thanh Lịch', colors: ['#1e293b', '#64748b'] },
  { id: 'harvard-01', label: '📚 Harvard', colors: ['#1a1a1a', '#555555'] },
  { id: 'creative-01', label: '🎨 Sáng Tạo', colors: ['#ec4899', '#f59e0b'] },
  { id: 'tech-01', label: '💻 Developer', colors: ['#10b981', '#1e293b'] },
  { id: 'professional-01', label: '👔 Chuyên Nghiệp', colors: ['#1e3a5f', '#c9a84c'] },
  { id: 'student-01', label: '🎓 Sinh Viên', colors: ['#06b6d4', '#6366f1'] },
  { id: 'marketing-01', label: '📣 Marketing', colors: ['#f59e0b', '#ef4444'] },
];

export default function ThemePanel({ theme, templateId, onUpdate, onChangeTemplate }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Template selector */}
      <div>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          🖼 Mẫu giao diện
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {TEMPLATES_QUICK.map(t => (
            <button
              key={t.id}
              onClick={() => onChangeTemplate(t.id)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: `2px solid ${templateId === t.id ? 'var(--primary)' : 'var(--border)'}`,
                background: templateId === t.id ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: templateId === t.id ? 'var(--primary)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              <div style={{ width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0, background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Màu sắc */}
      <div>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          🎨 Màu chủ đạo
        </label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => onUpdate({ primaryColor: c.value })}
              title={c.name}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: c.value, border: 'none', cursor: 'pointer',
                outline: theme.primaryColor === c.value ? `3px solid ${c.value}` : 'none',
                outlineOffset: '3px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'all 0.15s',
                transform: theme.primaryColor === c.value ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Màu tùy chỉnh:</label>
          <input
            type="color"
            value={theme.primaryColor}
            onChange={e => onUpdate({ primaryColor: e.target.value })}
            style={{ width: '40px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', padding: '2px' }}
          />
          <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{theme.primaryColor}</span>
        </div>
      </div>

      {/* Font */}
      <div>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          🔤 Font chữ
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {FONTS.map(f => (
            <button
              key={f.name}
              onClick={() => onUpdate({ font: f.name })}
              style={{
                padding: '10px 14px', borderRadius: '10px',
                border: `1.5px solid ${theme.font === f.name ? 'var(--primary)' : 'var(--border)'}`,
                background: theme.font === f.name ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
                cursor: 'pointer', fontFamily: f.name, textAlign: 'left',
                fontWeight: 600, fontSize: '0.88rem',
                color: theme.font === f.name ? 'var(--primary)' : 'var(--text-secondary)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ảnh đại diện */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '2px' }}>Hiện ảnh đại diện</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Một số mẫu không cần ảnh</p>
        </div>
        <button
          onClick={() => onUpdate({ showAvatar: !theme.showAvatar })}
          style={{
            width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
            background: theme.showAvatar ? 'var(--primary)' : '#e2e8f0', transition: 'all 0.25s', position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', top: '3px',
            left: theme.showAvatar ? '24px' : '3px',
            width: '20px', height: '20px', borderRadius: '50%', background: 'white',
            transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>
    </div>
  );
}
