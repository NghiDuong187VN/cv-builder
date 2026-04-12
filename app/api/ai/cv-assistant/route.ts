import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

import { canUseAiAction, FREE_AI_DAILY_LIMIT } from '@/lib/ai';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

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
});

const requestSchema = z.discriminatedUnion('action', [
  summaryRequestSchema,
  rewriteExperienceRequestSchema,
  atsReviewRequestSchema,
  coverLetterRequestSchema,
]);

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

function sanitizeText(value: string | undefined) {
  return (value || '').replace(/\r/g, '').trim();
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
      ? 'Bạn là chuyên gia viết CV. Chỉ trả về đúng đoạn tóm tắt cuối cùng, không thêm tiêu đề, không markdown, không giải thích.'
      : 'You are a resume writing expert. Return only the final summary paragraph with no heading, markdown, or explanation.';

  const goal =
    language === 'vi'
      ? plan === 'free'
        ? 'Viết đoạn summary CV 3-4 câu, rõ ràng, trung tính, dễ dùng ngay.'
        : 'Viết đoạn summary CV 4-5 câu, thuyết phục, nhấn mạnh giá trị ứng tuyển và tối ưu ngôn ngữ tuyển dụng.'
      : plan === 'free'
        ? 'Write a 3-4 sentence resume summary that is clear, concise, and broadly usable.'
        : 'Write a 4-5 sentence resume summary that is persuasive, tailored for hiring, and uses strong recruiting language.';

  const constraints =
    language === 'vi'
      ? [
          'Tối đa 90 từ.',
          'Ưu tiên thành tích, số liệu, kỹ năng cốt lõi.',
          'Nếu thiếu dữ liệu thì không bịa.',
          'Không dùng emoji.',
          plan === 'premium' ? 'Nếu có target job/company thì tinh chỉnh theo mục tiêu đó.' : 'Giữ summary đủ tổng quát để dùng miễn phí.',
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
    language === 'vi' ? 'Dữ liệu ứng viên:' : 'Candidate data:',
    `- Full name: ${cv.personalInfo.fullName || 'N/A'}`,
    `- Current job title: ${cv.personalInfo.jobTitle || 'N/A'}`,
    `- CV title: ${cv.title || 'N/A'}`,
    `- Target job: ${cv.targetJob || 'N/A'}`,
    `- Target company: ${cv.targetCompany || 'N/A'}`,
    `- Top skills: ${topSkills || 'N/A'}`,
    education ? `- Education:\n${education}` : '- Education: N/A',
    recentExperience ? `- Experience:\n${recentExperience}` : '- Experience: N/A',
    '',
    language === 'vi' ? 'Ràng buộc:' : 'Constraints:',
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
      ? 'Bạn là chuyên gia tối ưu phần kinh nghiệm trong CV. Chỉ trả về nội dung mô tả cuối cùng. Không thêm tiêu đề, markdown ngoài bullet, hoặc giải thích.'
      : 'You are a resume experience optimizer. Return only the final rewritten experience content. No heading or explanation.';

  const constraints =
    language === 'vi'
      ? [
          'Viết 3-5 bullet ngắn.',
          'Mỗi bullet bắt đầu bằng động từ mạnh.',
          'Ưu tiên thành tích đo được, công nghệ, phạm vi công việc.',
          'Không bịa số liệu nếu input không có.',
          'Giữ văn phong phù hợp CV chuyên nghiệp.',
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
      ? 'Viết lại đoạn mô tả kinh nghiệm dưới đây để mạnh hơn cho CV.'
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
    language === 'vi' ? 'Ràng buộc:' : 'Constraints:',
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
      ? 'Bạn là chuyên gia ATS reviewer cho CV. Hãy trả về JSON hợp lệ duy nhất, không markdown, không giải thích.'
      : 'You are an ATS reviewer for resumes. Return valid JSON only, with no markdown or explanation.',
    '',
    language === 'vi'
      ? 'Đánh giá CV so với vị trí ứng tuyển và mô tả công việc.'
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
      ? 'Trả về đúng JSON theo schema: {"score":number,"strengths":string[],"gaps":string[],"keywordsMissing":string[],"recommendations":string[]}. Score từ 0 đến 100.'
      : 'Return JSON with this exact schema: {"score":number,"strengths":string[],"gaps":string[],"keywordsMissing":string[],"recommendations":string[]}. Score must be between 0 and 100.',
  ].join('\n');
}

function buildCoverLetterPrompt(
  language: 'vi' | 'en',
  payload: z.infer<typeof coverLetterRequestSchema>
) {
  const { cv, recipientName } = payload;
  const topExperience = cv.experience
    .slice(0, 3)
    .map((item, index) => `${index + 1}. ${item.role} at ${item.company}: ${item.description}`)
    .join('\n');
  const topSkills = cv.skills.map((skill) => skill.name).slice(0, 10).join(', ');

  return [
    language === 'vi'
      ? 'Bạn là chuyên gia viết cover letter. Chỉ trả về nội dung thư hoàn chỉnh, không giải thích, không markdown.'
      : 'You are a cover letter expert. Return only the completed cover letter with no markdown or explanation.',
    '',
    language === 'vi'
      ? 'Viết cover letter ngắn gọn, chuyên nghiệp, thuyết phục.'
      : 'Write a concise, professional, persuasive cover letter.',
    '',
    `- Candidate name: ${cv.personalInfo.fullName || 'N/A'}`,
    `- Current title: ${cv.personalInfo.jobTitle || 'N/A'}`,
    `- Recipient name: ${recipientName || 'Hiring Manager'}`,
    `- Target job: ${cv.targetJob || 'N/A'}`,
    `- Target company: ${cv.targetCompany || 'N/A'}`,
    `- Summary: ${cv.summary || 'N/A'}`,
    `- Top skills: ${topSkills || 'N/A'}`,
    `- Job description:\n${cv.jobDescription || 'N/A'}`,
    `- Experience highlights:\n${topExperience || 'N/A'}`,
    '',
    language === 'vi'
      ? 'Độ dài khoảng 220-320 từ. Cá nhân hóa theo công việc mục tiêu nếu có dữ liệu. Không bịa thông tin.'
      : 'Length around 220-320 words. Personalize to the target role when data exists. Do not invent facts.',
  ].join('\n');
}

async function generateText(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key is missing.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  return sanitizeText(response.text);
}

function parseJsonResponse<T>(rawText: string): T {
  const cleaned = rawText
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();

  return JSON.parse(cleaned) as T;
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
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userSnap.data() as { plan?: 'free' | 'premium'; isActive?: boolean };
    if (user.isActive === false) {
      return NextResponse.json({ error: 'User is inactive' }, { status: 403 });
    }

    const body = requestSchema.parse(await request.json());
    const plan = user.plan === 'premium' ? 'premium' : 'free';

    if (!canUseAiAction(plan, body.action)) {
      return NextResponse.json(
        {
          error: 'Feature locked',
          upgradeRequired: true,
          message: 'Tính năng AI này chỉ dành cho tài khoản Premium.',
        },
        { status: 403 }
      );
    }

    const usageKey = new Date().toISOString().slice(0, 10);
    const usageRef = userRef.collection('aiUsage').doc(usageKey);
    const usageSnap = await usageRef.get();
    const usage = (usageSnap.data() || {}) as { totalRequests?: number };
    const usedToday = usage.totalRequests || 0;

    if (plan === 'free' && usedToday >= FREE_AI_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: 'Free limit reached',
          upgradeRequired: true,
          remainingToday: 0,
          message: 'Bạn đã dùng hết 3 lượt AI miễn phí hôm nay. Nâng cấp Premium để dùng tiếp.',
        },
        { status: 429 }
      );
    }

    let responsePayload: Record<string, unknown>;

    if (body.action === 'generateSummary') {
      responsePayload = {
        text: await generateText(buildSummaryPrompt(body.language, plan, body)),
      };
    } else if (body.action === 'rewriteExperience') {
      responsePayload = {
        text: await generateText(buildExperiencePrompt(body.language, body)),
      };
    } else if (body.action === 'atsReview') {
      const raw = await generateText(buildAtsReviewPrompt(body.language, body));
      try {
        responsePayload = {
          review: parseJsonResponse<{
            score: number;
            strengths: string[];
            gaps: string[];
            keywordsMissing: string[];
            recommendations: string[];
          }>(raw),
        };
      } catch {
        throw new Error('AI returned an invalid ATS review format.');
      }
    } else {
      responsePayload = {
        text: await generateText(buildCoverLetterPrompt(body.language, body)),
      };
    }

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
      remainingToday: plan === 'free' ? Math.max(FREE_AI_DAILY_LIMIT - nextUsedToday, 0) : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', issues: error.flatten() }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : 'Unknown AI error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
