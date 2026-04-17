'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { useMobileViewport } from '@/hooks/useMobileViewport';

interface Props {
  storageKey: string;
}

export default function MobileEditorWarning({ storageKey }: Props) {
  const isMobileViewport = useMobileViewport();
  const [dismissedOverride, setDismissedOverride] = useState(false);
  const dismissedFromSession =
    typeof window !== 'undefined' && window.sessionStorage.getItem(storageKey) === '1';
  const dismissed = dismissedOverride || dismissedFromSession;

  if (!isMobileViewport || dismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(15, 23, 42, 0.64)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '22px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(245, 158, 11, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <AlertTriangle size={22} color="#f59e0b" />
        </div>
        <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Trải nghiệm tốt hơn trên máy tính
        </p>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Vui lòng sử dụng máy tính để có trải nghiệm thiết kế CV tốt nhất. Trên điện thoại, việc kéo thả và tinh chỉnh bố cục sẽ kém chính xác hơn.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              window.sessionStorage.setItem(storageKey, '1');
              setDismissedOverride(true);
            }}
          >
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
}
