'use client';

import { useState } from 'react';
import { Download, Sparkles, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useQuotaStatus } from '@/hooks/useQuotaStatus';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  cvTitle: string;
  printPath: string;
  cvId: string;
  watermarkRemoved?: boolean;
}

function buildPrintUrl(printPath: string) {
  return `${printPath}${printPath.includes('?') ? '&' : '?'}autoprint=1`;
}

export default function ExportButton({ cvTitle, printPath, cvId, watermarkRemoved }: Props) {
  const { firebaseUser } = useAuth();
  const { quotaStatus } = useQuotaStatus(firebaseUser);
  const router = useRouter();
  
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const performExport = () => {
    setShowModal(false);
    const nextWindow = window.open(buildPrintUrl(printPath), '_blank', 'noopener,noreferrer');
    if (!nextWindow) {
      toast.error('Trình duyệt đang chặn cửa sổ in PDF. Hãy cho phép popup và thử lại.');
      return;
    }
    toast.success(`Đang mở bản in PDF cho "${cvTitle}"`);
  };

  const handleExportClick = () => {
    // If premium OR watermark is already removed -> just print
    if (quotaStatus?.isPremium || watermarkRemoved) {
      performExport();
      return;
    }
    // Else show modal to decide whether to export with watermark or pay credit
    setShowModal(true);
  };

  const handleRemoveWatermark = async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/cv/${cvId}/buy-export`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          toast.error(data.message || 'Không đủ credit!');
          router.push('/pricing');
          setShowModal(false);
          return;
        }
        throw new Error(data.error);
      }
      toast.success('Đã xóa Watermark cho CV này!');
      performExport();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleExportClick}
        className="btn btn-secondary btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <Download size={14} /> Xuất PDF
      </button>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24
        }}>
          <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', maxWidth: '420px', width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(99,102,241,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Download size={28} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Tùy chọn Xuất PDF</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Bạn đang sử dụng gói Miễn Phí. Bản in PDF sẽ có đóng dấu watermark của hệ thống.
            </p>

            <div style={{ display: 'grid', gap: '12px' }}>
              <button onClick={handleRemoveWatermark} disabled={loading} className="btn btn-primary" style={{ padding: '14px', width: '100%', justifyContent: 'center' }}>
                {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }}/> : <><Sparkles size={16} /> Xóa Watermark (1 Credit)</>}
              </button>
              
              <button onClick={performExport} disabled={loading} className="btn btn-outline" style={{ padding: '14px', width: '100%', justifyContent: 'center' }}>
                Tải miễn phí (Gắn kèm Watermark)
              </button>
              
              <button onClick={() => setShowModal(false)} disabled={loading} className="btn btn-ghost" style={{ padding: '10px', width: '100%', justifyContent: 'center', marginTop: '4px' }}>
                Đóng
              </button>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
        </div>
      )}
    </>
  );
}
