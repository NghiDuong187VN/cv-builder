'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

import type { QuotaStatusResponse } from '@/lib/quota';

export function useQuotaStatus(firebaseUser: FirebaseUser | null) {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatusResponse | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);

  const refreshQuota = useCallback(async () => {
    if (!firebaseUser) {
      setQuotaStatus(null);
      setQuotaLoading(false);
      return;
    }

    setQuotaLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/quota/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Không thể tải quota hiện tại.');
      }

      setQuotaStatus(result as QuotaStatusResponse);
    } catch (error) {
      console.error('Failed to load quota status:', error);
      setQuotaStatus(null);
    } finally {
      setQuotaLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void refreshQuota();
  }, [refreshQuota]);

  return {
    quotaStatus,
    quotaLoading,
    refreshQuota,
    setQuotaStatus,
  };
}
