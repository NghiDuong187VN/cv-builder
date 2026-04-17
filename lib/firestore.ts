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
import { CV, Profile, Template, CVSection, CoverLetter, PersonalInfo, CvAiHistoryRecord } from './types';

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
    title: `${rest.title} (Bản sao)`,
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

export const TEMPLATES: Omit<Template, 'createdAt'>[] = [
    // ─── MIỄN PHÍ – Cổ điển & ATS-Friendly (8 mẫu) ─────────────
    {
      templateId: 'classic-ats-01', name: 'ATS Classic 1', nameVi: 'Cổ Điển 1',
      category: 'minimal', role: 'all', tier: 'free',
      description: 'Single column, ATS-safe, clean black & white, serif font',
      descriptionVi: 'Một cột đơn giản, ATS-friendly, đen trắng sạch sẽ, font serif – phổ biến nhất',
      colors: ['#1a1a1a', '#555555'], isActive: true, usageCount: 1240, previewUrl: '',
    },
    {
      templateId: 'classic-ats-02', name: 'ATS Modern 1', nameVi: 'Hiện Đại 1',
      category: 'minimal', role: 'all', tier: 'free',
      description: 'Single column with thin accent line, ATS-friendly',
      descriptionVi: 'Một cột với đường accent mỏng, thân thiện ATS, rõ ràng',
      colors: ['#2563eb', '#1e293b'], isActive: true, usageCount: 980, previewUrl: '',
    },
    {
      templateId: 'classic-ats-03', name: 'ATS Minimal', nameVi: 'Tối Giản',
      category: 'minimal', role: 'all', tier: 'free',
      description: 'Ultra-clean, minimal typography, no decorative elements',
      descriptionVi: 'Cực kỳ tối giản, chỉ text, không hoa văn – chuẩn ATS tuyệt đối',
      colors: ['#374151', '#6b7280'], isActive: true, usageCount: 762, previewUrl: '',
    },
    {
      templateId: 'classic-ats-04', name: 'ATS Navy', nameVi: 'Cổ Điển Navy',
      category: 'minimal', role: 'all', tier: 'free',
      description: 'Navy header accent, clean single column layout',
      descriptionVi: 'Header navy xanh đậm, bố cục một cột chuyên nghiệp',
      colors: ['#1e3a5f', '#475569'], isActive: true, usageCount: 543, previewUrl: '',
    },
    {
      templateId: 'student-simple-01', name: 'Student Basic', nameVi: 'Sinh Viên Cơ Bản',
      category: 'student', role: 'student', tier: 'free',
      description: 'Clean layout for students, no experience required',
      descriptionVi: 'Bố cục sạch cho sinh viên chưa có kinh nghiệm đi làm',
      colors: ['#06b6d4', '#0e7490'], isActive: true, usageCount: 1560, previewUrl: '',
    },
    {
      templateId: 'student-simple-02', name: 'Intern Ready', nameVi: 'Thực Tập Sinh',
      category: 'student', role: 'student', tier: 'free',
      description: 'Bright teal, emphasizes skills & activities',
      descriptionVi: 'Màu teal tươi sáng, nhấn mạnh kỹ năng và hoạt động ngoại khoá',
      colors: ['#0d9488', '#6366f1'], isActive: true, usageCount: 890, previewUrl: '',
    },
    {
      templateId: 'modern-simple-01', name: 'Modern Pro', nameVi: 'Hiện Đại Pro',
      category: 'modern', role: 'all', tier: 'free',
      description: 'Gradient header, modern layout, great for most roles',
      descriptionVi: 'Header gradient đẹp, bố cục hiện đại, phù hợp mọi vị trí',
      colors: ['#6366f1', '#8b5cf6'], isActive: true, usageCount: 2100, previewUrl: '',
    },
    {
      templateId: 'modern-simple-02', name: 'Clean Sidebar', nameVi: 'Thanh Lịch 2 Cột',
      category: 'modern', role: 'all', tier: 'free',
      description: '2-column sidebar, accent color, professional look',
      descriptionVi: 'Bố cục 2 cột, sidebar màu nhấn, trông rất chuyên nghiệp',
      colors: ['#1e293b', '#64748b'], isActive: true, usageCount: 1320, previewUrl: '',
    },

    // ─── MIỄN PHÍ – Theo ngành (4 mẫu) ─────────────────────────
    {
      templateId: 'tech-basic-01', name: 'Dev Terminal', nameVi: 'Lập Trình Viên',
      category: 'tech', role: 'developer', tier: 'free',
      description: 'Dark code-themed layout with green accent for developers',
      descriptionVi: 'Nền tối kiểu terminal, accent xanh lá, dành riêng cho developer/IT',
      colors: ['#10b981', '#1e293b'], isActive: true, usageCount: 1890, previewUrl: '',
    },
    {
      templateId: 'accountant-basic-01', name: 'Finance Classic', nameVi: 'Kế Toán Cổ Điển',
      category: 'minimal', role: 'accountant', tier: 'free',
      description: 'Conservative, clean, blue-grey palette for finance roles',
      descriptionVi: 'Bố cục bảo thủ, sạch sẽ, màu xanh xám cho kế toán, tài chính',
      colors: ['#1e40af', '#94a3b8'], isActive: true, usageCount: 670, previewUrl: '',
    },
    {
      templateId: 'marketing-basic-01', name: 'Brand Story', nameVi: 'Marketing Cơ Bản',
      category: 'marketing', role: 'marketing', tier: 'free',
      description: 'Bold orange accent, achievement-first layout',
      descriptionVi: 'Accent cam đậm, nhấn mạnh thành tích, phù hợp marketing/sales',
      colors: ['#f59e0b', '#ef4444'], isActive: true, usageCount: 1100, previewUrl: '',
    },
    {
      templateId: 'harvard-classic-01', name: 'Harvard Classic', nameVi: 'Harvard Cổ Điển',
      category: 'professional', role: 'all', tier: 'free',
      description: 'Traditional academic CV format, serif font, timeless',
      descriptionVi: 'Format CV học thuật truyền thống Harvard, font serif, vượt thời gian',
      colors: ['#991b1b', '#1a1a1a'], isActive: true, usageCount: 440, previewUrl: '',
    },

    // ─── PREMIUM – Chuyên nghiệp cao cấp (8 mẫu) ────────────────
    {
      templateId: 'premium-executive-01', name: 'Executive Suite', nameVi: 'Điều Hành Cao Cấp',
      category: 'professional', role: 'all', tier: 'premium',
      description: 'Navy & gold, authoritative executive design with photo',
      descriptionVi: 'Xanh navy & vàng sang trọng, dành cho quản lý và điều hành',
      colors: ['#1e3a5f', '#c9a84c'], isActive: true, usageCount: 330, previewUrl: '',
    },
    {
      templateId: 'premium-executive-02', name: 'Corporate Leader', nameVi: 'Lãnh Đạo Doanh Nghiệp',
      category: 'professional', role: 'all', tier: 'premium',
      description: 'Dark charcoal with silver accents, senior management look',
      descriptionVi: 'Nền xám đậm, accent bạc, phong cách quản lý cấp cao',
      colors: ['#1f2937', '#9ca3af'], isActive: true, usageCount: 220, previewUrl: '',
    },
    {
      templateId: 'premium-modern-01', name: 'Gradient Pro', nameVi: 'Gradient Pro',
      category: 'modern', role: 'all', tier: 'premium',
      description: 'Full gradient header, modern layout, 2-column professional',
      descriptionVi: 'Header gradient toàn bề mặt, bố cục 2 cột hiện đại cao cấp',
      colors: ['#8b5cf6', '#ec4899'], isActive: true, usageCount: 890, previewUrl: '',
    },
    {
      templateId: 'premium-modern-02', name: 'Clarity Pro', nameVi: 'Rõ Nét Pro',
      category: 'modern', role: 'all', tier: 'premium',
      description: 'Ultra-clean white, blue accent, maximises readability',
      descriptionVi: 'Nền trắng cực sạch, accent xanh dương, tối ưu khả năng đọc',
      colors: ['#2563eb', '#dbeafe'], isActive: true, usageCount: 560, previewUrl: '',
    },
    {
      templateId: 'premium-modern-03', name: 'Ambitious', nameVi: 'Tham Vọng',
      category: 'modern', role: 'all', tier: 'premium',
      description: 'Bold typography, emerald green, career-driven design',
      descriptionVi: 'Typography đậm, màu xanh emerald, thiết kế cho người tham vọng',
      colors: ['#059669', '#064e3b'], isActive: true, usageCount: 410, previewUrl: '',
    },
    {
      templateId: 'premium-modern-04', name: 'Outstanding', nameVi: 'Ấn Tượng',
      category: 'modern', role: 'all', tier: 'premium',
      description: 'Violet accent, asymmetric layout, stands out instantly',
      descriptionVi: 'Accent tím, bố cục bất đối xứng, nổi bật ngay lập tức',
      colors: ['#7c3aed', '#c4b5fd'], isActive: true, usageCount: 730, previewUrl: '',
    },
    {
      templateId: 'premium-minimal-01', name: 'Senior Pro', nameVi: 'Chuyên Gia Cao Cấp',
      category: 'professional', role: 'all', tier: 'premium',
      description: 'Understated elegance, for senior professionals with extensive experience',
      descriptionVi: 'Tinh tế không phô trương, dành cho chuyên gia dày dặn kinh nghiệm',
      colors: ['#374151', '#e5e7eb'], isActive: true, usageCount: 280, previewUrl: '',
    },
    {
      templateId: 'premium-minimal-02', name: 'Experts', nameVi: 'Chuyên Viên',
      category: 'professional', role: 'all', tier: 'premium',
      description: 'Maroon & gold trim, refined and polished professional',
      descriptionVi: 'Viền đỏ maroon & vàng, tinh tế và chỉn chu, cực kỳ chuyên nghiệp',
      colors: ['#9f1239', '#f59e0b'], isActive: true, usageCount: 195, previewUrl: '',
    },

    // ─── PREMIUM – Sáng tạo & Creative (5 mẫu) ──────────────────
    {
      templateId: 'premium-creative-01', name: 'Designer Portfolio', nameVi: 'Portfolio Designer',
      category: 'creative', role: 'designer', tier: 'premium',
      description: 'Full-bleed sidebar, custom icons, portfolio-style layout',
      descriptionVi: 'Sidebar tràn viền, icon tuỳ chỉnh, bố cục kiểu portfolio cho designer',
      colors: ['#ec4899', '#818cf8'], isActive: true, usageCount: 610, previewUrl: '',
    },
    {
      templateId: 'premium-creative-02', name: 'Creative Pop', nameVi: 'Sáng Tạo Nổi Bật',
      category: 'creative', role: 'designer', tier: 'premium',
      description: 'Vibrant coral & yellow, energetic and eye-catching',
      descriptionVi: 'Màu san hô & vàng rực rỡ, trẻ trung và bắt mắt ngay lập tức',
      colors: ['#f43f5e', '#fbbf24'], isActive: true, usageCount: 480, previewUrl: '',
    },
    {
      templateId: 'premium-creative-03', name: 'Artistic Flow', nameVi: 'Nghệ Thuật',
      category: 'creative', role: 'designer', tier: 'premium',
      description: 'Flowing layout, artistic typography, dark mode option',
      descriptionVi: 'Bố cục uốn lượn, typography nghệ thuật, hỗ trợ dark mode',
      colors: ['#0f172a', '#a78bfa'], isActive: true, usageCount: 320, previewUrl: '',
    },
    {
      templateId: 'premium-creative-04', name: 'Minimal Creative', nameVi: 'Sáng Tạo Tối Giản',
      category: 'creative', role: 'all', tier: 'premium',
      description: 'White-space mastery meets creative layout, elegant minimalism',
      descriptionVi: 'Nghệ thuật khoảng trắng kết hợp bố cục sáng tạo, tối giản tinh tế',
      colors: ['#111827', '#d1d5db'], isActive: true, usageCount: 390, previewUrl: '',
    },
    {
      templateId: 'premium-creative-05', name: 'Color Block', nameVi: 'Khối Màu Sắc',
      category: 'creative', role: 'marketing', tier: 'premium',
      description: 'Bold color blocks, dynamic layout, unforgettable impression',
      descriptionVi: 'Khối màu đậm nét, layout năng động, tạo ấn tượng khó quên',
      colors: ['#7c3aed', '#06b6d4'], isActive: true, usageCount: 270, previewUrl: '',
    },

    // ─── PREMIUM – Theo ngành chuyên biệt (10 mẫu) ───────────────
    {
      templateId: 'premium-tech-01', name: 'Senior Developer', nameVi: 'Developer Cao Cấp',
      category: 'tech', role: 'developer', tier: 'premium',
      description: 'Dark sidebar with skills matrix, perfect for senior devs',
      descriptionVi: 'Sidebar tối với skill matrix trực quan, chuẩn cho senior developer',
      colors: ['#0f172a', '#22d3ee'], isActive: true, usageCount: 940, previewUrl: '',
    },
    {
      templateId: 'premium-tech-02', name: 'Full Stack', nameVi: 'Full Stack Developer',
      category: 'tech', role: 'developer', tier: 'premium',
      description: 'Tech-focused, GitHub integration style, skills with progress bars',
      descriptionVi: 'Phong cách GitHub, thanh tiến độ kỹ năng trực quan cho fullstack dev',
      colors: ['#1d4ed8', '#7c3aed'], isActive: true, usageCount: 780, previewUrl: '',
    },
    {
      templateId: 'premium-tech-03', name: 'Data Scientist', nameVi: 'Chuyên Gia Data',
      category: 'tech', role: 'developer', tier: 'premium',
      description: 'Chart-inspired elements, emphasises projects and datasets',
      descriptionVi: 'Yếu tố lấy cảm hứng từ biểu đồ, nhấn mạnh dự án và nghiên cứu dữ liệu',
      colors: ['#0369a1', '#065f46'], isActive: true, usageCount: 420, previewUrl: '',
    },
    {
      templateId: 'premium-marketing-01', name: 'Digital Marketer', nameVi: 'Digital Marketer',
      category: 'marketing', role: 'marketing', tier: 'premium',
      description: 'KPI-focused, social metrics layout, bold orange & purple',
      descriptionVi: 'Nhấn mạnh KPI và số liệu, màu cam & tím đậm, cho digital marketer',
      colors: ['#ea580c', '#7c3aed'], isActive: true, usageCount: 650, previewUrl: '',
    },
    {
      templateId: 'premium-marketing-02', name: 'Content Creator', nameVi: 'Content Creator',
      category: 'marketing', role: 'marketing', tier: 'premium',
      description: 'Visual portfolio-like, colourful, for content and social media roles',
      descriptionVi: 'Kiểu portfolio trực quan, nhiều màu sắc, cho content/social media',
      colors: ['#db2777', '#0ea5e9'], isActive: true, usageCount: 530, previewUrl: '',
    },
    {
      templateId: 'premium-sales-01', name: 'Sales Champion', nameVi: 'Nhân Viên Kinh Doanh',
      category: 'professional', role: 'sales', tier: 'premium',
      description: 'Achievement-driven, revenue highlights, bold red accent',
      descriptionVi: 'Tập trung thành tích doanh số, highlight doanh thu, accent đỏ đậm',
      colors: ['#dc2626', '#1e293b'], isActive: true, usageCount: 870, previewUrl: '',
    },
    {
      templateId: 'premium-hr-01', name: 'HR & Admin', nameVi: 'Hành Chính Nhân Sự',
      category: 'professional', role: 'all', tier: 'premium',
      description: 'Organised, soft purple, emphasises interpersonal skills',
      descriptionVi: 'Bố cục ngăn nắp, màu tím nhẹ, nhấn kỹ năng mềm và điều phối',
      colors: ['#7c3aed', '#e0e7ff'], isActive: true, usageCount: 340, previewUrl: '',
    },
    {
      templateId: 'premium-accountant-01', name: 'Finance Pro', nameVi: 'Kế Toán Chuyên Nghiệp',
      category: 'professional', role: 'accountant', tier: 'premium',
      description: 'Conservative navy design, certifications section prominent',
      descriptionVi: 'Thiết kế navy bảo thủ, phần chứng chỉ nổi bật, cực chuẩn tài chính',
      colors: ['#1e40af', '#1e293b'], isActive: true, usageCount: 410, previewUrl: '',
    },
    {
      templateId: 'premium-student-01', name: 'Graduate Pro', nameVi: 'Sinh Viên Cao Cấp',
      category: 'student', role: 'student', tier: 'premium',
      description: 'Two-column, teal & white, highlights projects and internships',
      descriptionVi: 'Hai cột, teal & trắng, nổi bật dự án và thực tập – chuẩn cho SV',
      colors: ['#0d9488', '#14b8a6'], isActive: true, usageCount: 960, previewUrl: '',
    },
    {
      templateId: 'premium-student-02', name: 'Young Professional', nameVi: 'Trẻ Chuyên Nghiệp',
      category: 'student', role: 'student', tier: 'premium',
      description: 'Modern layout for recent grads entering the job market',
      descriptionVi: 'Bố cục hiện đại cho sinh viên mới tốt nghiệp bước vào thị trường việc làm',
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
