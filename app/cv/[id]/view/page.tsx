'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, Loader, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

import ExportButton from '@/components/cv/ExportButton';
import TemplateRenderer from '@/components/cv/TemplateRenderer';
import { getCVBySlug, incrementCVView } from '@/lib/firestore';
import type { CV } from '@/lib/types';

export default function ViewCVPage() {
  const params = useParams();
  const slug = params?.id as string;

  const [cv, setCv] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getCVBySlug(slug)
      .then(data => {
        if (!data) {
          setError(true);
          setLoading(false);
          return;
        }
        setCv(data);
        const mode = data.sharing?.mode || 'public';
        const passcode = data.sharing?.passcode || '';
        setAuthorized(mode !== 'password' || !passcode);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!cv || !authorized) return;
    incrementCVView(cv.cvId).catch(console.error);
  }, [cv, authorized]);

  const needPasscode = useMemo(() => {
    if (!cv) return false;
    return (cv.sharing?.mode || 'public') === 'password' && Boolean(cv.sharing?.passcode);
  }, [cv]);

  const submitPasscode = (e: FormEvent) => {
    e.preventDefault();
    if (!cv) return;
    const expected = cv.sharing?.passcode || '';
    if (enteredPasscode.trim() === expected) {
      setAuthorized(true);
      toast.success('Xác thực thành công');
    } else {
      toast.error('Mật khẩu không đúng');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px', background: '#e8ecf0' }}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Đang tải CV...</p>
        <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !cv) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '420px' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px', opacity: 0.8 }} />
          <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '8px', color: '#0f172a' }}>Không tìm thấy CV</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>Đường dẫn không hợp lệ hoặc chủ sở hữu đã tắt chia sẻ.</p>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (needPasscode && !authorized) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Lock size={18} color="var(--primary)" />
            <h1 style={{ fontWeight: 800, fontSize: '1.15rem' }}>CV được bảo vệ bằng mật khẩu</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.6 }}>Người chia sẻ đã bật chế độ chỉ người có mật khẩu mới xem được CV này.</p>
          <form onSubmit={submitPasscode} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input className="input" type="password" placeholder="Nhập mật khẩu xem CV" value={enteredPasscode} onChange={e => setEnteredPasscode(e.target.value)} />
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              Xác thực để xem
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#e8ecf0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary)', textDecoration: 'none' }}>
            CVFlow
          </Link>
          <div style={{ width: '1px', height: '16px', background: '#cbd5e1' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>{cv.title}</span>
        </div>
        <ExportButton cvId={cv.cvId} cvTitle={cv.title} />
      </div>

      <div style={{ flex: 1, padding: '40px 20px', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <div id="cv-preview" style={{ width: '794px', minWidth: '794px', background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
          <TemplateRenderer cv={cv} />
        </div>
      </div>
    </div>
  );
}

