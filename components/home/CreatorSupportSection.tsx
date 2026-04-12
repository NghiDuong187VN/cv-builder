import Link from 'next/link';
import { AlertTriangle, Mail, MessageCircle, Phone } from 'lucide-react';
import { CREATOR_INFO } from '@/lib/creator';

export default function CreatorSupportSection() {
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
          <p style={{ color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.7 }}>{CREATOR_INFO.message}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <Info label="Người tạo web" value={`${CREATOR_INFO.name} (${CREATOR_INFO.role})`} />
            <Info label="Email" value={CREATOR_INFO.email} />
            <Info label="Điện thoại" value={CREATOR_INFO.phone} />
            <Info label="Thời gian hỗ trợ" value={CREATOR_INFO.supportHours} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <a href={CREATOR_INFO.zaloUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <MessageCircle size={15} /> Liên hệ nhanh Zalo
            </a>
            <a href={`mailto:${CREATOR_INFO.email}`} className="btn btn-outline">
              <Mail size={15} /> Gửi Email
            </a>
            <a href={`tel:${CREATOR_INFO.phone}`} className="btn btn-outline">
              <Phone size={15} /> Gọi ngay
            </a>
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
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', background: 'var(--bg-card)' }}>
      <p style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</p>
    </div>
  );
}

