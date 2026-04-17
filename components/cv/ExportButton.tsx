'use client';

import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  cvTitle: string;
  printPath: string;
}

function buildPrintUrl(printPath: string) {
  return `${printPath}${printPath.includes('?') ? '&' : '?'}autoprint=1`;
}

export default function ExportButton({ cvTitle, printPath }: Props) {
  const handleExport = () => {
    const nextWindow = window.open(buildPrintUrl(printPath), '_blank', 'noopener,noreferrer');

    if (!nextWindow) {
      toast.error('Trình duyệt đang chặn cửa sổ in PDF. Hãy cho phép popup và thử lại.');
      return;
    }

    toast.success(`Đang mở bản in text-based cho "${cvTitle}"`);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="btn btn-secondary btn-sm"
      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
    >
      <Download size={14} /> Xuất PDF
    </button>
  );
}
