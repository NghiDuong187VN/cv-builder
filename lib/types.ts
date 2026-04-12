// ============================================================
// TypeScript Types — CV Builder 2.0
// ============================================================

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  username: string;
  plan: 'free' | 'premium';
  planExpiry?: Date | null;
  isAdmin: boolean;
  isActive: boolean;
  settings: {
    language: 'vi' | 'en';
    theme: 'light' | 'dark';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth?: string;
  gender?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  avatarUrl?: string;
}

export interface Skill {
  name: string;
  level: number; // 0–100
  category?: 'hard' | 'soft' | 'language';
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  from: string;
  to: string;
  gpa?: string;
  achievements?: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  location?: string;
  from: string;
  to: string;
  current: boolean;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  role?: string;
  url?: string;
  github?: string;
  description: string;
  technologies: string[];
  from?: string;
  to?: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
  credentialId?: string;
}

export interface Activity {
  id: string;
  name: string;
  role?: string;
  description: string;
  from?: string;
  to?: string;
}

export interface Socials {
  linkedin?: string;
  github?: string;
  facebook?: string;
  twitter?: string;
  website?: string;
  portfolio?: string;
}

export interface Profile {
  uid: string;
  username: string;
  isPublic: boolean;
  fullName: string;
  jobTitle: string;
  bio: string;
  phone?: string;
  email: string;
  location?: string;
  avatarUrl?: string;
  slogan?: string;
  skills: Skill[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certificates: Certificate[];
  activities: Activity[];
  interests: string[];
  languages: { name: string; level: string }[];
  socials: Socials;
  viewCount: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CVSection =
  | 'personalInfo'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'certificates'
  | 'activities'
  | 'interests'
  | 'languages';

export type CVLayout = '1col' | '2col';
export type CVLanguage = 'vi' | 'en';
export type CVShareMode = 'public' | 'password';

export interface CVTheme {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  layout: CVLayout;
  showAvatar: boolean;
  accentStyle: 'flat' | 'gradient';
}

export interface CV {
  cvId: string;
  uid: string;
  title: string;
  isPublic: boolean;
  shareSlug: string;
  sharing?: {
    mode: CVShareMode;
    passcode?: string;
  };
  templateId: string;
  targetJob?: string;
  targetCompany?: string;
  jobDescription?: string;
  language: CVLanguage;
  theme: CVTheme;
  sections: {
    order: CVSection[];
    visibility: Partial<Record<CVSection, boolean>>;
  };
  content: {
    personalInfo: PersonalInfo;
    summary: string;
    skills: Skill[];
    experience: Experience[];
    education: Education[];
    projects: Project[];
    certificates: Certificate[];
    activities: Activity[];
    interests: string[];
    languages: { name: string; level: string }[];
  };
  viewCount: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateCategory =
  | 'modern'
  | 'minimal'
  | 'professional'
  | 'harvard'
  | 'creative'
  | 'student'
  | 'tech'
  | 'marketing'
  | 'sales'
  | 'accountant';

export type TemplateRole =
  | 'all'
  | 'developer'
  | 'marketing'
  | 'sales'
  | 'accountant'
  | 'designer'
  | 'student';

export interface Template {
  templateId: string;
  name: string;
  nameVi: string;
  category: TemplateCategory;
  role?: TemplateRole;
  tier: 'free' | 'premium';
  previewUrl: string;
  description: string;
  descriptionVi: string;
  colors: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
}

export interface CoverLetter {
  id: string;
  uid: string;
  title: string;
  recipientName?: string;
  companyName?: string;
  jobTitle?: string;
  content: string;
  templateId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  totalCVs: number;
  totalPublicProfiles: number;
  totalDownloads: number;
  newUsersToday: number;
  newCVsToday: number;
  premiumUsers: number;
  popularTemplates: { templateId: string; name: string; count: number }[];
}

export interface SharedCVPayload {
  cvId: string;
  shareSlug: string;
  title: string;
  targetJob?: string;
  templateId?: string;
}

export interface CommunityMessage {
  id: string;
  uid: string;
  userName: string;
  userEmail?: string;
  userPhotoURL?: string;
  text: string;
  sharedCV?: SharedCVPayload;
  createdAt: Date;
  likes?: string[];      // array of uid
  commentCount?: number; // denormalised counter
}

export interface CommunityComment {
  id: string;
  messageId: string;
  uid: string;
  userName: string;
  userPhotoURL?: string;
  text: string;
  createdAt: Date;
}
