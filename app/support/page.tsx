import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { LIVE_CHAT_CONFIG, SUPPORT_INFO } from '@/lib/creator';
import { AlertCircle, Mail, MessageSquare, Phone } from 'lucide-react';

export default function SupportPage() {
  const supportChannels = [
    { label: 'Bộ phận', value: SUPPORT_INFO.teamName },
    { label: 'Vai trò', value: SUPPORT_INFO.role },
    { label: 'Email', value: SUPPORT_INFO.email },
    { label: 'Giờ hỗ trợ', value: SUPPORT_INFO.supportHours },
    ...(LIVE_CHAT_CONFIG.enabled
      ? [{ label: 'Live chat', value: 'Đang bật trên website' }]
      : []),
    ...(SUPPORT_INFO.phone ? [{ label: 'Điện thoại', value: SUPPORT_INFO.phone }] : []),
  ];

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '88px', minHeight: '100vh' }}>
        <div className="container" style={{ maxWidth: '920px', paddingBottom: '72px' }}>
          <div className="card" style={{ padding: '30px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <AlertCircle size={20} color="var(--primary)" />
              <h1 style={{ fontWeight: 800, fontSize: '1.45rem' }}>Hỗ trợ CVFlow</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{SUPPORT_INFO.message}</p>
          </div>

          <div className="card" style={{ padding: '30px' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '14px' }}>Thông tin liên hệ</h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              {supportChannels.map(item => (
                <Info key={item.label} label={item.label} value={item.value} />
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a href={`mailto:${SUPPORT_INFO.email}`} className="btn btn-primary">
                <Mail size={15} /> Email hỗ trợ
              </a>
              {LIVE_CHAT_CONFIG.enabled && (
                <span className="btn btn-outline" style={{ pointerEvents: 'none' }}>
                  <MessageSquare size={15} /> Live chat đang hiển thị ở góc màn hình
                </span>
              )}
              {SUPPORT_INFO.phone && (
                <a href={`tel:${SUPPORT_INFO.phone}`} className="btn btn-outline">
                  <Phone size={15} /> Gọi điện trực tiếp
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
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
