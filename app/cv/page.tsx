'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Lock,
  MoreVertical,
  Plus,
  Share2,
  Trash2,
  Unlock,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { deleteCV, duplicateCV, getCVsByUser, updateCV } from '@/lib/firestore';
import type { CV, CVShareMode } from '@/lib/types';

type ShareSettings = {
  isPublic: boolean;
  mode: CVShareMode;
  passcode: string;
};

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
      getCVsByUser(firebaseUser.uid).then(data => {
        setCvs(data);
        setDataLoading(false);
      });
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
    toast.success('Đã tạo bản sao', { id });
    router.push(`/cv/${newId}/edit`);
  };

  const handleSaveShare = async (cv: CV, settings: ShareSettings) => {
    const patch: Partial<CV> = {
      isPublic: settings.isPublic,
      sharing: {
        mode: settings.mode,
        passcode: settings.mode === 'password' ? settings.passcode : '',
      },
    };

    await updateCV(cv.cvId, patch);
    setCvs(prev => prev.map(item => (item.cvId === cv.cvId ? { ...item, ...patch } as CV : item)));
    toast.success('Đã lưu cài đặt chia sẻ');
  };

  if (loading || dataLoading) return <LoadingScreen />;

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <div className="container" style={{ padding: '40px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '6px' }}>CV của tôi</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Quản lý tất cả CV và cài đặt chia sẻ bằng đường link</p>
            </div>
            <Link href="/cv/new" className="btn btn-primary">
              <Plus size={18} /> Tạo CV mới
            </Link>
          </div>

          {cvs.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '80px', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📄</div>
              <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '12px' }}>Bắt đầu tạo CV đầu tiên</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 28px', lineHeight: 1.7 }}>Tạo CV và chia sẻ nhanh qua link công khai hoặc link có mật khẩu.</p>
              <Link href="/cv/new" className="btn btn-primary btn-lg">
                <Plus size={20} /> Tạo CV ngay
              </Link>
            </motion.div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <Link href="/cv/new" style={{ textDecoration: 'none' }}>
                  <div
                    className="card"
                    style={{
                      padding: '32px',
                      textAlign: 'center',
                      border: '2px dashed var(--primary)',
                      background: 'rgba(99,102,241,0.04)',
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      minHeight: '220px',
                    }}
                  >
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={24} color="white" />
                    </div>
                    <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>Tạo CV mới</p>
                  </div>
                </Link>
              </motion.div>

              {cvs.map((cv, i) => (
                <motion.div key={cv.cvId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <FullCVCard cv={cv} onDelete={() => handleDelete(cv.cvId, cv.title)} onDuplicate={() => handleDuplicate(cv)} onSaveShare={handleSaveShare} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FullCVCard({
  cv,
  onDelete,
  onDuplicate,
  onSaveShare,
}: {
  cv: CV;
  onDelete: () => void;
  onDuplicate: () => void;
  onSaveShare: (cv: CV, settings: ShareSettings) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [savingShare, setSavingShare] = useState(false);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: cv.isPublic,
    mode: cv.sharing?.mode || 'public',
    passcode: cv.sharing?.passcode || '',
  });

  const primaryColor = cv.theme?.primaryColor || '#6366f1';
  const publicLink = typeof window !== 'undefined' ? `${window.location.origin}/cv/${cv.shareSlug}/view` : `/cv/${cv.shareSlug}/view`;
  const protectedMode = shareSettings.mode === 'password';

  useEffect(() => {
    setShareSettings({
      isPublic: cv.isPublic,
      mode: cv.sharing?.mode || 'public',
      passcode: cv.sharing?.passcode || '',
    });
  }, [cv.cvId, cv.isPublic, cv.sharing?.mode, cv.sharing?.passcode]);

  const copyLink = async () => {
    if (!shareSettings.isPublic) {
      toast.error('Hãy bật chia sẻ trước khi copy link');
      return;
    }
    const text = protectedMode ? `${publicLink}\nMật khẩu: ${shareSettings.passcode || '(chưa đặt)'}` : publicLink;
    await navigator.clipboard.writeText(text);
    toast.success('Đã copy thông tin chia sẻ');
  };

  const saveShareSettings = async () => {
    if (shareSettings.isPublic && shareSettings.mode === 'password' && shareSettings.passcode.trim().length < 4) {
      toast.error('Mật khẩu phải có ít nhất 4 ký tự');
      return;
    }
    setSavingShare(true);
    try {
      await onSaveShare(cv, { ...shareSettings, passcode: shareSettings.passcode.trim() });
    } finally {
      setSavingShare(false);
    }
  };

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ height: '84px', background: `linear-gradient(135deg, ${primaryColor}, ${cv.theme?.secondaryColor || '#8b5cf6'})`, position: 'relative', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={16} color="white" />
          </div>
          {cv.isPublic ? (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'rgba(255,255,255,0.25)', color: 'white', padding: '2px 10px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.3)' }}>
              {cv.sharing?.mode === 'password' ? 'Có mật khẩu' : 'Công khai'}
            </span>
          ) : (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'rgba(15,23,42,0.3)', color: 'white', padding: '2px 10px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.24)' }}>Riêng tư</span>
          )}
        </div>
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white' }}>
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 10, minWidth: '170px' }}>
              {[
                { icon: Copy, label: 'Sao chép CV', action: () => { onDuplicate(); setMenuOpen(false); } },
                { icon: ExternalLink, label: 'Xem CV', action: () => { window.open(`/cv/${cv.shareSlug}/view`, '_blank'); setMenuOpen(false); } },
                { icon: Trash2, label: 'Xóa', action: () => { onDelete(); setMenuOpen(false); }, danger: true },
              ].map(({ icon: Icon, label, action, danger }) => (
                <button key={label} onClick={action} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: danger ? '#ef4444' : 'var(--text-secondary)', width: '100%', textAlign: 'left', fontSize: '0.87rem', fontWeight: 500 }}>
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

        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <Link href={`/cv/${cv.cvId}/edit`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            Chỉnh sửa
          </Link>
          <button onClick={() => setShareOpen(v => !v)} className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>
            <Share2 size={14} />
          </button>
          <Link href={`/cv/${cv.shareSlug}/view`} target="_blank" className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>
            <Eye size={14} />
          </Link>
        </div>

        {shareOpen && (
          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', background: 'rgba(99,102,241,0.04)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>Cài đặt chia sẻ</p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={shareSettings.isPublic} onChange={e => setShareSettings(prev => ({ ...prev, isPublic: e.target.checked }))} />
                Bật chia sẻ
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                disabled={!shareSettings.isPublic}
                onClick={() => setShareSettings(prev => ({ ...prev, mode: 'public' }))}
                className="btn btn-ghost btn-sm"
                style={{
                  border: `1px solid ${shareSettings.mode === 'public' ? 'var(--primary)' : 'var(--border)'}`,
                  color: shareSettings.mode === 'public' ? 'var(--primary)' : 'var(--text-secondary)',
                  opacity: shareSettings.isPublic ? 1 : 0.5,
                }}
              >
                <Unlock size={13} /> Ai có link đều xem
              </button>
              <button
                disabled={!shareSettings.isPublic}
                onClick={() => setShareSettings(prev => ({ ...prev, mode: 'password' }))}
                className="btn btn-ghost btn-sm"
                style={{
                  border: `1px solid ${shareSettings.mode === 'password' ? 'var(--primary)' : 'var(--border)'}`,
                  color: shareSettings.mode === 'password' ? 'var(--primary)' : 'var(--text-secondary)',
                  opacity: shareSettings.isPublic ? 1 : 0.5,
                }}
              >
                <Lock size={13} /> Chỉ người có mật khẩu
              </button>
            </div>

            {shareSettings.isPublic && shareSettings.mode === 'password' && (
              <input className="input" type="text" placeholder="Nhập mật khẩu chia sẻ (>= 4 ký tự)" value={shareSettings.passcode} onChange={e => setShareSettings(prev => ({ ...prev, passcode: e.target.value }))} />
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveShareSettings} disabled={savingShare} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                {savingShare ? 'Đang lưu...' : 'Lưu chia sẻ'}
              </button>
              <button onClick={copyLink} className="btn btn-outline btn-sm">
                <Copy size={13} /> Copy link
              </button>
            </div>

            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Link chia sẻ: {publicLink}
            </p>
          </div>
        )}
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
          <div className="skeleton" style={{ height: '40px', width: '220px', marginBottom: '32px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '260px', borderRadius: '20px' }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

