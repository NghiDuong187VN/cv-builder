'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCVBySlug, incrementCVView } from '@/lib/firestore';
import { CV } from '@/lib/types';
import TemplateRenderer from '@/components/cv/TemplateRenderer';
import ExportButton from '@/components/cv/ExportButton';
import { Loader, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ViewCVPage() {
  const params = useParams();
  const slug = params?.id as string; // Reads [id]
  const [cv, setCv] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (slug) {
      getCVBySlug(slug).then(data => {
        if (data) {
          setCv(data);
          incrementCVView(data.cvId).catch(console.error);
        } else {
          setError(true);
        }
        setLoading(false);
      }).catch(() => {
        setError(true);
        setLoading(false);
      });
    }
  }, [slug]);

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
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '400px' }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '16px', opacity: 0.8 }} />
          <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '8px', color: '#0f172a' }}>Không tìm thấy CV</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
            Đường dẫn CV không tồn tại hoặc chủ sở hữu đã tắt tính năng chia sẻ công khai.
          </p>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
            Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#e8ecf0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner */}
      <div style={{ 
        background: 'white', padding: '12px 24px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary)', textDecoration: 'none' }}>
            CVFlow
          </Link>
          <div style={{ width: '1px', height: '16px', background: '#cbd5e1' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>
            {cv.title}
          </span>
        </div>
        
        <ExportButton cvId={cv.cvId} cvTitle={cv.title} />
      </div>

      {/* CV Viewer */}
      <div style={{ flex: 1, padding: '40px 20px', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <div id="cv-preview" style={{ 
          width: '794px', minWidth: '794px', 
          background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}>
          <TemplateRenderer cv={cv} />
        </div>
      </div>
    </div>
  );
}
