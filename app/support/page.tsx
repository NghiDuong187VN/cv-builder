import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CREATOR_INFO } from '@/lib/creator';
import { AlertCircle, Mail, MessageCircle, Phone } from 'lucide-react';

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '88px', minHeight: '100vh' }}>
        <div className="container" style={{ maxWidth: '920px', paddingBottom: '72px' }}>
          <div className="card" style={{ padding: '30px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <AlertCircle size={20} color="var(--primary)" />
              <h1 style={{ fontWeight: 800, fontSize: '1.45rem' }}>Hỗ trợ sự cố CVFlow</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{CREATOR_INFO.message}</p>
          </div>

          <div className="card" style={{ padding: '30px' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '14px' }}>Thông tin người tạo web</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              <Info label="Họ tên" value={CREATOR_INFO.name} />
              <Info label="Vai trò" value={CREATOR_INFO.role} />
              <Info label="Email" value={CREATOR_INFO.email} />
              <Info label="Điện thoại" value={CREATOR_INFO.phone} />
              <Info label="Giờ hỗ trợ" value={CREATOR_INFO.supportHours} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a href={CREATOR_INFO.zaloUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <MessageCircle size={15} /> Liên hệ nhanh Zalo
              </a>
              <a href={`mailto:${CREATOR_INFO.email}`} className="btn btn-outline">
                <Mail size={15} /> Email hỗ trợ
              </a>
              <a href={`tel:${CREATOR_INFO.phone}`} className="btn btn-outline">
                <Phone size={15} /> Gọi điện trực tiếp
              </a>
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
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', background: 'var(--bg-card)' }}>
      <p style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</p>
    </div>
  );
}

