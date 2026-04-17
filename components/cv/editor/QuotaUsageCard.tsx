'use client';

interface Props {
  aiUsed: number;
  aiLimit: number | null;
  cvUsed: number;
  cvLimit: number | null;
  variant?: 'compact' | 'panel';
}

export default function QuotaUsageCard({
  aiUsed,
  aiLimit,
  cvUsed,
  cvLimit,
  variant = 'panel',
}: Props) {
  if (variant === 'compact') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <QuotaPill label={buildCompactLabel('Lượt AI hôm nay', aiUsed, aiLimit)} tone={getTone(aiUsed, aiLimit)} />
        <QuotaPill label={buildCompactLabel('CV đã tạo', cvUsed, cvLimit)} tone={getTone(cvUsed, cvLimit)} />
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: '14px',
        border: '1px solid rgba(99,102,241,0.14)',
        background: 'rgba(99,102,241,0.05)',
        padding: '14px',
      }}
    >
      <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
        Quota tài khoản
      </p>
      <div style={{ display: 'grid', gap: '12px' }}>
        <QuotaRow
          label="Lượt AI hôm nay"
          used={aiUsed}
          limit={aiLimit}
          accent={getProgressAccent(aiUsed, aiLimit)}
        />
        <QuotaRow
          label="CV đã tạo"
          used={cvUsed}
          limit={cvLimit}
          accent={getProgressAccent(cvUsed, cvLimit)}
        />
      </div>
    </div>
  );
}

function QuotaRow({
  label,
  used,
  limit,
  accent,
}: {
  label: string;
  used: number;
  limit: number | null;
  accent: string;
}) {
  const width = limit ? `${Math.min((used / limit) * 100, 100)}%` : '100%';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{formatUsage(used, limit)}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width, background: accent }} />
      </div>
    </div>
  );
}

function QuotaPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        border: `1px solid ${tone}`,
        color: tone,
        background: `${tone}14`,
      }}
    >
      {label}
    </span>
  );
}

function formatUsage(used: number, limit: number | null) {
  if (limit === null) {
    return `${used} / Không giới hạn`;
  }

  return `${used}/${limit}`;
}

function buildCompactLabel(prefix: string, used: number, limit: number | null) {
  return `${prefix}: ${formatUsage(used, limit)}`;
}

function getTone(used: number, limit: number | null) {
  if (limit === null) {
    return '#6366f1';
  }
  const ratio = limit === 0 ? 1 : used / limit;
  if (ratio >= 1) return '#ef4444';
  if (ratio >= 0.66) return '#d97706';
  return '#6366f1';
}

function getProgressAccent(used: number, limit: number | null) {
  if (limit === null) {
    return 'linear-gradient(90deg, #6366f1, #8b5cf6)';
  }
  const ratio = limit === 0 ? 1 : used / limit;
  if (ratio >= 1) return 'linear-gradient(90deg, #ef4444, #f97316)';
  if (ratio >= 0.66) return 'linear-gradient(90deg, #f59e0b, #f97316)';
  return 'linear-gradient(90deg, #6366f1, #8b5cf6)';
}
