import { TEMPLATES } from '@/lib/firestore';
import type { Template } from '@/lib/types';

export type TemplateStyleFilter =
  | 'all'
  | 'modern'
  | 'minimal'
  | 'creative'
  | 'professional'
  | 'ats-friendly';

export type TemplateIndustryFilter =
  | 'all'
  | 'student'
  | 'fresher'
  | 'it'
  | 'marketing'
  | 'accounting'
  | 'office'
  | 'design';

export type TemplateAccessFilter = 'all' | 'free' | 'premium';
export type TemplateSort = 'popular' | 'newest' | 'easy';

export type TemplateLayoutType = '1col' | '2col';

export interface TemplateLibraryItem {
  id: string;
  templateId: string;
  slug: string;
  name: string;
  description: string;
  category: Template['category'];
  style: TemplateStyleFilter[];
  targetRole: string;
  isPremium: boolean;
  tags: string[];
  thumbnail: {
    primary: string;
    secondary: string;
    accent: string;
    pattern: 'single' | 'split' | 'sidebar' | 'bold';
  };
  layoutType: TemplateLayoutType;
  isAtsFriendly: boolean;
  isNew: boolean;
  popularity: number;
  easeScore: number;
  industries: TemplateIndustryFilter[];
  original: Template;
}

type CatalogMeta = {
  slug: string;
  name: string;
  description: string;
  targetRole: string;
  style: TemplateStyleFilter[];
  industries: TemplateIndustryFilter[];
  tags: string[];
  layoutType: TemplateLayoutType;
  isAtsFriendly?: boolean;
  isNew?: boolean;
  pattern?: TemplateLibraryItem['thumbnail']['pattern'];
};

const FALLBACK_TEMPLATE_IDS = [
  'student-simple-01',
  'modern-simple-01',
  'modern-simple-02',
  'classic-ats-03',
  'premium-tech-01',
  'premium-marketing-01',
  'premium-executive-01',
  'premium-creative-01',
] as const;

const TEMPLATE_META: Record<string, CatalogMeta> = {
  'student-simple-01': {
    slug: 'student-clean',
    name: 'Student Clean',
    description: 'Gọn gàng, dễ đọc, phù hợp sinh viên và người chưa có nhiều kinh nghiệm.',
    targetRole: 'Sinh viên, thực tập sinh',
    style: ['minimal', 'ats-friendly'],
    industries: ['student', 'fresher', 'office'],
    tags: ['Sinh viên', 'Tối giản', '1 cột'],
    layoutType: '1col',
    isAtsFriendly: true,
    isNew: true,
    pattern: 'single',
  },
  'modern-simple-01': {
    slug: 'modern-fresher',
    name: 'Modern Fresher',
    description: 'Hiện đại, sáng sủa, giúp CV đầu tiên trông chuyên nghiệp hơn ngay lập tức.',
    targetRole: 'Fresher, người mới đi làm',
    style: ['modern'],
    industries: ['fresher', 'office'],
    tags: ['Fresher', 'Hiện đại', '1 cột'],
    layoutType: '1col',
    isNew: true,
    pattern: 'bold',
  },
  'modern-simple-02': {
    slug: 'office-minimal',
    name: 'Office Minimal',
    description: 'Bố cục 2 cột gọn gàng, phù hợp các vị trí văn phòng và hành chính.',
    targetRole: 'Văn phòng, hành chính',
    style: ['professional', 'minimal'],
    industries: ['office', 'accounting'],
    tags: ['Văn phòng', '2 cột', 'Chuyên nghiệp'],
    layoutType: '2col',
    pattern: 'sidebar',
  },
  'classic-ats-03': {
    slug: 'simple-ats',
    name: 'Simple ATS',
    description: 'Tối giản và ATS-friendly, phù hợp khi cần gửi CV nghiêm túc, dễ scan.',
    targetRole: 'IT, văn phòng, ứng tuyển đại trà',
    style: ['minimal', 'ats-friendly'],
    industries: ['it', 'office', 'fresher'],
    tags: ['ATS-friendly', 'Tối giản', '1 cột'],
    layoutType: '1col',
    isAtsFriendly: true,
    pattern: 'single',
  },
  'premium-tech-01': {
    slug: 'tech-dark',
    name: 'Tech Dark',
    description: 'Tông tối sắc nét, hợp CV kỹ thuật, developer và ứng tuyển sản phẩm công nghệ.',
    targetRole: 'IT / Kỹ thuật',
    style: ['modern', 'professional', 'ats-friendly'],
    industries: ['it'],
    tags: ['IT', 'Premium', '2 cột'],
    layoutType: '2col',
    isAtsFriendly: true,
    isNew: true,
    pattern: 'sidebar',
  },
  'premium-marketing-01': {
    slug: 'marketing-creative',
    name: 'Marketing Creative',
    description: 'Cân bằng giữa sáng tạo và chuyên nghiệp, phù hợp marketing, growth và content.',
    targetRole: 'Marketing, growth, content',
    style: ['creative', 'modern'],
    industries: ['marketing'],
    tags: ['Marketing', 'Sáng tạo', '2 cột'],
    layoutType: '2col',
    pattern: 'split',
  },
  'premium-executive-01': {
    slug: 'executive-pro',
    name: 'Executive Pro',
    description: 'Nghiêm túc, sang trọng, phù hợp hồ sơ quản lý hoặc ứng tuyển môi trường chuyên nghiệp.',
    targetRole: 'Quản lý, văn phòng cao cấp',
    style: ['professional'],
    industries: ['office', 'accounting'],
    tags: ['Chuyên nghiệp', 'Premium', '1 cột'],
    layoutType: '1col',
    pattern: 'bold',
  },
  'premium-creative-01': {
    slug: 'portfolio-split',
    name: 'Portfolio Split',
    description: 'Layout chia cột nổi bật, phù hợp designer, creative và portfolio cá nhân.',
    targetRole: 'Thiết kế, sáng tạo',
    style: ['creative'],
    industries: ['design', 'marketing'],
    tags: ['Thiết kế', '2 cột', 'Portfolio'],
    layoutType: '2col',
    pattern: 'split',
  },
};

