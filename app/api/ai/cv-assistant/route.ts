import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

import { safeParseJson, validateAtsReviewResponse } from '@/lib/atsReview';
import { canUseAiAction, FREE_AI_DAILY_LIMIT, AiAction } from '@/lib/ai';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { EnvValidationError, getGeminiApiKey } from '@/lib/env/server';
import {
  validateFresherSummaryResponse,
  validateStudentBulletsResponse,
} from '@/lib/studentAi';
import { validateTailorCvForJobResponse } from '@/lib/tailorCv';
import { ensureUserDocumentWithAdmin } from '@/lib/userDocumentAdmin';

export const runtime = 'nodejs';

const personalInfoSchema = z.object({
  fullName: z.string().optional().default(''),
  jobTitle: z.string().optional().default(''),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
});

const experienceSchema = z.object({
  company: z.string().optional().default(''),
  role: z.string().optional().default(''),
  location: z.string().optional().default(''),
  from: z.string().optional().default(''),
  to: z.string().optional().default(''),
  current: z.boolean().optional().default(false),
  description: z.string().optional().default(''),
});

const studentAiInputSchema = z.object({
  targetJob: z.string().optional().default(''),
  fieldOfStudy: z.string().optional().default(''),
  itemName: z.string().optional().default(''),
  role: z.string().optional().default(''),
  technologies: z.array(z.string()).default([]),
  achievements: z.string().optional().default(''),
});

const summaryRequestSchema = z.object({
  action: z.literal('generateSummary'),
  language: z.enum(['vi', 'en']),
  cv: z.object({
    title: z.string().optional().default(''),
    targetJob: z.string().optional().default(''),
    targetCompany: z.string().optional().default(''),
    personalInfo: personalInfoSchema,
    experience: z.array(experienceSchema).default([]),
    skills: z.array(z.object({
      name: z.string(),
      level: z.number().optional(),
      category: z.string().optional(),
    })).default([]),
    education: z.array(z.object({
      school: z.string().optional().default(''),
      degree: z.string().optional().default(''),
      field: z.string().optional().default(''),
    })).default([]),
  }),
});

const rewriteExperienceRequestSchema = z.object({
  action: z.literal('rewriteExperience'),
  cvId: z.string().optional().default(''),
  language: z.enum(['vi', 'en']),
  cv: z.object({
    targetJob: z.string().optional().default(''),
    targetCompany: z.string().optional().default(''),
    jobDescription: z.string().optional().default(''),
  }),
  experience: experienceSchema,
});

const atsReviewRequestSchema = z.object({
  action: z.literal('atsReview'),
  cvId: z.string().optional().default(''),
  language: z.enum(['vi', 'en']),
  cv: z.object({
    title: z.string().optional().default(''),
    targetJob: z.string().optional().default(''),
    targetCompany: z.string().optional().default(''),
    jobDescription: z.string().optional().default(''),
    personalInfo: personalInfoSchema,
    summary: z.string().optional().default(''),
    experience: z.array(experienceSchema).default([]),
    skills: z.array(z.object({
      name: z.string(),
      level: z.number().optional(),
      category: z.string().optional(),
    })).default([]),
    education: z.array(z.object({
      school: z.string().optional().default(''),
      degree: z.string().optional().default(''),
      field: z.string().optional().default(''),
    })).default([]),
    projects: z.array(z.object({
      name: z.string().optional().default(''),
      role: z.string().optional().default(''),
      description: z.string().optional().default(''),
      technologies: z.array(z.string()).default([]),
    })).default([]),
  }),
});

const coverLetterRequestSchema = z.object({
  action: z.literal('generateCoverLetter'),
  cvId: z.string().optional().default(''),
  language: z.enum(['vi', 'en']),
  cv: z.object({
    title: z.string().optional().default(''),
    targetJob: z.string().optional().default(''),
    targetCompany: z.string().optional().default(''),
    jobDescription: z.string().optional().default(''),
    personalInfo: personalInfoSchema,
    summary: z.string().optional().default(''),
    experience: z.array(experienceSchema).default([]),
    skills: z.array(z.object({
      name: z.string(),
      level: z.number().optional(),
      category: z.string().optional(),
    })).default([]),
  }),
  recipientName: z.string().optional().default(''),
  tone: z.enum(['professional', 'friendly', 'concise']).optional().default('professional'),
});

const tailorCvForJobRequestSchema = z.object({
  action: z.literal('tailorCvForJob'),
  language: z.enum(['vi', 'en']),
  cv: z.object({
    title: z.string().optional().default(''),
    targetJob: z.string().optional().default(''),
    targetCompany: z.string().optional().default(''),
    jobDescription: z.string().optional().default(''),
    personalInfo: personalInfoSchema,
    summary: z.string().optional().default(''),
    experience: z.array(experienceSchema).default([]),
    skills: z.array(z.object({
      name: z.string(),
      level: z.number().optional(),
      category: z.string().optional(),
    })).default([]),
    education: z.array(z.object({
      school: z.string().optional().default(''),
      degree: z.string().optional().default(''),
      field: z.string().optional().default(''),
    })).default([]),
  }),
});

const fresherSummaryRequestSchema = z.object({
  action: z.literal('fresherSummary'),
  language: z.enum(['vi', 'en']),
  profile: studentAiInputSchema,
});

const generateProjectBulletsRequestSchema = z.object({
  action: z.literal('generateProjectBullets'),
  language: z.enum(['vi', 'en']),
  project: studentAiInputSchema,
});

const convertActivitiesToCvBulletsRequestSchema = z.object({
  action: z.literal('convertActivitiesToCvBullets'),
  language: z.enum(['vi', 'en']),
  activity: studentAiInputSchema,
});

const requestSchema = z.discriminatedUnion('action', [
  summaryRequestSchema,
  fresherSummaryRequestSchema,
  rewriteExperienceRequestSchema,
  atsReviewRequestSchema,
  coverLetterRequestSchema,
  generateProjectBulletsRequestSchema,
  convertActivitiesToCvBulletsRequestSchema,
  tailorCvForJobRequestSchema,
]);

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

function sanitizeText(value: string | undefined) {
  return (value || '').replace(/\r/g, '').trim();
}

