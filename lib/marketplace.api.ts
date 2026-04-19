/**
 * marketplace.api.ts
 * Client-side helper functions that call the marketplace API routes.
 * Always pass the Firebase ID token from the current user.
 */

export async function purchaseTemplate(
  templateId: string,
  idToken: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const res = await fetch('/api/marketplace/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ templateId }),
  });
  return res.json();
}

export async function applyAsSeller(
  data: { displayName: string; bio: string; website?: string; portfolio?: string },
  idToken: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/seller/apply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitSellerTemplate(
  data: Record<string, unknown>,
  idToken: string
): Promise<{ success: boolean; templateId?: string; slug?: string; error?: string }> {
  const res = await fetch('/api/seller/templates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function adminReviewTemplate(
  data: { templateId: string; action: 'approve' | 'reject' | 'suspend'; rejectionReason?: string },
  idToken: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/admin/marketplace/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function adminReviewSeller(
  data: { sellerId: string; action: 'approve' | 'reject'; rejectionReason?: string },
  idToken: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/admin/marketplace/review', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}