function buildDefaultMeta(template: Template): CatalogMeta {
  const style: TemplateStyleFilter[] = [];
  const industries: TemplateIndustryFilter[] = [];
  const tags: string[] = [];
  let layoutType: TemplateLayoutType = '1col';
  let pattern: TemplateLibraryItem['thumbnail']['pattern'] = 'single';

  if (template.category === 'modern') {
    style.push('modern');
    tags.push('Hiện đại');
  }
  if (template.category === 'creative') {
    style.push('creative');
    industries.push('design');
    tags.push('Sáng tạo');
    layoutType = '2col';
    pattern = 'split';
  }
  if (template.category === 'professional' || template.category === 'harvard') {
    style.push('professional');
    tags.push('Chuyên nghiệp');
  }
  if (template.category === 'minimal') {
    style.push('minimal', 'ats-friendly');
    tags.push('Tối giản');
  }
  if (template.category === 'student') {
    industries.push('student', 'fresher');
    tags.push('Sinh viên');
  }
  if (template.category === 'tech') {
    industries.push('it');
    tags.push('IT');
    layoutType = '2col';
    pattern = 'sidebar';
  }
  if (template.category === 'marketing') {
    industries.push('marketing');
    tags.push('Marketing');
    layoutType = '2col';
    pattern = 'split';
  }
  if (template.category === 'accountant') {
    industries.push('accounting');
    tags.push('Kế toán');
  }

  if (template.role === 'student') industries.push('student');
  if (template.role === 'developer') industries.push('it');
  if (template.role === 'marketing') industries.push('marketing');
  if (template.role === 'designer') industries.push('design');
  if (template.role === 'accountant') industries.push('accounting');
  if (template.role === 'sales' || template.role === 'all') industries.push('office');

  const uniqueStyle = Array.from<TemplateStyleFilter>(
    new Set<TemplateStyleFilter>(style.length ? style : ['professional'])
  );
  const uniqueIndustries = Array.from<TemplateIndustryFilter>(
    new Set<TemplateIndustryFilter>(industries.length ? industries : ['office'])
  );
  const uniqueTags = Array.from(new Set([...tags, layoutType === '2col' ? '2 cột' : '1 cột']));

  return {
    slug: template.templateId,
    name: template.nameVi || template.name,
    description: template.descriptionVi || template.description,
    targetRole: template.role === 'student' ? 'Sinh viên, fresher' : 'Nhiều vị trí văn phòng',
    style: uniqueStyle,
    industries: uniqueIndustries,
    tags: uniqueTags,
    layoutType,
    isAtsFriendly: uniqueStyle.includes('ats-friendly'),
    isNew: template.usageCount < 500,
    pattern,
  };
}

