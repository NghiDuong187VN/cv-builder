import Link from 'next/link';
import { AlertTriangle, Mail, MessageSquare, Phone } from 'lucide-react';
import { LIVE_CHAT_CONFIG, SUPPORT_INFO } from '@/lib/creator';

export default function CreatorSupportSection() {
  const supportHighlights = [
    { label: 'Bộ phận hỗ trợ', value: `${SUPPORT_INFO.teamName} (${SUPPORT_INFO.role})` },
    { label: 'Email', value: SUPPORT_INFO.email },
    { label: 'Thời gian hỗ trợ', value: SUPPORT_INFO.supportHours },
    ...(LIVE_CHAT_CONFIG.enabled
      ? [{ label: 'Live chat', value: 'Đang bật trên website' }]
      : []),
    ...(SUPPORT_INFO.phone ? [{ label: 'Điện thoại', value: SUPPORT_INFO.phone }] : []),
  ];

  return (
    <section style={{ padding: '24px 0 72px' }}>
      <div className="container">
        <div
          className="card"
          style={{
            padding: '28px',
            border: '1px solid rgba(99,102,241,0.25)',
            background: 'linear-gradient(180deg, rgba(99,102,241,0.07), rgba(99,102,241,0.02))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <AlertTriangle size={18} color="var(--primary)" />
            <h2 style={{ fontWeight: 800, fontSize: '1.15rem' }}>Hỗ trợ khi gặp sự cố</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.7 }}>
            {SUPPORT_INFO.message}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            {supportHighlights.map(item => (
              <Info key={item.label} label={item.label} value={item.value} />
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <a href={`mailto:${SUPPORT_INFO.email}`} className="btn btn-primary">
              <Mail size={15} /> Gửi email hỗ trợ
            </a>
            {LIVE_CHAT_CONFIG.enabled && (
              <Link href="/support" className="btn btn-outline">
                <MessageSquare size={15} /> Xem hướng dẫn live chat
              </Link>
            )}
            {SUPPORT_INFO.phone && (
              <a href={`tel:${SUPPORT_INFO.phone}`} className="btn btn-outline">
                <Phone size={15} /> Gọi trực tiếp
              </a>
            )}
            <Link href="/support" className="btn btn-ghost">
              Xem trang hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '12px',
        background: 'var(--bg-card)',
      }}
    >
      <p
        style={{
          fontSize: '0.76rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          marginBottom: '6px',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
        {value}
      </p>
    </div>
  );
}