function extractBulletLines(text: string) {
  return sanitizeText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith('-') || line.startsWith('â€¢') ? line : `- ${line}`));
}

async function saveAiHistoryRecord(params: {
  adminDb: ReturnType<typeof getAdminDb>;
  userId: string;
  action: AiAction;
  cvId?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}) {
  const { adminDb, userId, action, cvId, input, output } = params;

  if (!['rewriteExperience', 'atsReview', 'generateCoverLetter'].includes(action)) {
    return;
  }

  const historyRef = adminDb.collection('aiHistory').doc();
  await historyRef.set({
    id: historyRef.id,
    userId,
    action,
    cvId: cvId || '',
    input,
    output,
    createdAt: FieldValue.serverTimestamp(),
  });
}

function buildSummaryPrompt(
  language: 'vi' | 'en',
  plan: 'free' | 'premium',
  payload: z.infer<typeof summaryRequestSchema>
) {
  const { cv } = payload;
  const topSkills = cv.skills.map((skill) => skill.name).filter(Boolean).slice(0, 8).join(', ');
  const recentExperience = cv.experience
    .slice(0, 3)
    .map((item, index) => {
      const timeline = item.current ? `${item.from} - Present` : `${item.from} - ${item.to}`;
      return `${index + 1}. ${item.role} at ${item.company} (${timeline}): ${item.description}`;
    })
    .join('\n');

  const education = cv.education
    .slice(0, 2)
    .map((item) => [item.degree, item.field, item.school].filter(Boolean).join(' - '))
    .filter(Boolean)
    .join('\n');

  const system =
    language === 'vi'
      ? 'Báº¡n lÃ  chuyÃªn gia viáº¿t CV. Chá»‰ tráº£ vá» Ä‘Ãºng Ä‘oáº¡n tÃ³m táº¯t cuá»‘i cÃ¹ng, khÃ´ng thÃªm tiÃªu Ä‘á», khÃ´ng markdown, khÃ´ng giáº£i thÃ­ch.'
      : 'You are a resume writing expert. Return only the final summary paragraph with no heading, markdown, or explanation.';

  const goal =
    language === 'vi'
      ? plan === 'free'
        ? 'Viáº¿t Ä‘oáº¡n summary CV 3-4 cÃ¢u, rÃµ rÃ ng, trung tÃ­nh, dá»… dÃ¹ng ngay.'
        : 'Viáº¿t Ä‘oáº¡n summary CV 4-5 cÃ¢u, thuyáº¿t phá»¥c, nháº¥n máº¡nh giÃ¡ trá»‹ á»©ng tuyá»ƒn vÃ  tá»‘i Æ°u ngÃ´n ngá»¯ tuyá»ƒn dá»¥ng.'
      : plan === 'free'
        ? 'Write a 3-4 sentence resume summary that is clear, concise, and broadly usable.'
        : 'Write a 4-5 sentence resume summary that is persuasive, tailored for hiring, and uses strong recruiting language.';

  const constraints =
    language === 'vi'
      ? [
          'Tá»‘i Ä‘a 90 tá»«.',
          'Æ¯u tiÃªn thÃ nh tÃ­ch, sá»‘ liá»‡u, ká»¹ nÄƒng cá»‘t lÃµi.',
          'Náº¿u thiáº¿u dá»¯ liá»‡u thÃ¬ khÃ´ng bá»‹a.',
          'KhÃ´ng dÃ¹ng emoji.',
          plan === 'premium' ? 'Náº¿u cÃ³ target job/company thÃ¬ tinh chá»‰nh theo má»¥c tiÃªu Ä‘Ã³.' : 'Giá»¯ summary Ä‘á»§ tá»•ng quÃ¡t Ä‘á»ƒ dÃ¹ng miá»…n phÃ­.',
        ]
      : [
          'Maximum 90 words.',
          'Prioritize achievements, metrics, and core skills.',
          'Do not invent facts.',
          'No emoji.',
          plan === 'premium' ? 'If target job/company exists, tailor the summary to that target.' : 'Keep the summary general-purpose for a free tier user.',
        ];

  return [
    system,
    '',
    goal,
    '',
    language === 'vi' ? 'Dá»¯ liá»‡u á»©ng viÃªn:' : 'Candidate data:',
    `- Full name: ${cv.personalInfo.fullName || 'N/A'}`,
    `- Current job title: ${cv.personalInfo.jobTitle || 'N/A'}`,
    `- CV title: ${cv.title || 'N/A'}`,
    `- Target job: ${cv.targetJob || 'N/A'}`,
    `- Target company: ${cv.targetCompany || 'N/A'}`,
    `- Top skills: ${topSkills || 'N/A'}`,
    education ? `- Education:\n${education}` : '- Education: N/A',
    recentExperience ? `- Experience:\n${recentExperience}` : '- Experience: N/A',
    '',
    language === 'vi' ? 'RÃ ng buá»™c:' : 'Constraints:',
    ...constraints.map((item) => `- ${item}`),
  ].join('\n');
}

function buildExperiencePrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof rewriteExperienceRequestSchema>
) {
  const { cv, experience } = payload;
  const system =
    language === 'vi'
      ? 'Báº¡n lÃ  chuyÃªn gia tá»‘i Æ°u pháº§n kinh nghiá»‡m trong CV. Chá»‰ tráº£ vá» ná»™i dung mÃ´ táº£ cuá»‘i cÃ¹ng. KhÃ´ng thÃªm tiÃªu Ä‘á», markdown ngoÃ i bullet, hoáº·c giáº£i thÃ­ch.'
      : 'You are a resume experience optimizer. Return only the final rewritten experience content. No heading or explanation.';

  const constraints =
    language === 'vi'
      ? [
          'Viáº¿t 3-5 bullet ngáº¯n.',
          'Má»—i bullet báº¯t Ä‘áº§u báº±ng Ä‘á»™ng tá»« máº¡nh.',
          'Æ¯u tiÃªn thÃ nh tÃ­ch Ä‘o Ä‘Æ°á»£c, cÃ´ng nghá»‡, pháº¡m vi cÃ´ng viá»‡c.',
          'KhÃ´ng bá»‹a sá»‘ liá»‡u náº¿u input khÃ´ng cÃ³.',
          'Giá»¯ vÄƒn phong phÃ¹ há»£p CV chuyÃªn nghiá»‡p.',
        ]
      : [
          'Write 3-5 short bullet points.',
          'Start each bullet with a strong action verb.',
          'Prioritize measurable impact, tools, and scope.',
          'Do not invent metrics when not provided.',
          'Keep the style suitable for a professional resume.',
        ];

  return [
    system,
    '',
    language === 'vi'
      ? 'Viáº¿t láº¡i Ä‘oáº¡n mÃ´ táº£ kinh nghiá»‡m dÆ°á»›i Ä‘Ã¢y Ä‘á»ƒ máº¡nh hÆ¡n cho CV.'
      : 'Rewrite the following experience description so it is stronger for a resume.',
    '',
    `- Role: ${experience.role || 'N/A'}`,
    `- Company: ${experience.company || 'N/A'}`,
    `- Location: ${experience.location || 'N/A'}`,
    `- Target job: ${cv.targetJob || 'N/A'}`,
    `- Target company: ${cv.targetCompany || 'N/A'}`,
    `- Job description: ${cv.jobDescription || 'N/A'}`,
    `- Existing description:\n${experience.description || 'N/A'}`,
    '',
    language === 'vi' ? 'RÃ ng buá»™c:' : 'Constraints:',
    ...constraints.map((item) => `- ${item}`),
  ].join('\n');
}

function buildAtsReviewPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof atsReviewRequestSchema>
) {
  const { cv } = payload;
  const experience = cv.experience
    .slice(0, 5)
    .map((item, index) => `${index + 1}. ${item.role} at ${item.company}: ${item.description}`)
    .join('\n');
  const projects = cv.projects
    .slice(0, 4)
    .map((item, index) => `${index + 1}. ${item.name} (${item.role}): ${item.description}. Tech: ${item.technologies.join(', ')}`)
    .join('\n');
  const skills = cv.skills.map((skill) => skill.name).filter(Boolean).join(', ');
  return [
    language === 'vi'
      ? 'Ban la chuyen gia ATS reviewer cho CV. Hay tra ve JSON hop le duy nhat, khong markdown, khong giai thich.'
      : 'You are an ATS reviewer for resumes. Return valid JSON only, with no markdown or explanation.',
    '',
    language === 'vi'
      ? 'Danh gia CV so voi vi tri ung tuyen va mo ta cong viec.'
      : 'Review the resume against the target role and job description.',
    '',
    `- Full name: ${cv.personalInfo.fullName || 'N/A'}`,
    `- Current title: ${cv.personalInfo.jobTitle || 'N/A'}`,
    `- CV title: ${cv.title || 'N/A'}`,
    `- Target job: ${cv.targetJob || 'N/A'}`,
    `- Target company: ${cv.targetCompany || 'N/A'}`,
    `- Job description:\n${cv.jobDescription || 'N/A'}`,
    `- Summary:\n${cv.summary || 'N/A'}`,
    `- Skills: ${skills || 'N/A'}`,
    `- Experience:\n${experience || 'N/A'}`,
    `- Projects:\n${projects || 'N/A'}`,
    '',
    language === 'vi'
      ? 'Tra ve dung JSON theo schema: {"matchScore":number,"missingKeywords":string[],"matchedKeywords":string[],"weakSections":string[],"improvementSuggestions":string[],"suggestedSummary":string,"suggestedExperienceBullets":string[]}. matchScore tu 0 den 100. suggestedSummary dai 2-4 cau. suggestedExperienceBullets gom 3-5 bullet ngan, bat dau bang dong tu hanh dong va khong bia thong tin.'
      : 'Return JSON with this exact schema: {"matchScore":number,"missingKeywords":string[],"matchedKeywords":string[],"weakSections":string[],"improvementSuggestions":string[],"suggestedSummary":string,"suggestedExperienceBullets":string[]}. matchScore must be between 0 and 100. suggestedSummary should be 2-4 sentences. suggestedExperienceBullets should contain 3-5 concise bullets, begin with action verbs, and must not invent facts.',
  ].join('\n');
}
function buildAtsReviewRetryPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof atsReviewRequestSchema>
) {
  const { cv } = payload;
  const experience = cv.experience
    .slice(0, 3)
    .map((item, index) => `${index + 1}. ${item.role} at ${item.company}: ${item.description}`)
    .join('\n');
  const skills = cv.skills
    .map((skill) => skill.name)
    .filter(Boolean)
    .slice(0, 12)
    .join(', ');
  return [
    language === 'vi'
      ? 'Chi tra ve dung JSON hop le, khong markdown, khong text thua.'
      : 'Return valid JSON only. No markdown. No extra text.',
    language === 'vi'
      ? '{"matchScore":number,"missingKeywords":string[],"matchedKeywords":string[],"weakSections":string[],"improvementSuggestions":string[],"suggestedSummary":string,"suggestedExperienceBullets":string[]}'
      : '{"matchScore":number,"missingKeywords":string[],"matchedKeywords":string[],"weakSections":string[],"improvementSuggestions":string[],"suggestedSummary":string,"suggestedExperienceBullets":string[]}',
    `- Target job: ${cv.targetJob || 'N/A'}`,
    `- Target company: ${cv.targetCompany || 'N/A'}`,
    `- Job description:\n${cv.jobDescription || 'N/A'}`,
    `- Summary:\n${cv.summary || 'N/A'}`,
    `- Skills: ${skills || 'N/A'}`,
    `- Experience:\n${experience || 'N/A'}`,
    language === 'vi'
      ? 'matchScore tu 0 den 100. Moi mang nen co 2-8 y ngan, ro rang. suggestedSummary dai 2-4 cau. suggestedExperienceBullets gom 3-5 bullet.'
      : 'matchScore must be 0-100. Each array should contain 2-8 concise items. suggestedSummary should be 2-4 sentences. suggestedExperienceBullets should contain 3-5 bullets.',
  ].join('\n\n');
}
function buildCoverLetterPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof coverLetterRequestSchema>
) {
  const { cv, recipientName, tone } = payload;
  const topExperience = cv.experience
    .slice(0, 3)
    .map((item, index) => `${index + 1}. ${item.role} at ${item.company}: ${item.description}`)
    .join('\n');
  const topSkills = cv.skills.map((skill) => skill.name).slice(0, 10).join(', ');
  return [
    language === 'vi'
      ? 'Ban la chuyen gia viet cover letter. Chi tra ve noi dung thu hoan chinh, khong giai thich, khong markdown.'
      : 'You are a cover letter expert. Return only the completed cover letter with no markdown or explanation.',
    '',
    language === 'vi'
      ? 'Viet cover letter ngan gon, chuyen nghiep, thuyet phuc.'
      : 'Write a concise, professional, persuasive cover letter.',
    '',
    `- Candidate name: ${cv.personalInfo.fullName || 'N/A'}`,
    `- Current title: ${cv.personalInfo.jobTitle || 'N/A'}`,
    `- Recipient name: ${recipientName || 'Hiring Manager'}`,
    `- Target job: ${cv.targetJob || 'N/A'}`,
    `- Target company: ${cv.targetCompany || 'N/A'}`,
    `- Tone: ${tone}`,
    `- Summary: ${cv.summary || 'N/A'}`,
    `- Top skills: ${topSkills || 'N/A'}`,
    `- Job description:\n${cv.jobDescription || 'N/A'}`,
    `- Experience highlights:\n${topExperience || 'N/A'}`,
    '',
    language === 'vi'
      ? 'Do dai khoang 220-320 tu. Phai co loi chao, ly do ung tuyen, diem manh phu hop, kinh nghiem/ky nang lien quan va loi cam on. Ca nhan hoa theo cong viec muc tieu neu co du lieu. Khong bia thong tin.'
      : 'Length around 220-320 words. It must include a greeting, why the candidate is applying, relevant strengths, related experience/skills, and a thank-you closing. Personalize to the target role when data exists. Do not invent facts.',
  ].join('\n');
}
function buildTailorCvForJobPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof tailorCvForJobRequestSchema>
) {
  const { cv } = payload;
  const skills = cv.skills
    .map((skill) => skill.name)
    .filter(Boolean)
    .join(', ');

  const experience = cv.experience
    .map((item, index) => {
      const timeline = item.current ? `${item.from} - Present` : `${item.from} - ${item.to}`;
      return `${index}. ${item.role} at ${item.company} (${timeline})\nCurrent description:\n${item.description || 'N/A'}`;
    })
    .join('\n\n');

  const education = cv.education
    .slice(0, 3)
    .map((item) => [item.degree, item.field, item.school].filter(Boolean).join(' - '))
    .filter(Boolean)
    .join('\n');

  return [
    language === 'vi'
      ? 'Báº¡n lÃ  chuyÃªn gia tá»‘i Æ°u CV theo job cá»¥ thá»ƒ. Chá»‰ tráº£ vá» JSON há»£p lá»‡ duy nháº¥t, khÃ´ng markdown, khÃ´ng giáº£i thÃ­ch.'
      : 'You are a resume tailoring expert. Return valid JSON only with no markdown or explanation.',
    '',
    language === 'vi'
      ? 'HÃ£y Ä‘á» xuáº¥t cÃ¡ch tá»‘i Æ°u CV nÃ y cho vá»‹ trÃ­ má»¥c tiÃªu, nhÆ°ng khÃ´ng bá»‹a dá»¯ liá»‡u.'
      : 'Suggest how to tailor this resume for the target job without inventing facts.',
    '',
    `- Full name: ${cv.personalInfo.fullName || 'N/A'}`,
    `- Current title: ${cv.personalInfo.jobTitle || 'N/A'}`,
    `- CV title: ${cv.title || 'N/A'}`,
    `- Current summary:\n${cv.summary || 'N/A'}`,
    `- Target job: ${cv.targetJob || 'N/A'}`,
    `- Target company: ${cv.targetCompany || 'N/A'}`,
    `- Job description:\n${cv.jobDescription || 'N/A'}`,
    `- Skills: ${skills || 'N/A'}`,
    education ? `- Education:\n${education}` : '- Education: N/A',
    experience ? `- Experience:\n${experience}` : '- Experience: N/A',
    '',
    language === 'vi'
      ? 'Tráº£ vá» Ä‘Ãºng JSON theo schema: {"improvedSummary":string,"suggestedSkillsOrder":string[],"improvedExperienceBullets":[{"experienceIndex":number,"role":string,"company":string,"bullets":string[]}],"keywordsMissing":string[],"recommendations":string[]}.'
      : 'Return JSON with this exact schema: {"improvedSummary":string,"suggestedSkillsOrder":string[],"improvedExperienceBullets":[{"experienceIndex":number,"role":string,"company":string,"bullets":string[]}],"keywordsMissing":string[],"recommendations":string[]}.',
    language === 'vi'
      ? 'Chá»‰ dÃ¹ng skill Ä‘Ã£ cÃ³ sáºµn trong CV cho suggestedSkillsOrder. Má»—i bullets array nÃªn cÃ³ 2-5 gáº¡ch Ä‘áº§u dÃ²ng ngáº¯n. experienceIndex pháº£i trÃ¹ng vá»›i index Ä‘Ã£ cho.'
      : 'Use only skills already present in the resume for suggestedSkillsOrder. Each bullets array should contain 2-5 concise bullets. experienceIndex must match the provided indexes.',
  ].join('\n');
}

function buildTailorCvForJobRetryPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof tailorCvForJobRequestSchema>
) {
  const { cv } = payload;
  const skills = cv.skills.map((skill) => skill.name).filter(Boolean).join(', ');
  const experience = cv.experience
    .map((item, index) => `${index}. ${item.role} at ${item.company}: ${item.description || 'N/A'}`)
    .join('\n');

  return [
    language === 'vi'
      ? 'Chá»‰ tráº£ vá» JSON há»£p lá»‡, khÃ´ng markdown, khÃ´ng text thá»«a.'
      : 'Return valid JSON only. No markdown. No extra text.',
    '{"improvedSummary":string,"suggestedSkillsOrder":string[],"improvedExperienceBullets":[{"experienceIndex":number,"role":string,"company":string,"bullets":string[]}],"keywordsMissing":string[],"recommendations":string[]}',
    `- Target job: ${cv.targetJob || 'N/A'}`,
    `- Target company: ${cv.targetCompany || 'N/A'}`,
    `- Job description:\n${cv.jobDescription || 'N/A'}`,
    `- Current summary:\n${cv.summary || 'N/A'}`,
    `- Skills: ${skills || 'N/A'}`,
    `- Experience:\n${experience || 'N/A'}`,
    language === 'vi'
      ? 'Chá»‰ dÃ¹ng dá»¯ liá»‡u cÃ³ sáºµn. KhÃ´ng bá»‹a. suggestedSkillsOrder chá»‰ gá»“m skill hiá»‡n cÃ³.'
      : 'Use only existing resume data. Do not invent facts. suggestedSkillsOrder must contain only existing skills.',
  ].join('\n\n');
}

function buildFresherSummaryPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof fresherSummaryRequestSchema>
) {
  const { profile } = payload;

  return [
    language === 'vi'
      ? 'Báº¡n lÃ  chuyÃªn gia viáº¿t CV cho sinh viÃªn/fresher. Chá»‰ tráº£ vá» JSON há»£p lá»‡, khÃ´ng markdown, khÃ´ng giáº£i thÃ­ch.'
      : 'You are a resume writer for students and freshers. Return valid JSON only with no markdown or explanation.',
    '',
    language === 'vi'
      ? 'Viáº¿t Ä‘oáº¡n summary CV 3-5 cÃ¢u, chuyÃªn nghiá»‡p, tá»± tin nhÆ°ng trung thá»±c.'
      : 'Write a 3-5 sentence CV summary that sounds professional, confident, and truthful.',
    `- Target job: ${profile.targetJob || 'N/A'}`,
    `- Field of study: ${profile.fieldOfStudy || 'N/A'}`,
    `- Project or activity title: ${profile.itemName || 'N/A'}`,
    `- Role: ${profile.role || 'N/A'}`,
    `- Technologies/skills: ${profile.technologies.join(', ') || 'N/A'}`,
    `- Achievements/results: ${profile.achievements || 'N/A'}`,
    '',
    language === 'vi'
      ? 'KhÃ´ng bá»‹a sá»‘ liá»‡u. Náº¿u thiáº¿u thÃ nh tÃ­ch Ä‘á»‹nh lÆ°á»£ng, dÃ¹ng wording trung tÃ­nh. Tráº£ vá» JSON: {"summary":string}.'
      : 'Do not invent metrics. If quantified outcomes are missing, use neutral wording. Return JSON: {"summary":string}.',
  ].join('\n');
}

function buildFresherSummaryRetryPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof fresherSummaryRequestSchema>
) {
  const { profile } = payload;

  return [
    language === 'vi'
      ? 'Chá»‰ tráº£ vá» JSON há»£p lá»‡, khÃ´ng markdown, khÃ´ng text thá»«a.'
      : 'Return valid JSON only. No markdown. No extra text.',
    '{"summary":string}',
    `- Target job: ${profile.targetJob || 'N/A'}`,
    `- Field of study: ${profile.fieldOfStudy || 'N/A'}`,
    `- Skills: ${profile.technologies.join(', ') || 'N/A'}`,
    `- Achievements: ${profile.achievements || 'N/A'}`,
    language === 'vi'
      ? 'Summary pháº£i dÃ i 3-5 cÃ¢u, trung thá»±c, khÃ´ng bá»‹a sá»‘ liá»‡u.'
      : 'Summary must be 3-5 sentences, truthful, and must not invent metrics.',
  ].join('\n\n');
}

function buildProjectBulletsPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof generateProjectBulletsRequestSchema>
) {
  const { project } = payload;

  return [
    language === 'vi'
      ? 'Báº¡n lÃ  chuyÃªn gia viáº¿t bullet CV cho sinh viÃªn/fresher. Chá»‰ tráº£ vá» JSON há»£p lá»‡, khÃ´ng markdown, khÃ´ng giáº£i thÃ­ch.'
      : 'You are a resume bullet writer for students and freshers. Return valid JSON only with no markdown or explanation.',
    '',
    language === 'vi'
      ? 'Viáº¿t 3-5 bullet CV ngáº¯n, rÃµ, chuyÃªn nghiá»‡p cho má»¥c Project.'
      : 'Write 3-5 short, clear, professional CV bullets for a Project section.',
    `- Target job: ${project.targetJob || 'N/A'}`,
    `- Field of study: ${project.fieldOfStudy || 'N/A'}`,
    `- Project name: ${project.itemName || 'N/A'}`,
    `- Role: ${project.role || 'N/A'}`,
    `- Technologies/skills: ${project.technologies.join(', ') || 'N/A'}`,
    `- Achievements/results: ${project.achievements || 'N/A'}`,
    '',
    language === 'vi'
      ? 'Má»—i bullet báº¯t Ä‘áº§u báº±ng Ä‘á»™ng tá»« máº¡nh. KhÃ´ng bá»‹a sá»‘ liá»‡u. Náº¿u thiáº¿u káº¿t quáº£ Ä‘á»‹nh lÆ°á»£ng, dÃ¹ng wording trung tÃ­nh. Tráº£ vá» JSON: {"bullets":string[]}.'
      : 'Each bullet must start with a strong action verb. Do not invent metrics. If quantified outcomes are missing, use neutral wording. Return JSON: {"bullets":string[]}.',
  ].join('\n');
}

function buildProjectBulletsRetryPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof generateProjectBulletsRequestSchema>
) {
  const { project } = payload;

  return [
    language === 'vi'
      ? 'Chá»‰ tráº£ vá» JSON há»£p lá»‡, khÃ´ng markdown, khÃ´ng text thá»«a.'
      : 'Return valid JSON only. No markdown. No extra text.',
    '{"bullets":string[]}',
    `- Project name: ${project.itemName || 'N/A'}`,
    `- Role: ${project.role || 'N/A'}`,
    `- Technologies: ${project.technologies.join(', ') || 'N/A'}`,
    `- Achievements: ${project.achievements || 'N/A'}`,
    language === 'vi'
      ? 'Tráº£ vá» Ä‘Ãºng 3-5 bullet, trung tÃ­nh náº¿u thiáº¿u sá»‘ liá»‡u.'
      : 'Return exactly 3-5 bullets and use neutral wording if metrics are missing.',
  ].join('\n\n');
}

function buildActivityBulletsPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof convertActivitiesToCvBulletsRequestSchema>
) {
  const { activity } = payload;

  return [
    language === 'vi'
      ? 'Báº¡n lÃ  chuyÃªn gia chuyá»ƒn hoáº¡t Ä‘á»™ng/CLB/part-time thÃ nh bullet CV. Chá»‰ tráº£ vá» JSON há»£p lá»‡, khÃ´ng markdown, khÃ´ng giáº£i thÃ­ch.'
      : 'You are a resume writer who converts activities, clubs, and part-time work into CV bullets. Return valid JSON only with no markdown or explanation.',
    '',
    language === 'vi'
      ? 'Viáº¿t 3-5 bullet CV ngáº¯n, chuyÃªn nghiá»‡p cho má»¥c Activities.'
      : 'Write 3-5 short professional CV bullets for an Activities section.',
    `- Target job: ${activity.targetJob || 'N/A'}`,
    `- Field of study: ${activity.fieldOfStudy || 'N/A'}`,
    `- Activity name: ${activity.itemName || 'N/A'}`,
    `- Role: ${activity.role || 'N/A'}`,
    `- Technologies/skills: ${activity.technologies.join(', ') || 'N/A'}`,
    `- Achievements/results: ${activity.achievements || 'N/A'}`,
    '',
    language === 'vi'
      ? 'Nháº¥n máº¡nh trÃ¡ch nhiá»‡m, ká»¹ nÄƒng, phá»‘i há»£p vÃ  káº¿t quáº£ thá»±c táº¿. KhÃ´ng bá»‹a sá»‘ liá»‡u. Náº¿u thiáº¿u Ä‘á»‹nh lÆ°á»£ng, dÃ¹ng wording trung tÃ­nh. Tráº£ vá» JSON: {"bullets":string[]}.'
      : 'Emphasize responsibilities, skills, collaboration, and concrete outcomes. Do not invent metrics. If quantified results are missing, use neutral wording. Return JSON: {"bullets":string[]}.',
  ].join('\n');
}

function buildActivityBulletsRetryPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof convertActivitiesToCvBulletsRequestSchema>
) {
  const { activity } = payload;

  return [
    language === 'vi'
      ? 'Chá»‰ tráº£ vá» JSON há»£p lá»‡, khÃ´ng markdown, khÃ´ng text thá»«a.'
      : 'Return valid JSON only. No markdown. No extra text.',
    '{"bullets":string[]}',
    `- Activity name: ${activity.itemName || 'N/A'}`,
    `- Role: ${activity.role || 'N/A'}`,
    `- Skills: ${activity.technologies.join(', ') || 'N/A'}`,
    `- Achievements: ${activity.achievements || 'N/A'}`,
    language === 'vi'
      ? 'Tráº£ vá» Ä‘Ãºng 3-5 bullet, khÃ´ng bá»‹a sá»‘ liá»‡u.'
      : 'Return exactly 3-5 bullets and do not invent metrics.',
  ].join('\n\n');
}

async function generateText(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return sanitizeText(response.text);
}

class AtsInvalidFormatError extends Error {
  code = 'ATS_INVALID_FORMAT' as const;

  constructor() {
    super('AI tráº£ vá» Ä‘á»‹nh dáº¡ng ATS khÃ´ng há»£p lá»‡. Vui lÃ²ng thá»­ láº¡i.');
  }
}

function logAtsReviewDebug(stage: 'primary' | 'retry', rawText: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[atsReview:${stage}] raw response`, rawText);
  }
}

function parseAtsReviewResponse(rawText: string) {
  const parsed = safeParseJson(rawText);
  if (!parsed.success) {
    return {
      success: false as const,
      reason: 'json',
    };
  }

  const validated = validateAtsReviewResponse(parsed.data);
  if (!validated.success) {
    return {
      success: false as const,
      reason: 'schema',
    };
  }

  return {
    success: true as const,
    review: validated.data,
  };
}

async function generateAtsReview(
  language: 'vi' | 'en',
  payload: z.infer<typeof atsReviewRequestSchema>
) {
  const primaryRaw = await generateText(buildAtsReviewPrompt(language, payload));
  const primaryParsed = parseAtsReviewResponse(primaryRaw);
  if (primaryParsed.success) {
    return primaryParsed.review;
  }

  logAtsReviewDebug('primary', primaryRaw);

  const retryRaw = await generateText(buildAtsReviewRetryPrompt(language, payload));
  const retryParsed = parseAtsReviewResponse(retryRaw);
  if (retryParsed.success) {
    return retryParsed.review;
  }

  logAtsReviewDebug('retry', retryRaw);
  throw new AtsInvalidFormatError();
}

class TailorCvInvalidFormatError extends Error {
  code = 'TAILOR_INVALID_FORMAT' as const;

  constructor() {
    super('AI tráº£ vá» Ä‘á»‹nh dáº¡ng Tailor CV khÃ´ng há»£p lá»‡. Vui lÃ²ng thá»­ láº¡i.');
  }
}

function logTailorCvDebug(stage: 'primary' | 'retry', rawText: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[tailorCvForJob:${stage}] raw response`, rawText);
  }
}

function parseTailorCvForJobResponse(rawText: string) {
  const parsed = safeParseJson(rawText);
  if (!parsed.success) {
    return {
      success: false as const,
      reason: 'json',
    };
  }

  const validated = validateTailorCvForJobResponse(parsed.data);
  if (!validated.success) {
    return {
      success: false as const,
      reason: 'schema',
    };
  }

  return {
    success: true as const,
    tailor: validated.data,
  };
}

