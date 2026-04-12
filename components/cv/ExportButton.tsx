'use client';

import { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

import { incrementCVDownload } from '@/lib/firestore';

interface Props {
  cvId: string;
  cvTitle: string;
}

type Html2PdfOptions = {
  margin: number;
  filename: string;
  image: { type?: 'jpeg' | 'png' | 'webp'; quality: number };
  html2canvas: {
    scale: number;
    useCORS: boolean;
    backgroundColor: string;
    windowWidth: number;
    windowHeight: number;
    scrollX: number;
    scrollY: number;
  };
  jsPDF: { unit: 'px'; format: [number, number]; orientation: 'portrait' };
  pagebreak: { mode: string[] };
};

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

function sanitizeFilename(name: string): string {
  const safe = name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '_');
  return safe || 'cvflow_cv';
}

async function waitForAllImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(
      img =>
        new Promise<void>(resolve => {
          img.crossOrigin = 'anonymous';
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

async function waitForFonts(): Promise<void> {
  const fontApi = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (fontApi?.ready) {
    await fontApi.ready;
  }
}

function createExportClone(source: HTMLElement): { root: HTMLDivElement; clone: HTMLElement } {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '-100000px';
  root.style.top = '0';
  root.style.width = `${A4_WIDTH_PX}px`;
  root.style.background = '#fff';
  root.style.zIndex = '-1';
  root.style.pointerEvents = 'none';

  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.minWidth = `${A4_WIDTH_PX}px`;
  clone.style.maxWidth = `${A4_WIDTH_PX}px`;
  clone.style.boxShadow = 'none';
  clone.style.margin = '0';
  clone.style.background = '#fff';
  clone.style.transform = 'none';

  root.appendChild(clone);
  document.body.appendChild(root);
  return { root, clone };
}

export default function ExportButton({ cvId, cvTitle }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading('Đang tạo file PDF...');
    let cleanupNode: HTMLDivElement | null = null;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const source = document.getElementById('cv-preview');
      if (!source) {
        toast.error('Không tìm thấy CV preview', { id: toastId });
        return;
      }

      await waitForFonts();
      const { root, clone } = createExportClone(source);
      cleanupNode = root;
      await waitForAllImages(clone);

      const options: Html2PdfOptions = {
        margin: 0,
        filename: `${sanitizeFilename(cvTitle)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: A4_WIDTH_PX,
          windowHeight: A4_HEIGHT_PX,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: {
          unit: 'px',
          format: [A4_WIDTH_PX, A4_HEIGHT_PX],
          orientation: 'portrait',
        },
        pagebreak: { mode: ['css', 'legacy'] },
      };

      await html2pdf().set(options).from(clone).save();
      await incrementCVDownload(cvId);
      toast.success('Tải CV thành công', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xuất PDF, vui lòng thử lại', { id: toastId });
    } finally {
      if (cleanupNode) cleanupNode.remove();
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="btn btn-secondary btn-sm"
      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
    >
      {exporting ? (
        <>
          <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang xuất...
        </>
      ) : (
        <>
          <Download size={14} /> Tải PDF
        </>
      )}
    </button>
  );
}

