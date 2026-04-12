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
import { CV, Profile, Template, CVSection, CoverLetter, PersonalInfo } from './types';

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value) {
    const v = value as { toMillis?: () => number };
    if (typeof v.toMillis === 'function') return v.toMillis();
  }
  return 0;
}

// ─── Helpers ─────────────────────────────────────────────────
function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10);
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

// ─── Profiles ────────────────────────────────────────────────
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

// ─── CVs ─────────────────────────────────────────────────────
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
    title: `${rest.title} (Bản sao)`,
    isPublic: false,
  });
}

export async function incrementCVView(cvId: string): Promise<void> {
  await updateDoc(doc(db, 'cvs', cvId), { viewCount: increment(1) });
}
export async function incrementCVDownload(cvId: string): Promise<void> {
  await updateDoc(doc(db, 'cvs', cvId), { downloadCount: increment(1) });
}

// ─── Cover Letters ────────────────────────────────────────────
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

// ─── Templates ───────────────────────────────────────────────
export async function getTemplates(): Promise<Template[]> {
  const snap = await getDocs(
    query(collection(db, 'templates'), where('isActive', '==', true))
  );
  return snap.docs.map(d => d.data() as Template);
}

export async function seedTemplates(): Promise<void> {
  const templates = [
    {
      templateId: 'modern-01', name: 'Modern Pro', nameVi: 'Hiện Đại Pro',
      category: 'modern', role: 'all', tier: 'free',
      description: 'Clean gradient header, 1-column ATS-friendly layout',
      descriptionVi: 'Header gradient đẹp, bố cục 1 cột thân thiện ATS',
      colors: ['#6366f1', '#8b5cf6'], isActive: true, usageCount: 0, previewUrl: '',
    },
    {
      templateId: 'minimal-01', name: 'Elegant Sidebar', nameVi: 'Thanh Lịch 2 Cột',
      category: 'minimal', role: 'all', tier: 'free',
      description: '2-column sidebar with accent color, professional look',
      descriptionVi: '2 cột sidebar màu accent, trông chuyên nghiệp',
      colors: ['#1e293b', '#64748b'], isActive: true, usageCount: 0, previewUrl: '',
    },
    {
      templateId: 'harvard-01', name: 'Harvard Classic', nameVi: 'Harvard Cổ Điển',
      category: 'harvard', role: 'all', tier: 'free',
      description: 'Traditional academic CV, serif font, black and white',
      descriptionVi: 'CV học thuật truyền thống, font serif, đen trắng',
      colors: ['#1a1a1a', '#555555'], isActive: true, usageCount: 0, previewUrl: '',
    },
    {
      templateId: 'creative-01', name: 'Creative Edge', nameVi: 'Sáng Tạo',
      category: 'creative', role: 'designer', tier: 'free',
      description: 'Bold colors, modern sidebar, perfect for creatives',
      descriptionVi: 'Màu sắc đậm, sidebar hiện đại, dành cho designer',
      colors: ['#ec4899', '#f59e0b'], isActive: true, usageCount: 0, previewUrl: '',
    },
    {
      templateId: 'tech-01', name: 'Dev Terminal', nameVi: 'Lập Trình Viên',
      category: 'tech', role: 'developer', tier: 'free',
      description: 'Dark code-themed layout for developers',
      descriptionVi: 'Giao diện tối theo phong cách code, dành cho dev',
      colors: ['#10b981', '#1e293b'], isActive: true, usageCount: 0, previewUrl: '',
    },
    {
      templateId: 'professional-01', name: 'Executive Suite', nameVi: 'Điều Hành',
      category: 'professional', role: 'sales', tier: 'free',
      description: 'Premium navy & gold, authoritative executive look',
      descriptionVi: 'Xanh navy & vàng, vẻ ngoài điều hành cao cấp',
      colors: ['#1e3a5f', '#c9a84c'], isActive: true, usageCount: 0, previewUrl: '',
    },
    {
      templateId: 'student-01', name: 'Fresh Graduate', nameVi: 'Sinh Viên Mới Ra Trường',
      category: 'student', role: 'student', tier: 'free',
      description: 'Vibrant and energetic for fresh graduates',
      descriptionVi: 'Năng động, tươi sáng cho sinh viên mới tốt nghiệp',
      colors: ['#06b6d4', '#6366f1'], isActive: true, usageCount: 0, previewUrl: '',
    },
    {
      templateId: 'marketing-01', name: 'Brand Story', nameVi: 'Marketing',
      category: 'marketing', role: 'marketing', tier: 'free',
      description: 'Visual-first layout with emphasis on achievements',
      descriptionVi: 'Bố cục chú trọng hình ảnh và thành tích',
      colors: ['#f59e0b', '#ef4444'], isActive: true, usageCount: 0, previewUrl: '',
    },
  ];

  for (const t of templates) {
    await setDoc(doc(db, 'templates', t.templateId), {
      ...t,
      createdAt: serverTimestamp(),
    });
  }
}