async function generateTailorCvForJob(
  language: 'vi' | 'en',
  payload: z.infer<typeof tailorCvForJobRequestSchema>
) {
  const primaryRaw = await generateText(buildTailorCvForJobPrompt(language, payload));
  const primaryParsed = parseTailorCvForJobResponse(primaryRaw);
  if (primaryParsed.success) {
    return primaryParsed.tailor;
  }

  logTailorCvDebug('primary', primaryRaw);

  const retryRaw = await generateText(buildTailorCvForJobRetryPrompt(language, payload));
  const retryParsed = parseTailorCvForJobResponse(retryRaw);
  if (retryParsed.success) {
    return retryParsed.tailor;
  }

  logTailorCvDebug('retry', retryRaw);
  throw new TailorCvInvalidFormatError();
}

class StudentAiInvalidFormatError extends Error {
  constructor(
    public code:
      | 'FRESHER_SUMMARY_INVALID_FORMAT'
      | 'PROJECT_BULLETS_INVALID_FORMAT'
      | 'ACTIVITY_BULLETS_INVALID_FORMAT',
    message: string
  ) {
    super(message);
  }
}

function logStudentAiDebug(
  action: 'fresherSummary' | 'generateProjectBullets' | 'convertActivitiesToCvBullets',
  stage: 'primary' | 'retry',
  rawText: string
) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[${action}:${stage}] raw response`, rawText);
  }
}

function parseFresherSummaryResponse(rawText: string) {
  const parsed = safeParseJson(rawText);
  if (!parsed.success) {
    return { success: false as const };
  }

  const validated = validateFresherSummaryResponse(parsed.data);
  if (!validated.success) {
    return { success: false as const };
  }

  return {
    success: true as const,
    summary: validated.data.summary,
  };
}

function parseStudentBulletsResponse(rawText: string) {
  const parsed = safeParseJson(rawText);
  if (!parsed.success) {
    return { success: false as const };
  }

  const validated = validateStudentBulletsResponse(parsed.data);
  if (!validated.success) {
    return { success: false as const };
  }

  return {
    success: true as const,
    bullets: validated.data.bullets,
  };
}

async function generateFresherSummary(
  language: 'vi' | 'en',
  payload: z.infer<typeof fresherSummaryRequestSchema>
) {
  const primaryRaw = await generateText(buildFresherSummaryPrompt(language, payload));
  const primaryParsed = parseFresherSummaryResponse(primaryRaw);
  if (primaryParsed.success) {
    return primaryParsed.summary;
  }

  logStudentAiDebug('fresherSummary', 'primary', primaryRaw);

  const retryRaw = await generateText(buildFresherSummaryRetryPrompt(language, payload));
  const retryParsed = parseFresherSummaryResponse(retryRaw);
  if (retryParsed.success) {
    return retryParsed.summary;
  }

  logStudentAiDebug('fresherSummary', 'retry', retryRaw);
  throw new StudentAiInvalidFormatError(
    'FRESHER_SUMMARY_INVALID_FORMAT',
    'AI tráº£ vá» Ä‘á»‹nh dáº¡ng fresher summary khÃ´ng há»£p lá»‡. Vui lÃ²ng thá»­ láº¡i.'
  );
}

async function generateProjectBullets(
  language: 'vi' | 'en',
  payload: z.infer<typeof generateProjectBulletsRequestSchema>
) {
  const primaryRaw = await generateText(buildProjectBulletsPrompt(language, payload));
  const primaryParsed = parseStudentBulletsResponse(primaryRaw);
  if (primaryParsed.success) {
    return primaryParsed.bullets;
  }

  logStudentAiDebug('generateProjectBullets', 'primary', primaryRaw);

  const retryRaw = await generateText(buildProjectBulletsRetryPrompt(language, payload));
  const retryParsed = parseStudentBulletsResponse(retryRaw);
  if (retryParsed.success) {
    return retryParsed.bullets;
  }

  logStudentAiDebug('generateProjectBullets', 'retry', retryRaw);
  throw new StudentAiInvalidFormatError(
    'PROJECT_BULLETS_INVALID_FORMAT',
    'AI tráº£ vá» Ä‘á»‹nh dáº¡ng project bullets khÃ´ng há»£p lá»‡. Vui lÃ²ng thá»­ láº¡i.'
  );
}

async function generateActivityBullets(
  language: 'vi' | 'en',
  payload: z.infer<typeof convertActivitiesToCvBulletsRequestSchema>
) {
  const primaryRaw = await generateText(buildActivityBulletsPrompt(language, payload));
  const primaryParsed = parseStudentBulletsResponse(primaryRaw);
  if (primaryParsed.success) {
    return primaryParsed.bullets;
  }

  logStudentAiDebug('convertActivitiesToCvBullets', 'primary', primaryRaw);

  const retryRaw = await generateText(buildActivityBulletsRetryPrompt(language, payload));
  const retryParsed = parseStudentBulletsResponse(retryRaw);
  if (retryParsed.success) {
    return retryParsed.bullets;
  }

  logStudentAiDebug('convertActivitiesToCvBullets', 'retry', retryRaw);
  throw new StudentAiInvalidFormatError(
    'ACTIVITY_BULLETS_INVALID_FORMAT',
    'AI tráº£ vá» Ä‘á»‹nh dáº¡ng activity bullets khÃ´ng há»£p lá»‡. Vui lÃ²ng thá»­ láº¡i.'
  );
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userRef = adminDb.collection('users').doc(decodedToken.uid);
    let userSnap = await userRef.get();

    if (!userSnap.exists) {
      try {
        await ensureUserDocumentWithAdmin(adminDb, decodedToken.uid, {
          email: decodedToken.email,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
        });
        userSnap = await userRef.get();
      } catch {
        return NextResponse.json(
          {
            error: 'USER_DOC_MISSING',
            message: 'Thiáº¿u há»“ sÆ¡ ngÆ°á»i dÃ¹ng trong Firestore.',
          },
          { status: 500 }
        );
      }
    }

    if (!userSnap.exists) {
      return NextResponse.json(
        {
          error: 'USER_DOC_MISSING',
          message: 'Thiáº¿u há»“ sÆ¡ ngÆ°á»i dÃ¹ng trong Firestore.',
        },
        { status: 500 }
      );
    }

    const user = userSnap.data() as import('@/lib/types').User;
    if (user.isActive === false) {
      return NextResponse.json({ error: 'User is inactive' }, { status: 403 });
    }

    const { isPremium, hasEnoughCredits, FEATURE_COSTS } = await import('@/lib/billing');
    const { spendCredits } = await import('@/lib/billingAdmin');

    const body = requestSchema.parse(await request.json());

    if (body.action === 'rewriteExperience' && !body.experience.description.trim()) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'MÃ´ táº£ kinh nghiá»‡m khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng khi dÃ¹ng AI rewrite.' },
        { status: 400 }
      );
    }

    if (body.action === 'atsReview') {
      if (!body.cv.targetJob.trim() || !body.cv.targetCompany.trim() || !body.cv.jobDescription.trim()) {
        return NextResponse.json(
          { error: 'INVALID_INPUT', message: 'Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ vá»‹ trÃ­ á»©ng tuyá»ƒn, tÃªn cÃ´ng ty vÃ  job description Ä‘á»ƒ phÃ¢n tÃ­ch CV.' },
          { status: 400 }
        );
      }
    }

    if (body.action === 'generateCoverLetter') {
      if (!body.cv.targetJob.trim() || !body.cv.targetCompany.trim() || !body.cv.jobDescription.trim()) {
        return NextResponse.json(
          { error: 'INVALID_INPUT', message: 'Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ vá»‹ trÃ­ á»©ng tuyá»ƒn, tÃªn cÃ´ng ty vÃ  job description Ä‘á»ƒ táº¡o cover letter.' },
          { status: 400 }
        );
      }
    }
    
    const premiumActive = isPremium(user);
    const plan = premiumActive ? 'premium' : 'free';

    const usageKey = new Date().toISOString().slice(0, 10);
    const usageRef = userRef.collection('aiUsage').doc(usageKey);
    const usageSnap = await usageRef.get();
    const usage = (usageSnap.data() || {}) as { totalRequests?: number };
    const usedToday = usage.totalRequests || 0;

    let requiresCredit = false;
    let creditCost = 0;

    if (!premiumActive) {
      if (canUseAiAction('free', body.action)) {
        if (usedToday >= FREE_AI_DAILY_LIMIT) {
          requiresCredit = true;
          creditCost = FEATURE_COSTS.aiSummary; 
        }
      } else {
        requiresCredit = true;
        if (body.action === 'rewriteExperience' || body.action === 'generateProjectBullets' || body.action === 'convertActivitiesToCvBullets') {
          creditCost = FEATURE_COSTS.aiRewrite;
        } else if (body.action === 'atsReview' || body.action === 'tailorCvForJob') {
          creditCost = FEATURE_COSTS.atsReview;
        } else if (body.action === 'generateCoverLetter') {
          creditCost = FEATURE_COSTS.coverLetter;
        } else {
          creditCost = 2;
        }
      }
    }

    if (requiresCredit) {
      if (!hasEnoughCredits(user, creditCost)) {
        return NextResponse.json(
          {
            error: 'INSUFFICIENT_ACCESS',
            upgradeRequired: true,
            remainingToday: 0,
            message: 'Báº¡n cáº§n nÃ¢ng cáº¥p Premium hoáº·c náº¡p thÃªm credit Ä‘á»ƒ sá»­ dá»¥ng tÃ­nh nÄƒng nÃ y.',
          },
          { status: 402 }
        );
      }
      
      try {
        await spendCredits(decodedToken.uid, creditCost, `Sá»­ dá»¥ng tÃ­nh nÄƒng AI: ${body.action}`);
      } catch {
        return NextResponse.json(
          {
            error: 'Transaction failed',
            message: 'KhÃ´ng thá»ƒ trá»« credit. Vui lÃ²ng thá»­ láº¡i.',
          },
          { status: 500 }
        );
      }
    }

    let responsePayload: Record<string, unknown>;

    if (body.action === 'generateSummary') {
      responsePayload = {
        text: await generateText(buildSummaryPrompt(body.language, plan, body)),
      };
    } else if (body.action === 'fresherSummary') {
      responsePayload = {
        summary: await generateFresherSummary(body.language, body),
      };
    } else if (body.action === 'rewriteExperience') {
      const rewrittenText = await generateText(buildExperiencePrompt(body.language, body));
      const bullets = extractBulletLines(rewrittenText);
      responsePayload = {
        text: bullets.join('\n'),
        bullets,
      };
    } else if (body.action === 'atsReview') {
      responsePayload = {
        review: await generateAtsReview(body.language, body),
      };
    } else if (body.action === 'generateProjectBullets') {
      responsePayload = {
        bullets: await generateProjectBullets(body.language, body),
      };
    } else if (body.action === 'convertActivitiesToCvBullets') {
      responsePayload = {
        bullets: await generateActivityBullets(body.language, body),
      };
    } else if (body.action === 'tailorCvForJob') {
      responsePayload = {
        tailor: await generateTailorCvForJob(body.language, body),
      };
    } else {
      responsePayload = {
        text: await generateText(buildCoverLetterPrompt(body.language, body)),
      };
    }

    await saveAiHistoryRecord({
      adminDb,
      userId: decodedToken.uid,
      action: body.action,
      cvId: 'cvId' in body ? body.cvId : '',
      input: body as unknown as Record<string, unknown>,
      output: responsePayload,
    });

    await usageRef.set(
      {
        totalRequests: FieldValue.increment(1),
        [body.action]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const nextUsedToday = usedToday + 1;
    return NextResponse.json({
      ...responsePayload,
      plan,
      creditsSpent: requiresCredit ? creditCost : 0,
      remainingToday: plan === 'free' ? Math.max(FREE_AI_DAILY_LIMIT - nextUsedToday, 0) : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', issues: error.flatten() }, { status: 400 });
    }

    if (error instanceof EnvValidationError) {
      return NextResponse.json(error.toApiError(), { status: error.status });
    }

    if (error instanceof AtsInvalidFormatError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: 502 }
      );
    }

    if (error instanceof TailorCvInvalidFormatError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: 502 }
      );
    }

    if (error instanceof StudentAiInvalidFormatError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: 502 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown AI error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


