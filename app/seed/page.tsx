'use client';
import { useState } from 'react';
import { seedTemplates } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { CheckCircle, Loader } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

export default function SeedPage() {
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedTemplates();
      setDone(true);
      toast.success('Đã nạp mẫu CV thành công! 🎉');
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi nạp templates');
    }
    setSeeding(false);
  };

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', gap: '20px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>🛠 Kho Dữ Liệu CV</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Khởi tạo kho mẫu giao diện CV vào Firestore của bạn</p>
        
        {done ? (
          <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 700, marginTop: '20px' }}>
            <CheckCircle /> Đã nạp thành công 6 mẫu CV Premium & Free!
          </div>
        ) : (
          <button 
            onClick={handleSeed} 
            disabled={seeding}
            className="btn btn-primary btn-lg" 
            style={{ marginTop: '20px' }}
          >
            {seeding ? <Loader className="spin" size={20} /> : '🚀 Nạp Dữ Liệu Mẫu CV (Click 1 lần)'}
          </button>
        )}
        
        {done && (
          <a href="/cv/new" className="btn btn-secondary" style={{ marginTop: '20px' }}>
            Quay lại trang Tạo CV →
          </a>
        )}
      </div>
      <style jsx global>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
