'use client';

import Link from 'next/link';
import { Briefcase, GripVertical, Plus, Trash2 } from 'lucide-react';

import { Experience } from '@/lib/types';

interface Props {
  data: Experience[];
  onChange: (data: Experience[]) => void;
  lang: 'vi' | 'en';
  aiPlan?: 'free' | 'premium';
  canRewriteWithAi?: boolean;
  aiStatusLoading?: boolean;
  aiLoadingIndex?: number | null;
  onRewriteWithAi?: (index: number) => void;
}

const TIPS = [
  'Mo ta thanh tich cu the va nen co so lieu khi co the, vi du: "Tang doanh so 30%" hoac "Quan ly team 5 nguoi".',
  'Bat dau bang dong tu hanh dong nhu: Phat trien, Xay dung, Quan ly, Toi uu.',
  'Sap xep kinh nghiem tu moi nhat den cu hon de nha tuyen dung doc nhanh hon.',
];

const newExp = (): Experience => ({
  id: Date.now().toString(),
  company: '',
  role: '',
  location: '',
  from: '',
  to: '',
  current: false,
  description: '',
});

export default function ExperienceForm({
  data,
  onChange,
  lang,
  aiPlan = 'free',
  canRewriteWithAi = false,
  aiStatusLoading = false,
  aiLoadingIndex = null,
  onRewriteWithAi,
}: Props) {
  const update = (index: number, field: keyof Experience, value: string | boolean) => {
    const next = [...data];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const remove = (index: number) => onChange(data.filter((_, currentIndex) => currentIndex !== index));
  const add = () => onChange([...data, newExp()]);

  return (
    <div>
      <div
        style={{
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '10px',
          padding: '12px 14px',
          marginBottom: '16px',
        }}
      >
        <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#10b981', marginBottom: '8px' }}>
          Meo viet kinh nghiem
        </p>
        {TIPS.map((tip) => (
          <p key={tip} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
            {tip}
          </p>
        ))}
      </div>

      <div
        style={{
          marginBottom: '16px',
          borderRadius: '12px',
          border: `1px solid ${
            aiPlan === 'premium' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.22)'
          }`,
          background: aiPlan === 'premium' ? 'rgba(99,102,241,0.05)' : 'rgba(245,158,11,0.06)',
          padding: '12px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {aiPlan === 'premium'
                ? 'AI rewrite da san sang cho tung kinh nghiem'
                : 'AI rewrite kinh nghiem can Premium hoac credit'}
            </p>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {aiPlan === 'premium'
                ? 'Nhan "AI viet lai" de chuyen mo ta hien tai thanh bullet manh hon, dung van phong CV.'
                : 'Ban co the mo khoa bang Premium hoac dung credit de viet lai bullet kinh nghiem bang Gemini.'}
            </p>
          </div>
          {aiPlan !== 'premium' && (
            <Link href="/pricing" className="btn btn-outline btn-sm" style={{ whiteSpace: 'nowrap' }}>
              Premium / Credit
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px',
              background: 'rgba(99,102,241,0.03)',
              borderRadius: '12px',
              border: '1px dashed var(--border)',
            }}
          >
            <Briefcase size={28} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Chua co kinh nghiem nao
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Them kinh nghiem lam viec cua ban
            </p>
          </div>
        )}

        {data.map((exp, index) => (
          <div
            key={exp.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'rgba(99,102,241,0.04)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <GripVertical size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {exp.role || 'Vi tri moi'} {exp.company ? `- ${exp.company}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRewriteWithAi?.(index)}
                disabled={!canRewriteWithAi || aiLoadingIndex === index}
                className="btn btn-ghost btn-sm"
                style={{ flexShrink: 0, opacity: canRewriteWithAi ? 1 : 0.6 }}
                title={
                  canRewriteWithAi
                    ? 'Viet lai mo ta bang AI'
                    : aiStatusLoading
                      ? 'Dang kiem tra quyen AI'
                      : 'Can Premium hoac credit'
                }
              >
                {aiLoadingIndex === index ? 'Dang viet...' : 'AI viet lai'}
              </button>
              <button
                onClick={() => remove(index)}
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#ef4444',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    Cong ty *
                  </label>
                  <input
                    className="input"
                    placeholder="Ten cong ty"
                    value={exp.company}
                    onChange={(event) => update(index, 'company', event.target.value)}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    Vi tri *
                  </label>
                  <input
                    className="input"
                    placeholder="Frontend Developer"
                    value={exp.role}
                    onChange={(event) => update(index, 'role', event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                  }}
                >
                  Dia diem
                </label>
                <input
                  className="input"
                  placeholder="Ho Chi Minh"
                  value={exp.location || ''}
                  onChange={(event) => update(index, 'location', event.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    Tu thang *
                  </label>
                  <input
                    className="input"
                    type="month"
                    value={exp.from}
                    onChange={(event) => update(index, 'from', event.target.value)}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    Den thang
                  </label>
                  <input
                    className="input"
                    type="month"
                    value={exp.to}
                    disabled={exp.current}
                    onChange={(event) => update(index, 'to', event.target.value)}
                  />
                </div>
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(event) => {
                    update(index, 'current', event.target.checked);
                    if (event.target.checked) update(index, 'to', '');
                  }}
                />
                {lang === 'vi' ? 'Dang lam viec tai day' : 'I currently work here'}
              </label>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                  }}
                >
                  Mo ta cong viec va thanh tich
                </label>
                <textarea
                  className="input"
                  rows={5}
                  placeholder={
                    '- Phat trien cac tinh nang moi cho san pham...\n- Toi uu hieu suat trang web, giam thoi gian tai 40%...\n- Lam viec trong moi truong Agile/Scrum...'
                  }
                  value={exp.description}
                  onChange={(event) => update(index, 'description', event.target.value)}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          </div>
        ))}

        <button onClick={add} className="btn btn-outline" style={{ justifyContent: 'center', borderStyle: 'dashed' }}>
          <Plus size={16} /> Them kinh nghiem
        </button>
      </div>
    </div>
  );
}
