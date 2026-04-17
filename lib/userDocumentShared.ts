export type UserDocumentProfile = {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};

type UserDocumentBase = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  username: string;
  plan: 'free';
  planExpiry: null;
  isActive: true;
  isAdmin: boolean;
  settings: {
    language: 'vi';
    theme: 'light';
  };
};

function normalizeString(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getConfiguredAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

export function generateUsername(seed: string) {
  const normalizedSeed = seed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);
  const fallback = normalizedSeed || 'user';
  const suffix = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0');

  return `${fallback}${suffix}`;
}

export function buildUserDocumentBase(uid: string, profile: UserDocumentProfile): UserDocumentBase {
  const email = normalizeString(profile.email);
  const displayName = normalizeString(profile.displayName);
  const photoURL = normalizeString(profile.photoURL);

  return {
    uid,
    email,
    displayName,
    photoURL,
    username: generateUsername(displayName || email || uid),
    plan: 'free',
    planExpiry: null,
    isActive: true,
    isAdmin: getConfiguredAdminEmails().includes(email),
    settings: {
      language: 'vi',
      theme: 'light',
    },
  };
}
