'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, FileText, Eye, Download, Copy, Trash2, ExternalLink, MoreVertical } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getCVsByUser, deleteCV, duplicateCV } from '@/lib/firestore';
import { CV } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import toast from 'react-hot-toast';

export default function CVManagerPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !firebaseUser) router.push('/auth');
  }, [loading, firebaseUser, router]);

  useEffect(() => {
    if (firebaseUser) {
      getCVsByUser(firebaseUser.uid).then(data => { setCvs(data); setDataLoading(false); });
    }
  }, [firebaseUser]);

  const handleDelete = async (cvId: string, title: string) => {
    if (!confirm(`Xóa CV "${title}"? Hành động này không thể hoàn tác.`)) return;
    await deleteCV(cvId);
    setCvs(prev => prev.filter(c => c.cvId !== cvId));
    toast.success('Đã xóa CV');
  };

  const handleDuplicate = async (cv: CV) => {
    if (!firebaseUser) return;
    const id = toast.loading('Đang sao chép...');
    const newId = await duplicateCV(cv, firebaseUser.uid);
    const updated = await getCVsByUser(firebaseUser.uid);
    setCvs(updated);
    toast.success('Đã tạo bản sao!', { id });
    router.push(`/cv/${newId}/edit`);
  };

  if (loading || dataLoading) return <LoadingScreen />;

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <div className="container" style={{ padding: '40px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '6px' }}>
                📄 CV của tôi
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>Quản lý tất cả các CV của bạn</p>
            </div>
            <Link href="/cv/new" className="btn btn-primary">
              <Plus size={18} /> Tạo CV Mới
            </Link>
          </div>

          {cvs.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="card" style={{ padding: '80px', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📄</div>
              <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '12px' }}>Bắt đầu hành trình của bạn</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 28px', lineHeight: 1.7 }}>
                Tạo CV đầu tiên với hàng chục mẫu đẹp. Chỉ mất 5 phút để có một CV chuyên nghiệp.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link href="/cv/new" className="btn btn-primary btn-lg"><Plus size={20} /> Tạo CV đầu tiên</Link>
                <Link href="/templates" className="btn btn-secondary btn-lg">Xem mẫu CV</Link>
              </div>
            </motion.div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Create new card */}
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <Link href="/cv/new" style={{ textDecoration: 'none' }}>
                  <div className="card" style={{
                    padding: '32px', textAlign: 'center',
                    border: '2px dashed var(--primary)', background: 'rgba(99,102,241,0.04)',
                    cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '12px', minHeight: '200px',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                  >
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={24} color="white" />
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>Tạo CV Mới</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>Bắt đầu từ mẫu trống hoặc chọn template</p>
                  </div>
                </Link>
              </motion.div>

              {cvs.map((cv, i) => (
                <motion.div
                  key={cv.cvId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <FullCVCard
                    cv={cv}
                    onDelete={() => handleDelete(cv.cvId, cv.title)}
                    onDuplicate={() => handleDuplicate(cv)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FullCVCard({ cv, onDelete, onDuplicate }: { cv: CV; onDelete: () => void; onDuplicate: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryColor = cv.theme?.primaryColor || '#6366f1';

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
      {/* Color header */}
      <div style={{ height: '80px', background: `linear-gradient(135deg, ${primaryColor}, ${cv.theme?.secondaryColor || '#8b5cf6'})`, position: 'relative', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={16} color="white" />
          </div>
          {cv.isPublic && (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'rgba(255,255,255,0.25)', color: 'white', padding: '2px 10px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.3)' }}>
              Công khai
            </span>
          )}
        </div>
        {/* Menu */}
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white' }}
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '4px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 10, minWidth: '160px',
            }}>
              {[
                { icon: Copy, label: 'Sao chép CV', action: () => { onDuplicate(); setMenuOpen(false); } },
                { icon: ExternalLink, label: 'Xem CV', action: () => { window.open(`/cv/${cv.shareSlug}/view`, '_blank'); setMenuOpen(false); } },
                { icon: Trash2, label: 'Xóa', action: () => { onDelete(); setMenuOpen(false); }, danger: true },
              ].map(({ icon: Icon, label, action, danger }) => (
                <button key={label} onClick={action} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: danger ? '#ef4444' : 'var(--text-secondary)',
                  width: '100%', textAlign: 'left', fontSize: '0.87rem', fontWeight: 500,
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '18px 20px 20px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{cv.title}</h3>
        {cv.targetJob && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>🎯 {cv.targetJob}</p>}

        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Eye size={12} /> {cv.viewCount}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Download size={12} /> {cv.downloadCount}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/cv/${cv.cvId}/edit`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            Chỉnh sửa
          </Link>
          <Link href={`/cv/${cv.shareSlug}/view`} target="_blank" className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>
            <Eye size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <div className="container" style={{ padding: '40px 24px' }}>
          <div className="skeleton" style={{ height: '40px', width: '200px', marginBottom: '32px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '20px' }} />)}
          </div>
        </div>
      </div>
    </>
  );
}
