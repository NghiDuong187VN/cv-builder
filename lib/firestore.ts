import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  CV,
  Profile,
  Template,
  CVSection,
  CoverLetter,
  PersonalInfo,
  CvAiHistoryRecord,
} from './types';
import type { AiHistoryRecord } from './types';

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value) {
    const v = value as { toMillis?: () => number };
    if (typeof v.toMillis === 'function') return v.toMillis();
  }
  return 0;
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10);
}

function removeUndefined<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as T;
}

const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  fullName: '',
  jobTitle: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  gender: '',
  linkedin: '',
  github: '',
  website: '',
  avatarUrl: '',
};

const DEFAULT_SECTIONS: CVSection[] = [
  'personalInfo', 'summary', 'experience', 'education',
  'skills', 'projects', 'certificates', 'activities', 'languages',
];

// â”€â”€â”€ Profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db, 'profiles', uid));
  return snap.exists() ? (snap.data() as Profile) : null;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const q = query(
    collection(db, 'profiles'),
    where('username', '==', username),
    where('isPublic', '==', true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Profile;
}

export async function saveProfile(uid: string, data: Partial<Profile>): Promise<void> {
  await setDoc(
    doc(db, 'profiles', uid),
    { ...data, uid, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function incrementProfileView(uid: string): Promise<void> {
  await updateDoc(doc(db, 'profiles', uid), { viewCount: increment(1) });
}

// â”€â”€â”€ CVs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getCVsByUser(uid: string): Promise<CV[]> {
  const q = query(collection(db, 'cvs'), where('uid', '==', uid));
  const snap = await getDocs(q);
  const cvs = snap.docs.map(d => ({ ...d.data(), cvId: d.id } as CV));
  return cvs.sort((a, b) => {
    const timeA = toMillis(a.updatedAt);
    const timeB = toMillis(b.updatedAt);
    return timeB - timeA;
  });
}

export async function getCV(cvId: string): Promise<CV | null> {
  const snap = await getDoc(doc(db, 'cvs', cvId));
  return snap.exists() ? ({ ...snap.data(), cvId: snap.id } as CV) : null;
}

export async function getCVBySlug(slug: string): Promise<CV | null> {
  const q = query(
    collection(db, 'cvs'),
    where('shareSlug', '==', slug),
    where('isPublic', '==', true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { ...snap.docs[0].data(), cvId: snap.docs[0].id } as CV;
}

export async function createCV(uid: string, data: Partial<CV>): Promise<string> {
  const ref = doc(collection(db, 'cvs'));
  const shareSlug = generateSlug();
  await setDoc(ref, {
    ...data,
    cvId: ref.id,
    uid,
    shareSlug,
    sharing: data.sharing || { mode: 'public', passcode: '' },
    viewCount: 0,
    downloadCount: 0,
    language: data.language || 'vi',
    sections: data.sections || {
      order: DEFAULT_SECTIONS,
      visibility: Object.fromEntries(DEFAULT_SECTIONS.map(s => [s, true])),
    },
    content: {
      personalInfo: DEFAULT_PERSONAL_INFO,
      summary: '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certificates: [],
      activities: [],
      interests: [],
      languages: [],
      ...(data.content || {}),
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCV(cvId: string, data: Partial<CV>): Promise<void> {
  await updateDoc(doc(db, 'cvs', cvId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCV(cvId: string): Promise<void> {
  await deleteDoc(doc(db, 'cvs', cvId));
}

export async function duplicateCV(cv: CV, uid: string): Promise<string> {
  const { cvId: _cvId, shareSlug: _slug, ...rest } = cv;
  return createCV(uid, {
    ...rest,
    title: `${rest.title} (Báº£n sao)`,
    isPublic: false,
    sharing: { mode: 'public', passcode: '' },
  });
}

export async function incrementCVView(cvId: string): Promise<void> {
  await updateDoc(doc(db, 'cvs', cvId), { viewCount: increment(1) });
}
export async function incrementCVDownload(cvId: string): Promise<void> {
  await updateDoc(doc(db, 'cvs', cvId), { downloadCount: increment(1) });
}

export async function createCvAiHistory(
  cvId: string,
  data: Omit<CvAiHistoryRecord, 'id' | 'createdAt'>
): Promise<string> {
  const ref = doc(collection(db, 'cvs', cvId, 'aiHistory'));
  await setDoc(ref, {
    ...removeUndefined({
      action: data.action,
      accepted: data.accepted,
      oldText: data.oldText,
      newText: data.newText,
      targetJob: data.targetJob,
      targetCompany: data.targetCompany,
      metadata: data.metadata,
    }),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCvAiHistory(
  cvId: string,
  historyId: string,
  data: Partial<Omit<CvAiHistoryRecord, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(
    doc(db, 'cvs', cvId, 'aiHistory', historyId),
    removeUndefined({
      action: data.action,
      accepted: data.accepted,
      oldText: data.oldText,
      newText: data.newText,
      targetJob: data.targetJob,
      targetCompany: data.targetCompany,
      metadata: data.metadata,
    })
  );
}

export async function getCvAiHistory(cvId: string): Promise<CvAiHistoryRecord[]> {
  const snap = await getDocs(collection(db, 'cvs', cvId, 'aiHistory'));
  const records = snap.docs.map((entry) => ({ ...entry.data(), id: entry.id } as CvAiHistoryRecord));

  return records.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function getAiHistoryByUser(uid: string): Promise<AiHistoryRecord[]> {
  const snap = await getDocs(query(collection(db, 'aiHistory'), where('userId', '==', uid)));
  const records = snap.docs.map((entry) => ({ ...entry.data(), id: entry.id } as AiHistoryRecord));

  return records.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

// â”€â”€â”€ Cover Letters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getCoverLettersByUser(uid: string): Promise<CoverLetter[]> {
  const q = query(collection(db, 'coverletters'), where('uid', '==', uid));
  const snap = await getDocs(q);
  const cls = snap.docs.map(d => ({ ...d.data(), id: d.id } as CoverLetter));
  return cls.sort((a, b) => {
    const tA = toMillis(a.updatedAt);
    const tB = toMillis(b.updatedAt);
    return tB - tA;
  });
}

export async function getCoverLetter(id: string): Promise<CoverLetter | null> {
  const snap = await getDoc(doc(db, 'coverletters', id));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as CoverLetter) : null;
}

export async function createCoverLetter(uid: string, data: Partial<CoverLetter>): Promise<string> {
  const ref = doc(collection(db, 'coverletters'));
  await setDoc(ref, {
    ...data,
    id: ref.id,
    uid,
    content: data.content || '',
    templateId: data.templateId || 'classic',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCoverLetter(id: string, data: Partial<CoverLetter>): Promise<void> {
  await updateDoc(doc(db, 'coverletters', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCoverLetter(id: string): Promise<void> {
  await deleteDoc(doc(db, 'coverletters', id));
}

// â”€â”€â”€ Templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getTemplates(): Promise<Template[]> {
  const snap = await getDocs(
    query(collection(db, 'templates'), where('isActive', '==', true))
  );
  return snap.docs.map(d => d.data() as Template);
}

export const TEMPLATES: Omit<Template, 'createdAt'>[] = [
    // â”€â”€â”€ MIá»„N PHÃ â€“ Cá»• Ä‘iá»ƒn & ATS-Friendly (8 máº«u) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      templateId: 'classic-ats-01', name: 'ATS Classic 1', nameVi: 'Cá»• Äiá»ƒn 1',
      category: 'minimal', role: 'all', tier: 'free',
      description: 'Single column, ATS-safe, clean black & white, serif font',
      descriptionVi: 'Má»™t cá»™t Ä‘Æ¡n giáº£n, ATS-friendly, Ä‘en tráº¯ng sáº¡ch sáº½, font serif â€“ phá»• biáº¿n nháº¥t',
      colors: ['#1a1a1a', '#555555'], isActive: true, usageCount: 1240, previewUrl: '',
    },
    {
      templateId: 'classic-ats-02', name: 'ATS Modern 1', nameVi: 'Hiá»‡n Äáº¡i 1',
      category: 'minimal', role: 'all', tier: 'free',
      description: 'Single column with thin accent line, ATS-friendly',
      descriptionVi: 'Má»™t cá»™t vá»›i Ä‘Æ°á»ng accent má»ng, thÃ¢n thiá»‡n ATS, rÃµ rÃ ng',
      colors: ['#2563eb', '#1e293b'], isActive: true, usageCount: 980, previewUrl: '',
    },
    {
      templateId: 'classic-ats-03', name: 'ATS Minimal', nameVi: 'Tá»‘i Giáº£n',
      category: 'minimal', role: 'all', tier: 'free',
      description: 'Ultra-clean, minimal typography, no decorative elements',
      descriptionVi: 'Cá»±c ká»³ tá»‘i giáº£n, chá»‰ text, khÃ´ng hoa vÄƒn â€“ chuáº©n ATS tuyá»‡t Ä‘á»‘i',
      colors: ['#374151', '#6b7280'], isActive: true, usageCount: 762, previewUrl: '',
    },
    {
      templateId: 'classic-ats-04', name: 'ATS Navy', nameVi: 'Cá»• Äiá»ƒn Navy',
      category: 'minimal', role: 'all', tier: 'free',
      description: 'Navy header accent, clean single column layout',
      descriptionVi: 'Header navy xanh Ä‘áº­m, bá»‘ cá»¥c má»™t cá»™t chuyÃªn nghiá»‡p',
      colors: ['#1e3a5f', '#475569'], isActive: true, usageCount: 543, previewUrl: '',
    },
    {
      templateId: 'student-simple-01', name: 'Student Basic', nameVi: 'Sinh ViÃªn CÆ¡ Báº£n',
      category: 'student', role: 'student', tier: 'free',
      description: 'Clean layout for students, no experience required',
      descriptionVi: 'Bá»‘ cá»¥c sáº¡ch cho sinh viÃªn chÆ°a cÃ³ kinh nghiá»‡m Ä‘i lÃ m',
      colors: ['#06b6d4', '#0e7490'], isActive: true, usageCount: 1560, previewUrl: '',
    },
    {
      templateId: 'student-simple-02', name: 'Intern Ready', nameVi: 'Thá»±c Táº­p Sinh',
      category: 'student', role: 'student', tier: 'free',
      description: 'Bright teal, emphasizes skills & activities',
      descriptionVi: 'MÃ u teal tÆ°Æ¡i sÃ¡ng, nháº¥n máº¡nh ká»¹ nÄƒng vÃ  hoáº¡t Ä‘á»™ng ngoáº¡i khoÃ¡',
      colors: ['#0d9488', '#6366f1'], isActive: true, usageCount: 890, previewUrl: '',
    },
    {
      templateId: 'modern-simple-01', name: 'Modern Pro', nameVi: 'Hiá»‡n Äáº¡i Pro',
      category: 'modern', role: 'all', tier: 'free',
      description: 'Gradient header, modern layout, great for most roles',
      descriptionVi: 'Header gradient Ä‘áº¹p, bá»‘ cá»¥c hiá»‡n Ä‘áº¡i, phÃ¹ há»£p má»i vá»‹ trÃ­',
      colors: ['#6366f1', '#8b5cf6'], isActive: true, usageCount: 2100, previewUrl: '',
    },
    {
      templateId: 'modern-simple-02', name: 'Clean Sidebar', nameVi: 'Thanh Lá»‹ch 2 Cá»™t',
      category: 'modern', role: 'all', tier: 'free',
      description: '2-column sidebar, accent color, professional look',
      descriptionVi: 'Bá»‘ cá»¥c 2 cá»™t, sidebar mÃ u nháº¥n, trÃ´ng ráº¥t chuyÃªn nghiá»‡p',
      colors: ['#1e293b', '#64748b'], isActive: true, usageCount: 1320, previewUrl: '',
    },

    // â”€â”€â”€ MIá»„N PHÃ â€“ Theo ngÃ nh (4 máº«u) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      templateId: 'tech-basic-01', name: 'Dev Terminal', nameVi: 'Láº­p TrÃ¬nh ViÃªn',
      category: 'tech', role: 'developer', tier: 'free',
      description: 'Dark code-themed layout with green accent for developers',
      descriptionVi: 'Ná»n tá»‘i kiá»ƒu terminal, accent xanh lÃ¡, dÃ nh riÃªng cho developer/IT',
      colors: ['#10b981', '#1e293b'], isActive: true, usageCount: 1890, previewUrl: '',
    },
    {
      templateId: 'accountant-basic-01', name: 'Finance Classic', nameVi: 'Káº¿ ToÃ¡n Cá»• Äiá»ƒn',
      category: 'minimal', role: 'accountant', tier: 'free',
      description: 'Conservative, clean, blue-grey palette for finance roles',
      descriptionVi: 'Bá»‘ cá»¥c báº£o thá»§, sáº¡ch sáº½, mÃ u xanh xÃ¡m cho káº¿ toÃ¡n, tÃ i chÃ­nh',
      colors: ['#1e40af', '#94a3b8'], isActive: true, usageCount: 670, previewUrl: '',
    },
    {
      templateId: 'marketing-basic-01', name: 'Brand Story', nameVi: 'Marketing CÆ¡ Báº£n',
      category: 'marketing', role: 'marketing', tier: 'free',
      description: 'Bold orange accent, achievement-first layout',
      descriptionVi: 'Accent cam Ä‘áº­m, nháº¥n máº¡nh thÃ nh tÃ­ch, phÃ¹ há»£p marketing/sales',
      colors: ['#f59e0b', '#ef4444'], isActive: true, usageCount: 1100, previewUrl: '',
    },
    {
      templateId: 'harvard-classic-01', name: 'Harvard Classic', nameVi: 'Harvard Cá»• Äiá»ƒn',
      category: 'professional', role: 'all', tier: 'free',
      description: 'Traditional academic CV format, serif font, timeless',
      descriptionVi: 'Format CV há»c thuáº­t truyá»n thá»‘ng Harvard, font serif, vÆ°á»£t thá»i gian',
      colors: ['#991b1b', '#1a1a1a'], isActive: true, usageCount: 440, previewUrl: '',
    },

    // â”€â”€â”€ PREMIUM â€“ ChuyÃªn nghiá»‡p cao cáº¥p (8 máº«u) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      templateId: 'premium-executive-01', name: 'Executive Suite', nameVi: 'Äiá»u HÃ nh Cao Cáº¥p',
      category: 'professional', role: 'all', tier: 'premium',
      description: 'Navy & gold, authoritative executive design with photo',
      descriptionVi: 'Xanh navy & vÃ ng sang trá»ng, dÃ nh cho quáº£n lÃ½ vÃ  Ä‘iá»u hÃ nh',
      colors: ['#1e3a5f', '#c9a84c'], isActive: true, usageCount: 330, previewUrl: '',
    },
    {
      templateId: 'premium-executive-02', name: 'Corporate Leader', nameVi: 'LÃ£nh Äáº¡o Doanh Nghiá»‡p',
      category: 'professional', role: 'all', tier: 'premium',
      description: 'Dark charcoal with silver accents, senior management look',
      descriptionVi: 'Ná»n xÃ¡m Ä‘áº­m, accent báº¡c, phong cÃ¡ch quáº£n lÃ½ cáº¥p cao',
      colors: ['#1f2937', '#9ca3af'], isActive: true, usageCount: 220, previewUrl: '',
    },
    {
      templateId: 'premium-modern-01', name: 'Gradient Pro', nameVi: 'Gradient Pro',
      category: 'modern', role: 'all', tier: 'premium',
      description: 'Full gradient header, modern layout, 2-column professional',
      descriptionVi: 'Header gradient toÃ n bá» máº·t, bá»‘ cá»¥c 2 cá»™t hiá»‡n Ä‘áº¡i cao cáº¥p',
      colors: ['#8b5cf6', '#ec4899'], isActive: true, usageCount: 890, previewUrl: '',
    },
    {
      templateId: 'premium-modern-02', name: 'Clarity Pro', nameVi: 'RÃµ NÃ©t Pro',
      category: 'modern', role: 'all', tier: 'premium',
      description: 'Ultra-clean white, blue accent, maximises readability',
      descriptionVi: 'Ná»n tráº¯ng cá»±c sáº¡ch, accent xanh dÆ°Æ¡ng, tá»‘i Æ°u kháº£ nÄƒng Ä‘á»c',
      colors: ['#2563eb', '#dbeafe'], isActive: true, usageCount: 560, previewUrl: '',
    },
    {
      templateId: 'premium-modern-03', name: 'Ambitious', nameVi: 'Tham Vá»ng',
      category: 'modern', role: 'all', tier: 'premium',
      description: 'Bold typography, emerald green, career-driven design',
      descriptionVi: 'Typography Ä‘áº­m, mÃ u xanh emerald, thiáº¿t káº¿ cho ngÆ°á»i tham vá»ng',
      colors: ['#059669', '#064e3b'], isActive: true, usageCount: 410, previewUrl: '',
    },
    {
      templateId: 'premium-modern-04', name: 'Outstanding', nameVi: 'áº¤n TÆ°á»£ng',
      category: 'modern', role: 'all', tier: 'premium',
      description: 'Violet accent, asymmetric layout, stands out instantly',
      descriptionVi: 'Accent tÃ­m, bá»‘ cá»¥c báº¥t Ä‘á»‘i xá»©ng, ná»•i báº­t ngay láº­p tá»©c',
      colors: ['#7c3aed', '#c4b5fd'], isActive: true, usageCount: 730, previewUrl: '',
    },
    {
      templateId: 'premium-minimal-01', name: 'Senior Pro', nameVi: 'ChuyÃªn Gia Cao Cáº¥p',
      category: 'professional', role: 'all', tier: 'premium',
      description: 'Understated elegance, for senior professionals with extensive experience',
      descriptionVi: 'Tinh táº¿ khÃ´ng phÃ´ trÆ°Æ¡ng, dÃ nh cho chuyÃªn gia dÃ y dáº·n kinh nghiá»‡m',
      colors: ['#374151', '#e5e7eb'], isActive: true, usageCount: 280, previewUrl: '',
    },
    {
      templateId: 'premium-minimal-02', name: 'Experts', nameVi: 'ChuyÃªn ViÃªn',
      category: 'professional', role: 'all', tier: 'premium',
      description: 'Maroon & gold trim, refined and polished professional',
      descriptionVi: 'Viá»n Ä‘á» maroon & vÃ ng, tinh táº¿ vÃ  chá»‰n chu, cá»±c ká»³ chuyÃªn nghiá»‡p',
      colors: ['#9f1239', '#f59e0b'], isActive: true, usageCount: 195, previewUrl: '',
    },

    // â”€â”€â”€ PREMIUM â€“ SÃ¡ng táº¡o & Creative (5 máº«u) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      templateId: 'premium-creative-01', name: 'Designer Portfolio', nameVi: 'Portfolio Designer',
      category: 'creative', role: 'designer', tier: 'premium',
      description: 'Full-bleed sidebar, custom icons, portfolio-style layout',
      descriptionVi: 'Sidebar trÃ n viá»n, icon tuá»³ chá»‰nh, bá»‘ cá»¥c kiá»ƒu portfolio cho designer',
      colors: ['#ec4899', '#818cf8'], isActive: true, usageCount: 610, previewUrl: '',
    },
    {
      templateId: 'premium-creative-02', name: 'Creative Pop', nameVi: 'SÃ¡ng Táº¡o Ná»•i Báº­t',
      category: 'creative', role: 'designer', tier: 'premium',
      description: 'Vibrant coral & yellow, energetic and eye-catching',
      descriptionVi: 'MÃ u san hÃ´ & vÃ ng rá»±c rá»¡, tráº» trung vÃ  báº¯t máº¯t ngay láº­p tá»©c',
      colors: ['#f43f5e', '#fbbf24'], isActive: true, usageCount: 480, previewUrl: '',
    },
    {
      templateId: 'premium-creative-03', name: 'Artistic Flow', nameVi: 'Nghá»‡ Thuáº­t',
      category: 'creative', role: 'designer', tier: 'premium',
      description: 'Flowing layout, artistic typography, dark mode option',
      descriptionVi: 'Bá»‘ cá»¥c uá»‘n lÆ°á»£n, typography nghá»‡ thuáº­t, há»— trá»£ dark mode',
      colors: ['#0f172a', '#a78bfa'], isActive: true, usageCount: 320, previewUrl: '',
    },
    {
      templateId: 'premium-creative-04', name: 'Minimal Creative', nameVi: 'SÃ¡ng Táº¡o Tá»‘i Giáº£n',
      category: 'creative', role: 'all', tier: 'premium',
      description: 'White-space mastery meets creative layout, elegant minimalism',
      descriptionVi: 'Nghá»‡ thuáº­t khoáº£ng tráº¯ng káº¿t há»£p bá»‘ cá»¥c sÃ¡ng táº¡o, tá»‘i giáº£n tinh táº¿',
      colors: ['#111827', '#d1d5db'], isActive: true, usageCount: 390, previewUrl: '',
    },
    {
      templateId: 'premium-creative-05', name: 'Color Block', nameVi: 'Khá»‘i MÃ u Sáº¯c',
      category: 'creative', role: 'marketing', tier: 'premium',
      description: 'Bold color blocks, dynamic layout, unforgettable impression',
      descriptionVi: 'Khá»‘i mÃ u Ä‘áº­m nÃ©t, layout nÄƒng Ä‘á»™ng, táº¡o áº¥n tÆ°á»£ng khÃ³ quÃªn',
      colors: ['#7c3aed', '#06b6d4'], isActive: true, usageCount: 270, previewUrl: '',
    },

    // â”€â”€â”€ PREMIUM â€“ Theo ngÃ nh chuyÃªn biá»‡t (10 máº«u) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      templateId: 'premium-tech-01', name: 'Senior Developer', nameVi: 'Developer Cao Cáº¥p',
      category: 'tech', role: 'developer', tier: 'premium',
      description: 'Dark sidebar with skills matrix, perfect for senior devs',
      descriptionVi: 'Sidebar tá»‘i vá»›i skill matrix trá»±c quan, chuáº©n cho senior developer',
      colors: ['#0f172a', '#22d3ee'], isActive: true, usageCount: 940, previewUrl: '',
    },
    {
      templateId: 'premium-tech-02', name: 'Full Stack', nameVi: 'Full Stack Developer',
      category: 'tech', role: 'developer', tier: 'premium',
      description: 'Tech-focused, GitHub integration style, skills with progress bars',
      descriptionVi: 'Phong cÃ¡ch GitHub, thanh tiáº¿n Ä‘á»™ ká»¹ nÄƒng trá»±c quan cho fullstack dev',
      colors: ['#1d4ed8', '#7c3aed'], isActive: true, usageCount: 780, previewUrl: '',
    },
    {
      templateId: 'premium-tech-03', name: 'Data Scientist', nameVi: 'ChuyÃªn Gia Data',
      category: 'tech', role: 'developer', tier: 'premium',
      description: 'Chart-inspired elements, emphasises projects and datasets',
      descriptionVi: 'Yáº¿u tá»‘ láº¥y cáº£m há»©ng tá»« biá»ƒu Ä‘á»“, nháº¥n máº¡nh dá»± Ã¡n vÃ  nghiÃªn cá»©u dá»¯ liá»‡u',
      colors: ['#0369a1', '#065f46'], isActive: true, usageCount: 420, previewUrl: '',
    },
    {
      templateId: 'premium-marketing-01', name: 'Digital Marketer', nameVi: 'Digital Marketer',
      category: 'marketing', role: 'marketing', tier: 'premium',
      description: 'KPI-focused, social metrics layout, bold orange & purple',
      descriptionVi: 'Nháº¥n máº¡nh KPI vÃ  sá»‘ liá»‡u, mÃ u cam & tÃ­m Ä‘áº­m, cho digital marketer',
      colors: ['#ea580c', '#7c3aed'], isActive: true, usageCount: 650, previewUrl: '',
    },
    {
      templateId: 'premium-marketing-02', name: 'Content Creator', nameVi: 'Content Creator',
      category: 'marketing', role: 'marketing', tier: 'premium',
      description: 'Visual portfolio-like, colourful, for content and social media roles',
      descriptionVi: 'Kiá»ƒu portfolio trá»±c quan, nhiá»u mÃ u sáº¯c, cho content/social media',
      colors: ['#db2777', '#0ea5e9'], isActive: true, usageCount: 530, previewUrl: '',
    },
    {
      templateId: 'premium-sales-01', name: 'Sales Champion', nameVi: 'NhÃ¢n ViÃªn Kinh Doanh',
      category: 'professional', role: 'sales', tier: 'premium',
      description: 'Achievement-driven, revenue highlights, bold red accent',
      descriptionVi: 'Táº­p trung thÃ nh tÃ­ch doanh sá»‘, highlight doanh thu, accent Ä‘á» Ä‘áº­m',
      colors: ['#dc2626', '#1e293b'], isActive: true, usageCount: 870, previewUrl: '',
    },
    {
      templateId: 'premium-hr-01', name: 'HR & Admin', nameVi: 'HÃ nh ChÃ­nh NhÃ¢n Sá»±',
      category: 'professional', role: 'all', tier: 'premium',
      description: 'Organised, soft purple, emphasises interpersonal skills',
      descriptionVi: 'Bá»‘ cá»¥c ngÄƒn náº¯p, mÃ u tÃ­m nháº¹, nháº¥n ká»¹ nÄƒng má»m vÃ  Ä‘iá»u phá»‘i',
      colors: ['#7c3aed', '#e0e7ff'], isActive: true, usageCount: 340, previewUrl: '',
    },
    {
      templateId: 'premium-accountant-01', name: 'Finance Pro', nameVi: 'Káº¿ ToÃ¡n ChuyÃªn Nghiá»‡p',
      category: 'professional', role: 'accountant', tier: 'premium',
      description: 'Conservative navy design, certifications section prominent',
      descriptionVi: 'Thiáº¿t káº¿ navy báº£o thá»§, pháº§n chá»©ng chá»‰ ná»•i báº­t, cá»±c chuáº©n tÃ i chÃ­nh',
      colors: ['#1e40af', '#1e293b'], isActive: true, usageCount: 410, previewUrl: '',
    },
    {
      templateId: 'premium-student-01', name: 'Graduate Pro', nameVi: 'Sinh ViÃªn Cao Cáº¥p',
      category: 'student', role: 'student', tier: 'premium',
      description: 'Two-column, teal & white, highlights projects and internships',
      descriptionVi: 'Hai cá»™t, teal & tráº¯ng, ná»•i báº­t dá»± Ã¡n vÃ  thá»±c táº­p â€“ chuáº©n cho SV',
      colors: ['#0d9488', '#14b8a6'], isActive: true, usageCount: 960, previewUrl: '',
    },
    {
      templateId: 'premium-student-02', name: 'Young Professional', nameVi: 'Tráº» ChuyÃªn Nghiá»‡p',
      category: 'student', role: 'student', tier: 'premium',
      description: 'Modern layout for recent grads entering the job market',
      descriptionVi: 'Bá»‘ cá»¥c hiá»‡n Ä‘áº¡i cho sinh viÃªn má»›i tá»‘t nghiá»‡p bÆ°á»›c vÃ o thá»‹ trÆ°á»ng viá»‡c lÃ m',
      colors: ['#6366f1', '#06b6d4'], isActive: true, usageCount: 750, previewUrl: '',
    },
  ];

export async function seedTemplates(): Promise<void> {
  const templates = TEMPLATES;

  for (const t of templates) {
    await setDoc(doc(db, 'templates', t.templateId), {
      ...t,
      createdAt: serverTimestamp(),
    });
  }
}