function toLibraryTemplate(template: Template): TemplateLibraryItem {
  const meta = TEMPLATE_META[template.templateId] ?? buildDefaultMeta(template);
  const secondary = template.colors[1] || template.colors[0];
  const accent = template.tier === 'premium' ? '#f59e0b' : '#ffffff';

  return {
    id: meta.slug,
    templateId: template.templateId,
    slug: meta.slug,
    name: meta.name,
    description: meta.description,
    category: template.category,
    style: meta.style,
    targetRole: meta.targetRole,
    isPremium: template.tier === 'premium',
    tags: meta.tags,
    thumbnail: {
      primary: template.colors[0],
      secondary,
      accent,
      pattern: meta.pattern || 'single',
    },
    layoutType: meta.layoutType,
    isAtsFriendly: Boolean(meta.isAtsFriendly),
    isNew: Boolean(meta.isNew),
    popularity: template.usageCount,
    easeScore: meta.layoutType === '1col' ? 90 : 72,
    industries: meta.industries,
    original: template,
  };
}

export function buildTemplateLibrary(templates: Template[]): TemplateLibraryItem[] {
  return templates
    .filter(template => template.isActive)
    .map(toLibraryTemplate);
}

export function getFallbackLibrary(): TemplateLibraryItem[] {
  return buildTemplateLibrary(
    TEMPLATES.filter(template => FALLBACK_TEMPLATE_IDS.includes(template.templateId as (typeof FALLBACK_TEMPLATE_IDS)[number])) as Template[]
  );
}

export function getDefaultLibrary(): TemplateLibraryItem[] {
  return buildTemplateLibrary(TEMPLATES as Template[]);
}

export function getTemplateStats(items: TemplateLibraryItem[]) {
  const freeCount = items.filter(item => !item.isPremium).length;
  const premiumCount = items.filter(item => item.isPremium).length;
  const industryCount = new Set(items.flatMap(item => item.industries)).size;

  return { freeCount, premiumCount, industryCount };
}

export const STYLE_FILTERS: { key: TemplateStyleFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'modern', label: 'Hiện đại' },
  { key: 'minimal', label: 'Tối giản' },
  { key: 'creative', label: 'Sáng tạo' },
  { key: 'professional', label: 'Chuyên nghiệp' },
  { key: 'ats-friendly', label: 'ATS-friendly' },
];

export const INDUSTRY_FILTERS: { key: TemplateIndustryFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'student', label: 'Sinh viên' },
  { key: 'fresher', label: 'Fresher' },
  { key: 'it', label: 'IT / Kỹ thuật' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'accounting', label: 'Kế toán' },
  { key: 'office', label: 'Văn phòng' },
  { key: 'design', label: 'Thiết kế' },
];

export const ACCESS_FILTERS: { key: TemplateAccessFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'free', label: 'Free' },
  { key: 'premium', label: 'Premium' },
];

export const SORT_OPTIONS: { key: TemplateSort; label: string }[] = [
  { key: 'popular', label: 'Phổ biến nhất' },
  { key: 'newest', label: 'Mới nhất' },
  { key: 'easy', label: 'Dễ dùng nhất' },
];

export const TEMPLATE_RECOMMENDATIONS = [
  {
    label: 'Sinh viên / chưa có kinh nghiệm',
    templateSlug: 'student-clean',
    suggestion: 'Student Clean',
  },
  {
    label: 'IT / kỹ thuật',
    templateSlug: 'simple-ats',
    suggestion: 'Simple ATS',
  },
  {
    label: 'Marketing / sáng tạo',
    templateSlug: 'marketing-creative',
    suggestion: 'Marketing Creative',
  },
  {
    label: 'Văn phòng / phổ thông',
    templateSlug: 'office-minimal',
    suggestion: 'Office Minimal',
  },
  {
    label: 'Cần CV nghiêm túc, sạch',
    templateSlug: 'executive-pro',
    suggestion: 'Executive Pro',
  },
];
