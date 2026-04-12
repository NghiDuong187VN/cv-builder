'use client';
import { useState } from 'react';
import { seedTemplates } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { CheckCircle, Loader, Crown, Zap, Database, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

const TEMPLATE_SUMMARY = [
  { tier: 'free', count: 12, label: 'Mẫu Miễn Phí', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: Zap, items: ['4 mẫu Cổ điển & ATS-Friendly', '2 mẫu Sinh Viên', '2 mẫu Hiện Đại', '1 mẫu Dev/IT', '1 mẫu Kế Toán', '1 mẫu Marketing', '1 mẫu Harvard Cổ Điển'] },
  { tier: 'premium', count: 23, label: 'Mẫu Premium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Crown, items: ['8 mẫu Chuyên Nghiệp Cao Cấp', '5 mẫu Sáng Tạo & Creative', '3 mẫu IT/Developer', '2 mẫu Marketing', '2 mẫu Sinh Viên Pro', '1 mẫu Kinh Doanh/Sales', '1 mẫu Nhân Sự', '1 mẫu Kế Toán Pro'] },
];

export default function SeedPage() {
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedTemplates();
      setDone(true);
      toast.success('Đã nạp 35 mẫu CV thành công! 🎉');
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi nạp templates');
    }
    setSeeding(false);
  };

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '100px', minHeight: '100vh', padding: '100px 24px 80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            }}>
              <Database size={32} color="white" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>
              🛠 Nạp Kho Mẫu CV
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.65 }}>
              Khởi tạo toàn bộ <strong>35 mẫu CV</strong> (12 miễn phí + 23 premium) vào Firestore.
              <br />Chỉ cần click một lần. Dữ liệu cũ sẽ được ghi đè.
            </p>
          </div>

          {/* Template summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            {TEMPLATE_SUMMARY.map(group => (
              <div key={group.tier} className="card" style={{ padding: '24px', border: `1px solid ${group.color}33` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: group.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <group.icon size={20} color={group.color} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', lineHeight: 1 }}>{group.count}</p>
                    <p style={{ fontSize: '0.82rem', color: group.color, fontWeight: 700 }}>{group.label}</p>
                  </div>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {group.items.map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: group.color, flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Action */}
          <div style={{ textAlign: 'center' }}>
            {done ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 32px', borderRadius: '16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle size={28} color="#10b981" />
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10b981' }}>Đã nạp thành công 35 mẫu CV!</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>12 miễn phí · 23 premium · Sẵn sàng trên trang Templates</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Link href="/templates" className="btn btn-primary">
                    Xem kho mẫu CV <ArrowRight size={16} />
                  </Link>
                  <Link href="/cv/new" className="btn btn-secondary">
                    Tạo CV mới
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  ⚠️ Thao tác này sẽ ghi đè tất cả templates hiện có trong Firestore.
                </p>
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  className="btn btn-primary"
                  style={{ fontSize: '1rem', padding: '14px 36px' }}
                >
                  {seeding ? (
                    <>
                      <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      Đang nạp 35 mẫu...
                    </>
                  ) : (
                    <>
                      <Database size={20} /> 🚀 Nạp 35 Mẫu CV vào Firestore
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
