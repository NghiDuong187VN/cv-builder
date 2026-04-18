'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader, Printer } from 'lucide-react';

import TemplateRenderer from '@/components/cv/TemplateRenderer';
import { useAuth } from '@/hooks/useAuth';
import { useQuotaStatus } from '@/hooks/useQuotaStatus';
import { getCV, getCVBySlug, incrementCVDownload } from '@/lib/firestore';
import type { CV } from '@/lib/types';

async function waitForImages(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll('img'));

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

async function waitForFonts() {
  const fontApi = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (fontApi?.ready) {
    await fontApi.ready;
  }
}

export default function PrintCvPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const identifier = params?.id as string;
  const { firebaseUser, loading: authLoading } = useAuth();
  const { quotaStatus } = useQuotaStatus(firebaseUser);

  const [cv, setCv] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasAutoPrinted = useRef(false);

  const shouldAutoPrint = useMemo(() => searchParams.get('autoprint') === '1', [searchParams]);

  useEffect(() => {
    if (!identifier || authLoading) return;

    let active = true;

    const loadCv = async () => {
      setLoading(true);
      setError('');

      try {
        let nextCv = await getCV(identifier).catch(() => null);

        if (nextCv && !nextCv.isPublic && nextCv.uid !== firebaseUser?.uid) {
          nextCv = null;
        }

        if (!nextCv) {
          nextCv = await getCVBySlug(identifier).catch(() => null);
        }

        if (!active) return;

        if (!nextCv) {
          setError('Không tìm thấy CV để in.');
          setCv(null);
          setLoading(false);
          return;
        }

        const requiresPasscode =
          (nextCv.sharing?.mode || 'public') === 'password' && Boolean(nextCv.sharing?.passcode);

        if (requiresPasscode && nextCv.uid !== firebaseUser?.uid) {
          const sessionPasscode = window.sessionStorage.getItem(`cvflow-share-passcode:${nextCv.cvId}`);
          if (sessionPasscode !== (nextCv.sharing?.passcode || '')) {
            setError('CV này cần được xác thực bằng mật khẩu trước khi in.');
            setCv(null);
            setLoading(false);
            return;
          }
        }

        setCv(nextCv);
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setError('Không thể tải bản in CV.');
        setCv(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadCv();

    return () => {
      active = false;
    };
  }, [authLoading, firebaseUser?.uid, identifier]);

  useEffect(() => {
    if (!cv || !shouldAutoPrint || hasAutoPrinted.current) return;

    const runPrint = async () => {
      const root = document.getElementById('cv-print-document');
      if (!root) return;

      await waitForFonts();
      await waitForImages(root);
      await incrementCVDownload(cv.cvId).catch(() => null);

      hasAutoPrinted.current = true;

      // Update document title so that "Save as PDF" defaults to CV_HoTen_ViTri.pdf
      const fullName = (cv.content.personalInfo?.fullName || 'Untitled').trim().replace(/\s+/g, '_');
      const targetJob = (cv.targetJob || cv.title || 'CV').trim().replace(/\s+/g, '_');
      const originalTitle = document.title;
      document.title = `CV_${fullName}_${targetJob}`;

      window.setTimeout(() => {
        // We use native window.print() instead of html2canvas/jsPDF because:
        // 1. html2canvas renders CV as an image -> text is NOT selectable, failing ATS parsing completely.
        // 2. Browser native print preserves real text nodes, fonts, vectors, and creates ATS-friendly PDFs.
        // 3. react-pdf requires rewriting all templates to primitive components, losing Tailwind support.
        window.print();
        
        // Restore title after print dialog opens
        setTimeout(() => { document.title = originalTitle; }, 1000);
      }, 180);
    };

    const handleAfterPrint = () => {
      try {
        window.close();
      } catch {
        // Ignore browsers that block self-close on manually opened tabs.
      }
    };

    window.addEventListener('afterprint', handleAfterPrint);
    void runPrint();

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [cv, shouldAutoPrint]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          background: '#f8fafc',
        }}
      >
        <Loader size={30} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>Đang chuẩn bị bản in PDF chuẩn ATS...</p>
        <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !cv) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            borderRadius: '20px',
            background: 'white',
            border: '1px solid #e2e8f0',
            boxShadow: '0 24px 80px rgba(15, 23, 42, 0.12)',
            padding: '28px',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={42} color="#ef4444" style={{ marginBottom: '14px' }} />
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Không thể tạo bản in
          </p>
          <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>
            {error || 'CV không tồn tại hoặc bạn không có quyền truy cập.'}
          </p>
          <Link href="/cv" className="btn btn-primary">
            Quay lại danh sách CV
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="print-toolbar">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <div>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{cv.title}</p>
            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Đây là bản in text-based để lưu PDF thân thiện với ATS. Hãy chọn “Save as PDF” trong hộp thoại in.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
            <Printer size={14} /> In / lưu PDF
          </button>
        </div>
      </div>

      <div
        className="print-shell"
        style={{
          minHeight: '100vh',
          background: '#e2e8f0',
          padding: '32px 20px 48px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          id="cv-print-document"
          style={{
            position: 'relative',
            width: '794px',
            minWidth: '794px',
            background: '#fff',
            boxShadow: '0 18px 60px rgba(15, 23, 42, 0.16)',
            overflow: 'hidden',
          }}
        >
          <TemplateRenderer cv={cv} />
          
          {/* Watermark Logic */}
           {(!firebaseUser || (!quotaStatus?.isPremium && !cv.watermarkRemoved)) && (
             <div 
               className="pdf-watermark"
               style={{
                 position: 'absolute',
                 bottom: '10px',
                 right: '20px',
                 fontSize: '0.8rem',
                 fontWeight: 700,
                 color: 'rgba(0,0,0,0.3)',
                 pointerEvents: 'none',
                 fontFamily: 'sans-serif'
               }}
             >
               Tạo bởi CVFlow.vn
             </div>
           )}
        </div>
      </div>

      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html,
          body {
            background: #fff !important;
          }

          .print-toolbar {
            display: none !important;
          }

          .print-shell {
            padding: 0 !important;
            background: #fff !important;
          }

          #cv-print-document {
            width: 210mm !important;
            min-width: 210mm !important;
            min-height: 297mm !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          
          /* Tối ưu không bị cắt chữ giữa dòng khi in nhiều trang */
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
            break-after: avoid;
          }
          ul, ol, dl, section, article, .experience-item, .education-item, li {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
}
