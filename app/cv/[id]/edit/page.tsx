'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Eye, EyeOff, Globe, ChevronDown,
  ChevronRight, Loader, Palette, ListOrdered,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createCoverLetter, createCvAiHistory, getCV, getCvAiHistory, updateCV, updateCvAiHistory } from '@/lib/firestore';
import { Activity, CV, CVSection, CVTheme, CvAiHistoryAction, CvAiHistoryRecord, Experience, PersonalInfo, Project } from '@/lib/types';
import type { TailorCvForJobResponse } from '@/lib/tailorCv';
import toast from 'react-hot-toast';
import {
  AiAction,
  FREE_AI_DAILY_LIMIT,
  getAllowedAiActions,
  getUpgradeRequiredActions,
} from '@/lib/ai';

// Editor sub-components
import PersonalInfoForm from '@/components/cv/editor/PersonalInfoForm';
import ExperienceForm from '@/components/cv/editor/ExperienceForm';
import EducationForm from '@/components/cv/editor/EducationForm';
import ProjectsForm from '@/components/cv/editor/ProjectsForm';
import SkillsForm from '@/components/cv/editor/SkillsForm';
import SectionsPanel from '@/components/cv/editor/SectionsPanel';
import ThemePanel from '@/components/cv/editor/ThemePanel';
import MobileEditorWarning from '@/components/cv/editor/MobileEditorWarning';
import QuotaUsageCard from '@/components/cv/editor/QuotaUsageCard';
import TemplateRenderer from '@/components/cv/TemplateRenderer';
import ExportButton from '@/components/cv/ExportButton';
import { FREE_CV_LIMIT, type QuotaStatusResponse } from '@/lib/quota';

type TabType = 'content' | 'sections' | 'theme';

type AiPromptState = {
  title: string;
  message: string;
  ctaLabel: string;
  ctaHref: string;
};

type PendingRewriteState = {
  index: number;
  historyId?: string;
  role: string;
  company: string;
  oldDescription: string;
  newDescription: string;
};

type PendingTailorCvState = TailorCvForJobResponse & {
  historyId?: string;
  applySummary: boolean;
  applyExperienceBullets: boolean;
};

type StudentAiAction = 'fresherSummary' | 'generateProjectBullets' | 'convertActivitiesToCvBullets';

type StudentAiFormState = {
  targetJob: string;
  fieldOfStudy: string;
  itemName: string;
  role: string;
  technologies: string;
  achievements: string;
};

type PendingStudentAiState = {
  action: StudentAiAction;
  historyId?: string;
  oldText: string;
  newText: string;
  targetJob: string;
  fieldOfStudy: string;
  itemName: string;
  role: string;
  technologies: string[];
  achievements: string;
};

type AiHistoryFilter = 'all' | CvAiHistoryAction;

const getAiActionLabel = (action: AiAction | CvAiHistoryAction) => {
  if (action === 'tailorCvForJob') {
    return 'Tailor CV to Job';
  }
  if (action === 'fresherSummary') {
    return 'Fresher Summary';
  }
  if (action === 'generateProjectBullets') {
    return 'Project Bullets';
  }
  if (action === 'convertActivitiesToCvBullets') {
    return 'Activities to CV Bullets';
  }

  return action === 'generateSummary'
    ? 'Summary AI'
    : action === 'rewriteExperience'
      ? 'Rewrite kinh nghiá»‡m'
      : action === 'atsReview'
        ? 'ATS review'
        : 'Cover letter';
};

const AI_HISTORY_FILTERS: { key: AiHistoryFilter; label: string }[] = [
  { key: 'all', label: 'Táº¥t cáº£' },
  { key: 'generateSummary', label: getAiActionLabel('generateSummary') },
  { key: 'fresherSummary', label: getAiActionLabel('fresherSummary') },
  { key: 'rewriteExperience', label: getAiActionLabel('rewriteExperience') },
  { key: 'atsReview', label: getAiActionLabel('atsReview') },
  { key: 'generateCoverLetter', label: getAiActionLabel('generateCoverLetter') },
  { key: 'generateProjectBullets', label: getAiActionLabel('generateProjectBullets') },
  { key: 'convertActivitiesToCvBullets', label: getAiActionLabel('convertActivitiesToCvBullets') },
  { key: 'tailorCvForJob', label: getAiActionLabel('tailorCvForJob') },
];

const AI_ACTION_LABELS: Partial<Record<AiAction, string>> = {
  generateSummary: 'Summary AI',
  rewriteExperience: 'Rewrite kinh nghiệm',
  atsReview: 'ATS review',
  generateCoverLetter: 'Cover letter',
  generateProjectBullets: 'Project Bullets',
  convertActivitiesToCvBullets: 'Activities to CV Bullets',
};

const AI_HISTORY_ACTION_LABELS: Partial<Record<CvAiHistoryAction, string>> = {
  generateSummary: 'Summary AI',
  fresherSummary: 'Fresher Summary',
  rewriteExperience: 'Rewrite kinh nghiệm',
  atsReview: 'ATS review',
  generateCoverLetter: 'Cover letter',
  generateProjectBullets: 'Project Bullets',
  convertActivitiesToCvBullets: 'Activities to CV Bullets',
};

const SECTION_LABELS_VI: Partial<Record<CVSection, string>> = {
  personalInfo: '👤 Thông tin cá nhân',
  summary: '📝 Giới thiệu bản thân',
  experience: '💼 Kinh nghiệm',
  education: '🎓 Học vấn',
  skills: '⚡ Kỹ năng',
  projects: '🚀 Dự án',
  certificates: '📜 Chứng chỉ',
  activities: '🏆 Hoạt động',
  interests: '❤️ Sở thích',
  languages: '🌏 Ngoại ngữ',
};

// ─── Accordion Section ────────────────────────────────────────
function AccordionSection({ title, isOpen, onToggle, children }: {
  title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-card)' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: isOpen ? 'rgba(99,102,241,0.05)' : 'transparent',
          border: 'none', cursor: 'pointer', borderBottom: isOpen ? '1px solid var(--border)' : 'none',
          transition: 'background 0.15s',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', textAlign: 'left' }}>{title}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color="var(--text-muted)" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────
export default function CVEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { firebaseUser, user, loading } = useAuth();
  const [cv, setCv] = useState<CV | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<TabType>('content');
  const [openSection, setOpenSection] = useState<CVSection>('personalInfo');
  const [previewMode, setPreviewMode] = useState(false);
  const [aiStatus, setAiStatus] = useState<QuotaStatusResponse | null>(null);
  const [aiStatusLoading, setAiStatusLoading] = useState(true);
  const [freeAiRemaining, setFreeAiRemaining] = useState<number | null>(FREE_AI_DAILY_LIMIT);
  const [aiHistory, setAiHistory] = useState<CvAiHistoryRecord[]>([]);
  const [aiHistoryLoading, setAiHistoryLoading] = useState(true);
  const [aiHistoryFilter, setAiHistoryFilter] = useState<AiHistoryFilter>('all');
  const [isAiHistoryOpen, setIsAiHistoryOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<AiPromptState | null>(null);
  const [pendingRewrite, setPendingRewrite] = useState<PendingRewriteState | null>(null);
  const [pendingTailorCv, setPendingTailorCv] = useState<PendingTailorCvState | null>(null);
  const [pendingStudentAi, setPendingStudentAi] = useState<PendingStudentAiState | null>(null);
  const [summaryAiLoading, setSummaryAiLoading] = useState(false);
  const [experienceAiLoadingIndex, setExperienceAiLoadingIndex] = useState<number | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterSaving, setCoverLetterSaving] = useState(false);
  const [tailorCvLoading, setTailorCvLoading] = useState(false);
  const [studentAiLoadingAction, setStudentAiLoadingAction] = useState<StudentAiAction | null>(null);
  const [studentAiForm, setStudentAiForm] = useState<StudentAiFormState>({
    targetJob: '',
    fieldOfStudy: '',
    itemName: '',
    role: '',
    technologies: '',
    achievements: '',
  });
  const [recipientName, setRecipientName] = useState('');
  const [coverLetterDraft, setCoverLetterDraft] = useState('');
  const [atsReview, setAtsReview] = useState<{
    score: number;
    strengths: string[];
    gaps: string[];
    keywordsMissing: string[];
    recommendations: string[];
  } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Resizable panel ──────────────────────────────────────────
  const [panelWidth, setPanelWidth] = useState(400);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, width: 400 });

  const onDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, width: panelWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStart.current.x;
      const next = Math.min(680, Math.max(280, dragStart.current.width + delta));
      setPanelWidth(next);
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  useEffect(() => {
    if (!loading && !firebaseUser) router.push('/auth');
  }, [loading, firebaseUser, router]);

  useEffect(() => {
    if (firebaseUser && id) {
      getCV(id).then(data => {
        if (!data || data.uid !== firebaseUser.uid) { router.push('/cv'); return; }
        // Ensure personalInfo exists
        if (!data.content.personalInfo) {
          data.content.personalInfo = { fullName: '', jobTitle: '', email: firebaseUser.email || '', phone: '', address: '' };
        }
        setCv(data);
        setDataLoading(false);
      });
    }
  }, [firebaseUser, id, router]);

  /*
  useEffect(() => {
    if (typeof aiStatus?.remainingToday === 'number') {
      setFreeAiRemaining(aiStatus.remainingToday);
    }

    setAiStatusLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/quota/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Không thể tải trạng thái AI.');
      }

      const nextStatus = result as QuotaStatusResponse;
      setAiStatus(nextStatus);
      setFreeAiRemaining(nextStatus.remainingToday);
    } catch (error) {
      console.error('Failed to load AI status:', error);
      setAiStatus(null);
    } finally {
      setAiStatusLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void loadAiStatus();
  }, [loadAiStatus]);

  */

  const loadAiStatus = useCallback(async () => {
    if (!firebaseUser) {
      setAiStatus(null);
      setAiStatusLoading(false);
      return;
    }

    setAiStatusLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/quota/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Không thể tải trạng thái quota.');
      }

      const nextStatus = result as QuotaStatusResponse;
      setAiStatus(nextStatus);
      setFreeAiRemaining(nextStatus.remainingToday);
    } catch (error) {
      console.error('Failed to load AI status:', error);
      setAiStatus(null);
    } finally {
      setAiStatusLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void loadAiStatus();
  }, [loadAiStatus]);

  const loadAiHistory = useCallback(async () => {
    if (!cv?.cvId) {
      setAiHistory([]);
      setAiHistoryLoading(false);
      return;
    }

    setAiHistoryLoading(true);
    try {
      const records = await getCvAiHistory(cv.cvId);
      setAiHistory(records);
    } catch (error) {
      console.error('Failed to load AI history:', error);
      setAiHistory([]);
    } finally {
      setAiHistoryLoading(false);
    }
  }, [cv?.cvId]);

  useEffect(() => {
    void loadAiHistory();
  }, [loadAiHistory]);

  useEffect(() => {
    if (!cv) return;

    setStudentAiForm((current) => ({
      targetJob: current.targetJob || cv.targetJob || '',
      fieldOfStudy: current.fieldOfStudy || cv.content.education?.[0]?.field || '',
      itemName: current.itemName,
      role: current.role,
      technologies: current.technologies,
      achievements: current.achievements,
    }));
  }, [cv]);

  const aiPlan = aiStatus?.plan ?? (user?.plan === 'premium' ? 'premium' : 'free');
  const allowedActions = new Set<AiAction>(aiStatus?.allowedActions ?? getAllowedAiActions(aiPlan));
  const upgradeRequiredActions = aiStatus?.upgradeRequiredActions ?? getUpgradeRequiredActions(aiPlan);
  const remainingToday = aiPlan === 'free' ? (freeAiRemaining ?? FREE_AI_DAILY_LIMIT) : null;
  const aiLimit = aiStatus?.aiLimit ?? (aiPlan === 'free' ? FREE_AI_DAILY_LIMIT : null);
  const aiUsedToday = aiLimit === null ? 0 : Math.max(aiLimit - (remainingToday ?? 0), 0);
  const cvLimit = aiStatus?.cvLimit ?? (aiPlan === 'free' ? FREE_CV_LIMIT : null);
  const cvCount = aiStatus?.cvCount ?? 0;
  const canGenerateSummary = !aiStatusLoading && allowedActions.has('generateSummary') && (aiPlan === 'premium' || (remainingToday ?? 0) > 0);
  const canGenerateFresherSummary = !aiStatusLoading && allowedActions.has('fresherSummary') && (aiPlan === 'premium' || (remainingToday ?? 0) > 0);
  const canRewriteExperience = !aiStatusLoading && allowedActions.has('rewriteExperience');
  const canRunAtsReview = !aiStatusLoading && allowedActions.has('atsReview');
  const canGenerateCoverLetter = !aiStatusLoading && allowedActions.has('generateCoverLetter');
  const canGenerateProjectBullets = !aiStatusLoading && allowedActions.has('generateProjectBullets');
  const canConvertActivitiesToCvBullets = !aiStatusLoading && allowedActions.has('convertActivitiesToCvBullets');
  const canTailorCvForJob = !aiStatusLoading && allowedActions.has('tailorCvForJob');

  // Auto-save
  const autoSave = useCallback(async (cvData: CV) => {
    if (!cvData.cvId) return;
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await updateCV(cvData.cvId, cvData as Partial<CV>);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch { /* silent */ }
    }, 1500);
  }, []);

  const updateCvState = useCallback((updater: (prev: CV) => CV) => {
    setCv(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      autoSave(next);
      return next;
    });
  }, [autoSave]);

  const updatePersonalInfo = (data: PersonalInfo) => updateCvState(prev => ({ ...prev, content: { ...prev.content, personalInfo: data } }));
  const updateSummary = useCallback((val: string) => {
    updateCvState(prev => ({ ...prev, content: { ...prev.content, summary: val } }));
  }, [updateCvState]);
  const updateSection = useCallback(<K extends keyof CV['content']>(key: K, val: CV['content'][K]) => {
    updateCvState(prev => ({ ...prev, content: { ...prev.content, [key]: val } }));
  }, [updateCvState]);
  const applyRewriteToExperience = useCallback((index: number, nextDescription: string) => {
    updateCvState((prev) => {
      const nextExperience = [...(prev.content.experience || [])];
      const selected = nextExperience[index];

      if (!selected) {
        return prev;
      }

      nextExperience[index] = {
        ...selected,
        description: nextDescription,
      } satisfies Experience;

      return {
        ...prev,
        content: {
          ...prev.content,
          experience: nextExperience,
        },
      };
    });
  }, [updateCvState]);
  const normalizeStudentTechnologies = useCallback((value: string) => (
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  ), []);
  const applyProjectBullets = useCallback((payload: PendingStudentAiState) => {
    updateCvState((prev) => {
      const nextProjects = [...(prev.content.projects || [])];
      const projectIndex = nextProjects.findIndex((item) => item.name.trim().toLowerCase() === payload.itemName.trim().toLowerCase());
      const nextProject: Project = projectIndex >= 0
        ? {
            ...nextProjects[projectIndex],
            name: payload.itemName,
            role: payload.role || nextProjects[projectIndex].role || '',
            technologies: payload.technologies.length ? payload.technologies : nextProjects[projectIndex].technologies,
            description: payload.newText,
          }
        : {
            id: Date.now().toString(),
            name: payload.itemName,
            role: payload.role,
            url: '',
            github: '',
            description: payload.newText,
            technologies: payload.technologies,
            from: '',
            to: '',
          };

      if (projectIndex >= 0) {
        nextProjects[projectIndex] = nextProject;
      } else {
        nextProjects.push(nextProject);
      }

      return {
        ...prev,
        content: {
          ...prev.content,
          projects: nextProjects,
        },
      };
    });
  }, [updateCvState]);
  const applyActivityBullets = useCallback((payload: PendingStudentAiState) => {
    updateCvState((prev) => {
      const nextActivities = [...(prev.content.activities || [])];
      const activityIndex = nextActivities.findIndex((item) => item.name.trim().toLowerCase() === payload.itemName.trim().toLowerCase());
      const nextActivity: Activity = activityIndex >= 0
        ? {
            ...nextActivities[activityIndex],
            name: payload.itemName,
            role: payload.role || nextActivities[activityIndex].role || '',
            description: payload.newText,
          }
        : {
            id: Date.now().toString(),
            name: payload.itemName,
            role: payload.role,
            description: payload.newText,
            from: '',
            to: '',
          };

      if (activityIndex >= 0) {
        nextActivities[activityIndex] = nextActivity;
      } else {
        nextActivities.push(nextActivity);
      }

      return {
        ...prev,
        content: {
          ...prev.content,
          activities: nextActivities,
        },
      };
    });
  }, [updateCvState]);
  const applyTailoredExperienceBullets = useCallback((items: TailorCvForJobResponse['improvedExperienceBullets']) => {
    updateCvState((prev) => {
      const nextExperience = [...(prev.content.experience || [])];

      items.forEach((item) => {
        const selected = nextExperience[item.experienceIndex];
        if (!selected) {
          return;
        }

        nextExperience[item.experienceIndex] = {
          ...selected,
          description: item.bullets.join('\n'),
        } satisfies Experience;
      });

      return {
        ...prev,
        content: {
          ...prev.content,
          experience: nextExperience,
        },
      };
    });
  }, [updateCvState]);
  const updateTheme = (t: Partial<CVTheme>) => updateCvState(prev => ({ ...prev, theme: { ...prev.theme, ...t } }));
  const changeTemplate = (templateId: string) => updateCvState(prev => ({ ...prev, templateId }));
  const updateMeta = useCallback(<K extends keyof CV>(key: K, value: CV[K]) => {
    updateCvState(prev => ({ ...prev, [key]: value }));
  }, [updateCvState]);
  const updateSectionOrder = (order: CVSection[]) => updateCvState(prev => ({ ...prev, sections: { ...prev.sections, order } }));
  const toggleSectionVisibility = (section: CVSection) => updateCvState(prev => ({
    ...prev,
    sections: {
      ...prev.sections,
      visibility: { ...prev.sections.visibility, [section]: prev.sections.visibility[section] === false ? true : false },
    },
  }));

  const handleManualSave = async () => {
    if (!cv) return;
    setSaving(true);
    try {
      await updateCV(cv.cvId, cv as Partial<CV>);
      toast.success('Đã lưu CV!');
      setSaved(true);
    } catch { toast.error('Lưu thất bại'); }
    setSaving(false);
  };

  const toggleLanguage = () => {
    updateCvState(prev => ({ ...prev, language: prev.language === 'vi' ? 'en' : 'vi' }));
  };

  const openUpgradePrompt = useCallback((message?: string) => {
    setAiPrompt({
      title: 'Mở khóa AI Premium',
      message: message || 'Tính năng AI này chỉ có trong gói Premium. Nâng cấp để dùng rewrite kinh nghiệm, ATS review và cover letter.',
      ctaLabel: 'Xem gói Premium',
      ctaHref: '/pricing',
    });
  }, []);

  const openQuotaPrompt = useCallback((message?: string) => {
    setAiPrompt({
      title: 'Đã hết lượt AI miễn phí hôm nay',
      message: message || 'Bạn đã dùng hết quota AI của gói Free. Nâng cấp Premium để tiếp tục dùng ngay.',
      ctaLabel: 'Nâng cấp để dùng tiếp',
      ctaHref: '/pricing',
    });
  }, []);

  const isHandledAiError = useCallback((error: unknown) => {
    return error instanceof Error && Boolean((error as Error & { handled?: boolean }).handled);
  }, []);

  const handleAiRequestError = useCallback((error: unknown, fallbackMessage: string) => {
    if (isHandledAiError(error)) {
      return;
    }

    const message = error instanceof Error ? error.message : fallbackMessage;

    if (message.includes('miễn phí hôm nay') || message.includes('dùng hết 3 lượt AI')) {
      openQuotaPrompt(message);
      return;
    }

    if (message.includes('Premium')) {
      openUpgradePrompt(message);
      return;
    }

    toast.error(message);
  }, [isHandledAiError, openQuotaPrompt, openUpgradePrompt]);

  const callCvAi = useCallback(async (payload: Record<string, unknown>) => {
    if (!firebaseUser) {
      throw new Error('Bạn cần đăng nhập để dùng AI.');
    }

    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/ai/cv-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result?.error === 'USER_DOC_MISSING') {
        throw new Error(result.message || 'Thiếu hồ sơ người dùng trong Firestore. Vui lòng đăng nhập lại để hệ thống tự đồng bộ.');
      }

      if (result?.error === 'ATS_INVALID_FORMAT') {
        const error = new Error(result.message || 'AI trả về định dạng ATS không hợp lệ. Vui lòng thử lại.') as Error & { code?: string };
        error.code = 'ATS_INVALID_FORMAT';
        throw error;
      }

      if (result?.error === 'TAILOR_INVALID_FORMAT') {
        const error = new Error(result.message || 'AI tra ve dinh dang Tailor CV khong hop le. Vui long thu lai.') as Error & { code?: string };
        error.code = 'TAILOR_INVALID_FORMAT';
        throw error;
      }

      if (
        result?.error === 'FRESHER_SUMMARY_INVALID_FORMAT'
        || result?.error === 'PROJECT_BULLETS_INVALID_FORMAT'
        || result?.error === 'ACTIVITY_BULLETS_INVALID_FORMAT'
      ) {
        const error = new Error(result.message || 'AI trả về định dạng không hợp lệ. Vui lòng thử lại.') as Error & { code?: string };
        error.code = result.error;
        throw error;
      }

      if (response.status === 403 && result?.upgradeRequired) {
        openUpgradePrompt(result.message);
        const error = new Error(result.message || 'Tính năng AI này cần gói Premium.') as Error & { handled?: boolean };
        error.handled = true;
        throw error;
      }

      if (response.status === 429) {
        setAiStatus((current) => current ? { ...current, remainingToday: 0 } : current);
        setFreeAiRemaining(0);
        openQuotaPrompt(result.message);
        const error = new Error(result.message || 'Bạn đã dùng hết quota AI hôm nay.') as Error & { handled?: boolean };
        error.handled = true;
        throw error;
      }

      throw new Error(result.message || result.error || 'AI request failed');
    }

    if (typeof result.remainingToday === 'number') {
      setFreeAiRemaining(result.remainingToday);
      setAiStatus((current) => current
        ? {
            ...current,
            remainingToday: result.remainingToday,
            usedToday: current.aiLimit === null ? current.usedToday : Math.max(current.aiLimit - result.remainingToday, 0),
          }
        : current);
    }

    return result as {
      text?: string;
      summary?: string;
      bullets?: string[];
      review?: {
        score: number;
        strengths: string[];
        gaps: string[];
        keywordsMissing: string[];
        recommendations: string[];
      };
      tailor?: TailorCvForJobResponse;
      remainingToday: number | null;
    };
  }, [firebaseUser, openQuotaPrompt, openUpgradePrompt]);

  const createAiHistorySafely = useCallback(async (
    payload: Parameters<typeof createCvAiHistory>[1]
  ) => {
    if (!cv?.cvId) return null;

    try {
      const historyId = await createCvAiHistory(cv.cvId, payload);
      await loadAiHistory();
      return historyId;
    } catch (error) {
      console.error('Failed to create AI history:', error);
      return null;
    }
  }, [cv?.cvId, loadAiHistory]);

  const updateAiHistorySafely = useCallback(async (
    historyId: string,
    payload: Parameters<typeof updateCvAiHistory>[2]
  ) => {
    if (!cv?.cvId) return;

    try {
      await updateCvAiHistory(cv.cvId, historyId, payload);
      await loadAiHistory();
    } catch (error) {
      console.error('Failed to update AI history:', error);
    }
  }, [cv?.cvId, loadAiHistory]);

  const handleGenerateSummary = useCallback(async () => {
    if (!cv) return;
    if (!canGenerateSummary) {
      if (aiPlan === 'free' && (remainingToday ?? 0) <= 0) {
        openQuotaPrompt('Bạn đã dùng hết lượt AI miễn phí hôm nay. Nâng cấp Premium để tiếp tục dùng summary ngay.');
      } else if (upgradeRequiredActions.includes('generateSummary')) {
        openUpgradePrompt();
      }
      return;
    }

    setSummaryAiLoading(true);
    try {
      const result = await callCvAi({
        action: 'generateSummary',
        language: cv.language,
        cv: {
          title: cv.title,
          targetJob: cv.targetJob || '',
          targetCompany: cv.targetCompany || '',
          personalInfo: cv.content.personalInfo,
          experience: cv.content.experience || [],
          skills: cv.content.skills || [],
          education: cv.content.education || [],
        },
      });

      updateSummary(result.text || '');
      void createAiHistorySafely({
        action: 'generateSummary',
        accepted: true,
        oldText: cv.content.summary || '',
        newText: result.text || '',
        targetJob: cv.targetJob || '',
        targetCompany: cv.targetCompany || '',
        metadata: {
          language: cv.language,
        },
      });
      toast.success(user?.plan === 'premium' ? 'AI đã viết lại summary.' : 'Đã tạo summary bằng AI.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo summary bằng AI.');
    } finally {
      setSummaryAiLoading(false);
    }
  }, [aiPlan, callCvAi, canGenerateSummary, createAiHistorySafely, cv, openQuotaPrompt, openUpgradePrompt, remainingToday, updateSummary, upgradeRequiredActions, user?.plan]);

  const handleRewriteExperience = useCallback(async (index: number) => {
    if (!cv) return;

    if (!canRewriteExperience) {
      handleAiRequestError(new Error('AI rewrite kinh nghiệm hiện chỉ có trong gói Premium.'), 'Tính năng này cần gói Premium.');
      return;
    }

    const selected = cv.content.experience?.[index];
    if (!selected?.description?.trim()) {
      toast.error('Hãy nhập mô tả kinh nghiệm trước khi dùng AI.');
      return;
    }

    if (!cv.jobDescription?.trim()) {
      toast('Chưa có mô tả công việc. AI vẫn rewrite được, nhưng kết quả sẽ ít cá nhân hóa hơn.');
    }

    setExperienceAiLoadingIndex(index);
    try {
      const result = await callCvAi({
        action: 'rewriteExperience',
        language: cv.language,
        cv: {
          targetJob: cv.targetJob || '',
          targetCompany: cv.targetCompany || '',
          jobDescription: cv.jobDescription || '',
        },
        experience: selected,
      });

      const historyId = await createAiHistorySafely({
        action: 'rewriteExperience',
        accepted: false,
        oldText: selected.description || '',
        newText: result.text || '',
        targetJob: cv.targetJob || '',
        targetCompany: cv.targetCompany || '',
        metadata: {
          experienceIndex: index,
          experienceRole: selected.role || '',
          experienceCompany: selected.company || '',
        },
      });

      setPendingRewrite({
        index,
        historyId: historyId || undefined,
        role: selected.role || '',
        company: selected.company || '',
        oldDescription: selected.description || '',
        newDescription: result.text || '',
      });
      toast.success('AI đã tạo bản rewrite đề xuất. Hãy xem lại trước khi áp dụng.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể viết lại mô tả.');
    } finally {
      setExperienceAiLoadingIndex(null);
    }
  }, [callCvAi, canRewriteExperience, createAiHistorySafely, cv, handleAiRequestError]);

  const handleApplyPendingRewrite = useCallback(() => {
    if (!pendingRewrite) return;

    applyRewriteToExperience(pendingRewrite.index, pendingRewrite.newDescription);
    if (pendingRewrite.historyId) {
      void updateAiHistorySafely(pendingRewrite.historyId, {
        accepted: true,
      });
    }
    setPendingRewrite(null);
    toast.success('Đã áp dụng bản rewrite AI vào mô tả kinh nghiệm.');
  }, [applyRewriteToExperience, pendingRewrite, updateAiHistorySafely]);

  const handleDiscardPendingRewrite = useCallback(() => {
    setPendingRewrite(null);
  }, []);

  const handleRegeneratePendingRewrite = useCallback(async () => {
    if (!pendingRewrite) return;

    await handleRewriteExperience(pendingRewrite.index);
  }, [handleRewriteExperience, pendingRewrite]);

  const handleTailorCvForJob = useCallback(async () => {
    if (!cv) return;

    if (!canTailorCvForJob) {
      handleAiRequestError(new Error('Tailor CV to Job hiện chỉ có trong gói Premium.'), 'Tính năng này cần gói Premium.');
      return;
    }

    if (!cv.jobDescription?.trim() || cv.jobDescription.trim().length < 50) {
      toast.error('Vui lòng nhập mô tả công việc để AI tối ưu CV chính xác hơn.');
      return;
    }

    setTailorCvLoading(true);
    try {
      const result = await callCvAi({
        action: 'tailorCvForJob',
        language: cv.language,
        cv: {
          title: cv.title,
          targetJob: cv.targetJob || '',
          targetCompany: cv.targetCompany || '',
          jobDescription: cv.jobDescription || '',
          personalInfo: cv.content.personalInfo,
          summary: cv.content.summary || '',
          experience: cv.content.experience || [],
          skills: cv.content.skills || [],
          education: cv.content.education || [],
        },
      });

      if (!result.tailor) {
        throw new Error('AI chưa trả về gợi ý Tailor CV hợp lệ.');
      }

      const historyId = await createAiHistorySafely({
        action: 'tailorCvForJob',
        accepted: false,
        oldText: cv.content.summary || '',
        newText: result.tailor.improvedSummary,
        targetJob: cv.targetJob || '',
        targetCompany: cv.targetCompany || '',
        metadata: {
          suggestedSkillsOrder: result.tailor.suggestedSkillsOrder,
          improvedExperienceBullets: result.tailor.improvedExperienceBullets,
          keywordsMissing: result.tailor.keywordsMissing,
          recommendations: result.tailor.recommendations,
        },
      });

      setPendingTailorCv({
        ...result.tailor,
        historyId: historyId || undefined,
        applySummary: true,
        applyExperienceBullets: result.tailor.improvedExperienceBullets.length > 0,
      });
      toast.success('AI đã tạo đề xuất Tailor CV. Bạn hãy xem lại trước khi áp dụng.');
    } catch (error) {
      if (error instanceof Error && (error as Error & { code?: string }).code === 'TAILOR_INVALID_FORMAT') {
        toast.error(error.message || 'AI trả về định dạng Tailor CV không hợp lệ. Vui lòng thử lại.');
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Không thể tạo đề xuất Tailor CV.');
    } finally {
      setTailorCvLoading(false);
    }
  }, [callCvAi, canTailorCvForJob, createAiHistorySafely, cv, handleAiRequestError]);

  const handleDiscardPendingTailorCv = useCallback(() => {
    setPendingTailorCv(null);
  }, []);

  const handleApplyPendingTailorCv = useCallback(() => {
    if (!pendingTailorCv) return;

    if (!pendingTailorCv.applySummary && !pendingTailorCv.applyExperienceBullets) {
      toast.error('Hãy chọn ít nhất một phần để áp dụng.');
      return;
    }

    if (pendingTailorCv.applySummary) {
      updateSummary(pendingTailorCv.improvedSummary);
    }

    if (pendingTailorCv.applyExperienceBullets) {
      applyTailoredExperienceBullets(pendingTailorCv.improvedExperienceBullets);
    }

    if (pendingTailorCv.historyId) {
      void updateAiHistorySafely(pendingTailorCv.historyId, {
        accepted: true,
      });
    }

    setPendingTailorCv(null);
    toast.success('Đã áp dụng các đề xuất Tailor CV đã chọn.');
  }, [applyTailoredExperienceBullets, pendingTailorCv, updateAiHistorySafely, updateSummary]);

  const handleRunStudentAi = useCallback(async (action: StudentAiAction) => {
    if (!cv) return;

    if (action === 'fresherSummary' && !canGenerateFresherSummary) {
      if (aiPlan === 'free' && (remainingToday ?? 0) <= 0) {
        openQuotaPrompt('Báº¡n Ä‘Ã£ dÃ¹ng háº¿t lÆ°á»£t AI miá»…n phÃ­ hÃ´m nay. NÃ¢ng cáº¥p Premium Ä‘á»ƒ tiáº¿p tá»¥c dÃ¹ng fresher summary.');
      } else {
        toast.error('KhÃ´ng thá»ƒ dÃ¹ng Fresher Summary lÃºc nÃ y.');
      }
      return;
    }

    if (action === 'generateProjectBullets' && !canGenerateProjectBullets) {
      handleAiRequestError(new Error('Project Bullets hiá»‡n chá»‰ cÃ³ trong gÃ³i Premium.'), 'TÃ­nh nÄƒng nÃ y cáº§n gÃ³i Premium.');
      return;
    }

    if (action === 'convertActivitiesToCvBullets' && !canConvertActivitiesToCvBullets) {
      handleAiRequestError(new Error('Activities to CV Bullets hiá»‡n chá»‰ cÃ³ trong gÃ³i Premium.'), 'TÃ­nh nÄƒng nÃ y cáº§n gÃ³i Premium.');
      return;
    }

    const technologies = normalizeStudentTechnologies(studentAiForm.technologies);
    if (action !== 'fresherSummary' && !studentAiForm.itemName.trim()) {
      toast.error('HÃ£y nháº­p tÃªn Ä‘á»“ Ã¡n hoáº·c hoáº¡t Ä‘á»™ng trÆ°á»›c khi dÃ¹ng AI.');
      return;
    }

    setStudentAiLoadingAction(action);
    try {
      const payload = {
        targetJob: studentAiForm.targetJob.trim(),
        fieldOfStudy: studentAiForm.fieldOfStudy.trim(),
        itemName: studentAiForm.itemName.trim(),
        role: studentAiForm.role.trim(),
        technologies,
        achievements: studentAiForm.achievements.trim(),
      };

      const result = await callCvAi(
        action === 'fresherSummary'
          ? { action, language: cv.language, profile: payload }
          : action === 'generateProjectBullets'
            ? { action, language: cv.language, project: payload }
            : { action, language: cv.language, activity: payload }
      );

      const oldText = action === 'fresherSummary'
        ? (cv.content.summary || '')
        : action === 'generateProjectBullets'
          ? (cv.content.projects || []).find((item) => item.name.trim().toLowerCase() === payload.itemName.toLowerCase())?.description || ''
          : (cv.content.activities || []).find((item) => item.name.trim().toLowerCase() === payload.itemName.toLowerCase())?.description || '';
      const newText = action === 'fresherSummary' ? (result.summary || '') : (result.bullets || []).join('\n');

      if (!newText.trim()) {
        throw new Error('AI chÆ°a tráº£ vá» ná»™i dung phÃ¹ há»£p Ä‘á»ƒ Ã¡p dá»¥ng.');
      }

      const historyId = await createAiHistorySafely({
        action,
        accepted: false,
        oldText,
        newText,
        targetJob: payload.targetJob,
        targetCompany: cv.targetCompany || '',
        metadata: {
          fieldOfStudy: payload.fieldOfStudy,
          itemName: payload.itemName,
          role: payload.role,
          technologies,
          achievements: payload.achievements,
        },
      });

      setPendingStudentAi({
        action,
        historyId: historyId || undefined,
        oldText,
        newText,
        targetJob: payload.targetJob,
        fieldOfStudy: payload.fieldOfStudy,
        itemName: payload.itemName,
        role: payload.role,
        technologies,
        achievements: payload.achievements,
      });

      toast.success('AI Ä‘Ã£ táº¡o báº£n Ä‘á» xuáº¥t. HÃ£y xem láº¡i trÆ°á»›c khi Ã¡p dá»¥ng.');
    } catch (error) {
      const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined;
      if (
        code === 'FRESHER_SUMMARY_INVALID_FORMAT'
        || code === 'PROJECT_BULLETS_INVALID_FORMAT'
        || code === 'ACTIVITY_BULLETS_INVALID_FORMAT'
      ) {
        toast.error(error instanceof Error ? error.message : 'AI tráº£ vá» Ä‘á»‹nh dáº¡ng khÃ´ng há»£p lá»‡.');
        return;
      }

      toast.error(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ táº¡o ná»™i dung AI cho sinh viÃªn/Fresher.');
    } finally {
      setStudentAiLoadingAction(null);
    }
  }, [
    aiPlan,
    callCvAi,
    canConvertActivitiesToCvBullets,
    canGenerateFresherSummary,
    canGenerateProjectBullets,
    createAiHistorySafely,
    cv,
    handleAiRequestError,
    normalizeStudentTechnologies,
    openQuotaPrompt,
    remainingToday,
    studentAiForm,
  ]);

  const handleDiscardPendingStudentAi = useCallback(() => {
    setPendingStudentAi(null);
  }, []);

  const handleApplyPendingStudentAi = useCallback(() => {
    if (!pendingStudentAi) return;

    if (pendingStudentAi.action === 'fresherSummary') {
      updateSummary(pendingStudentAi.newText);
    } else if (pendingStudentAi.action === 'generateProjectBullets') {
      applyProjectBullets(pendingStudentAi);
    } else {
      applyActivityBullets(pendingStudentAi);
    }

    if (pendingStudentAi.historyId) {
      void updateAiHistorySafely(pendingStudentAi.historyId, {
        accepted: true,
      });
    }

    setPendingStudentAi(null);
    toast.success('ÄÃ£ Ã¡p dá»¥ng ná»™i dung AI vÃ o CV.');
  }, [applyActivityBullets, applyProjectBullets, pendingStudentAi, updateAiHistorySafely, updateSummary]);

  const handleAtsReview = useCallback(async () => {
    if (!cv) return;

    if (!canRunAtsReview) {
      handleAiRequestError(new Error('ATS review hiện chỉ có trong gói Premium.'), 'Tính năng này cần gói Premium.');
      return;
    }

    if (!cv.targetJob?.trim() && !cv.jobDescription?.trim()) {
      toast.error('Hãy nhập vị trí ứng tuyển hoặc mô tả công việc trước khi chấm ATS.');
      return;
    }

    setAtsLoading(true);
    try {
      const result = await callCvAi({
        action: 'atsReview',
        language: cv.language,
        cv: {
          title: cv.title,
          targetJob: cv.targetJob || '',
          targetCompany: cv.targetCompany || '',
          jobDescription: cv.jobDescription || '',
          personalInfo: cv.content.personalInfo,
          summary: cv.content.summary || '',
          experience: cv.content.experience || [],
          skills: cv.content.skills || [],
          education: cv.content.education || [],
          projects: cv.content.projects || [],
        },
      });

      if (result.review) {
        setAtsReview(result.review);
        void createAiHistorySafely({
          action: 'atsReview',
          accepted: true,
          oldText: '',
          newText: '',
          targetJob: cv.targetJob || '',
          targetCompany: cv.targetCompany || '',
          metadata: {
            score: result.review.score,
            strengths: result.review.strengths,
            gaps: result.review.gaps,
            keywordsMissing: result.review.keywordsMissing,
            recommendations: result.review.recommendations,
          },
        });
        toast.success('Đã phân tích ATS cho CV này.');
      }
    } catch (error) {
      if (error instanceof Error && (error as Error & { code?: string }).code === 'ATS_INVALID_FORMAT') {
        toast.error(error.message || 'AI trả về định dạng ATS không hợp lệ. Vui lòng thử lại.');
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Không thể phân tích ATS.');
    } finally {
      setAtsLoading(false);
    }
  }, [callCvAi, canRunAtsReview, createAiHistorySafely, cv, handleAiRequestError]);

  const handleGenerateCoverLetter = useCallback(async () => {
    if (!cv) return;

    if (!canGenerateCoverLetter) {
      handleAiRequestError(new Error('Cover letter AI hiện chỉ có trong gói Premium.'), 'Tính năng này cần gói Premium.');
      return;
    }

    if (!cv.targetJob?.trim() && !cv.jobDescription?.trim()) {
      toast.error('Hãy nhập vị trí ứng tuyển hoặc mô tả công việc trước khi tạo cover letter.');
      return;
    }

    setCoverLetterLoading(true);
    try {
      const result = await callCvAi({
        action: 'generateCoverLetter',
        language: cv.language,
        recipientName,
        cv: {
          title: cv.title,
          targetJob: cv.targetJob || '',
          targetCompany: cv.targetCompany || '',
          jobDescription: cv.jobDescription || '',
          personalInfo: cv.content.personalInfo,
          summary: cv.content.summary || '',
          experience: cv.content.experience || [],
          skills: cv.content.skills || [],
        },
      });

      setCoverLetterDraft(result.text || '');
      toast.success('Đã tạo cover letter bằng AI.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo cover letter.');
    } finally {
      setCoverLetterLoading(false);
    }
  }, [callCvAi, canGenerateCoverLetter, cv, handleAiRequestError, recipientName]);

  const handleSaveCoverLetter = useCallback(async () => {
    if (!firebaseUser || !coverLetterDraft.trim() || !cv) return;

    setCoverLetterSaving(true);
    try {
      await createCoverLetter(firebaseUser.uid, {
        title: `Cover Letter - ${cv.targetJob || cv.title}`,
        recipientName: recipientName || undefined,
        companyName: cv.targetCompany || undefined,
        jobTitle: cv.targetJob || undefined,
        content: coverLetterDraft,
        templateId: 'classic',
      });
      toast.success('Đã lưu cover letter vào tài khoản.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu cover letter.');
    } finally {
      setCoverLetterSaving(false);
    }
  }, [coverLetterDraft, cv, firebaseUser, recipientName]);

  const handleCopyHistoryText = useCallback(async (text: string, successMessage: string) => {
    if (!text.trim()) {
      toast.error('Không có nội dung để sao chép.');
      return;
    }

    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  }, []);

  const handleApplySummaryFromHistory = useCallback((text: string, successMessage: string) => {
    updateSummary(text);
    toast.success(successMessage);
  }, [updateSummary]);

  const handleApplyRewriteFromHistory = useCallback((history: CvAiHistoryRecord) => {
    const experienceIndex = history.metadata?.experienceIndex;

    if (typeof experienceIndex !== 'number') {
      toast.error('Không tìm thấy vị trí kinh nghiệm để áp dụng lại.');
      return;
    }

    applyRewriteToExperience(experienceIndex, history.newText || '');
    void updateAiHistorySafely(history.id, { accepted: true });
    toast.success('Đã áp dụng lại bản rewrite từ lịch sử AI.');
  }, [applyRewriteToExperience, updateAiHistorySafely]);

  if (dataLoading) return <LoadingEditor />;
  if (!cv) return null;

  const sections = cv.sections?.order || [];
  const visibility = cv.sections?.visibility || {};
  const filteredAiHistory = aiHistory.filter((item) => aiHistoryFilter === 'all' ? true : item.action === aiHistoryFilter);
  const formatAiHistoryDate = (value: unknown) => {
    const parsed =
      value instanceof Date
        ? value
        : typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate?: () => Date }).toDate === 'function'
          ? (value as { toDate: () => Date }).toDate()
          : null;

    return parsed
      ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(parsed)
      : 'Chưa có thời gian';
  };

  return (
    <>
      <MobileEditorWarning storageKey="cv-editor-mobile-warning" />
      {/* ── Toolbar cố định ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '56px', padding: '0 16px', gap: '8px' }}>
          <Link href="/cv" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cv.title}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {saved ? <span style={{ color: '#10b981' }}>✓ Đã lưu</span> : 'Tự động lưu...'}
            </p>
          </div>
          <div
            style={{
              display: 'none', // hide quota here on small screens to save space
            }}
            title="Quota hiện tại của tài khoản"
          >
            {aiStatusLoading
              ? 'Đang tải quota...'
              : `AI ${aiLimit === null ? '∞' : `${aiUsedToday}/${aiLimit}`} • CV ${cvLimit === null ? cvCount : `${cvCount}/${cvLimit}`}`}
          </div>

          <button
            onClick={() => {
              updateMeta('isPublic', !cv.isPublic);
              toast.success(!cv.isPublic ? 'Đã đổi sang chế độ Công Khai' : 'Đã đổi sang chế độ Riêng Tư');
            }}
            className="btn btn-ghost btn-sm"
            title={cv.isPublic ? "Đang chia sẻ công khai" : "Đang ở chế độ riêng tư"}
            style={{ flexShrink: 0, color: cv.isPublic ? '#10b981' : 'inherit' }}
          >
            <Globe size={14} />
            <span style={{ fontSize: '0.75rem', display: 'none' }} className="hidden sm:inline">
              {cv.isPublic ? 'Public' : 'Private'}
            </span>
          </button>

          {/* Language toggle */}
          <button onClick={toggleLanguage} className="btn btn-ghost btn-sm" title="Đổi ngôn ngữ CV" style={{ flexShrink: 0 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{cv.language === 'vi' ? 'VI' : 'EN'}</span>
          </button>

          {/* Preview toggle */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="btn btn-ghost btn-sm"
            style={{ flexShrink: 0 }}
          >
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
            <span style={{ fontSize: '0.75rem', display: 'none' }} className="hidden sm:inline">
              {previewMode ? 'Chỉnh sửa' : 'Xem trước'}
            </span>
          </button>

          <ExportButton cvTitle={cv.title} printPath={`/cv/${cv.cvId}/print`} />

          <button
            onClick={handleManualSave}
            disabled={saving}
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0 }}
          >
            {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            <span style={{ display: 'none' }} className="hidden sm:inline">Lưu</span>
          </button>
        </div>

        {/* Tab Bar */}
        {!previewMode && (
          <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
            {([
              { key: 'content', icon: <ChevronRight size={14} />, label: 'Nội dung' },
              { key: 'sections', icon: <ListOrdered size={14} />, label: 'Mục CV' },
              { key: 'theme', icon: <Palette size={14} />, label: 'Giao diện' },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px', border: 'none', cursor: 'pointer',
                  background: tab === t.key ? 'rgba(99,102,241,0.08)' : 'transparent',
                  color: tab === t.key ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                  fontWeight: tab === t.key ? 700 : 500,
                  fontSize: '0.82rem', transition: 'all 0.15s',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Layout Editor ── */}
      <div className={`editor-layout ${previewMode ? 'preview-active' : 'form-active'}`} style={{
        paddingTop: previewMode ? '56px' : '102px',
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-base)',
      }}>
        {/* Form Panel */}
        {!previewMode && (
          <div className="form-panel" style={{
            width: `${panelWidth}px`, flexShrink: 0, overflowY: 'auto',
            background: 'var(--bg-card)',
            height: 'calc(100vh - 102px)',
            position: 'sticky', top: '102px',
          }}>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <QuotaUsageCard
                aiUsed={aiUsedToday}
                aiLimit={aiLimit}
                cvUsed={cvCount}
                cvLimit={cvLimit}
              />

              {/* Content tab */}
              {tab === 'content' && (
                <>
                  {sections.map(section => {
                    if (visibility[section] === false) return null;
                    const label = SECTION_LABELS_VI[section] || section;
                    const isOpen = openSection === section;

                    return (
                      <AccordionSection key={section} title={label} isOpen={isOpen} onToggle={() => setOpenSection(isOpen ? '' as CVSection : section)}>
                        {section === 'personalInfo' && (
                          <PersonalInfoForm
                            uid={firebaseUser?.uid || cv.uid}
                            cvId={cv.cvId}
                            data={cv.content.personalInfo || { fullName:'',jobTitle:'',email:'',phone:'',address:'' }}
                            onChange={updatePersonalInfo}
                          />
                        )}
                        {section === 'summary' && (
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                  Vị trí ứng tuyển
                                </label>
                                <input className="input" placeholder="Ví dụ: Frontend Developer" value={cv.targetJob || ''} onChange={e => updateMeta('targetJob', e.target.value)} />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                  Công ty mục tiêu
                                </label>
                                <input className="input" placeholder="Ví dụ: Google" value={cv.targetCompany || ''} onChange={e => updateMeta('targetCompany', e.target.value)} />
                              </div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Mô tả công việc / Job Description
                              </label>
                              <textarea
                                className="input"
                                rows={5}
                                placeholder="Dán JD ở đây để ATS review, AI rewrite và cover letter bám sát đúng yêu cầu tuyển dụng."
                                value={cv.jobDescription || ''}
                                onChange={e => updateMeta('jobDescription', e.target.value)}
                                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                              />
                            </div>
                            <div style={{ marginBottom: '12px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.16)', background: 'rgba(99,102,241,0.04)', padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    Trạng thái AI hiện tại
                                  </p>
                                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                    Gói hiện tại: <strong>{aiPlan === 'premium' ? 'Premium' : 'Free'}</strong>
                                    {aiPlan === 'free' ? ` • Còn ${remainingToday ?? FREE_AI_DAILY_LIMIT} lượt hôm nay` : ' • Không giới hạn lượt theo ngày'}
                                  </p>
                                </div>
                                {aiPlan === 'free' && (
                                  <Link href="/pricing" className="btn btn-ghost btn-sm">
                                    Nâng cấp Premium
                                  </Link>
                                )}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {([
                                  'generateSummary',
                                  'fresherSummary',
                                  'rewriteExperience',
                                  'atsReview',
                                  'generateCoverLetter',
                                  'generateProjectBullets',
                                  'convertActivitiesToCvBullets',
                                  'tailorCvForJob',
                                ] as AiAction[]).map((typedAction) => {
                                  const enabled = allowedActions.has(typedAction);
                                  const label = AI_ACTION_LABELS[typedAction] || getAiActionLabel(typedAction);
                                  return (
                                    <span
                                      key={typedAction}
                                      style={{
                                        fontSize: '0.74rem',
                                        fontWeight: 700,
                                        padding: '5px 10px',
                                        borderRadius: '9999px',
                                        border: `1px solid ${enabled ? 'rgba(16,185,129,0.24)' : 'rgba(245,158,11,0.26)'}`,
                                        background: enabled ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                        color: enabled ? '#059669' : '#d97706',
                                      }}
                                    >
                                      {label} {enabled ? '• Đang mở' : '• Premium'}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div style={{ marginBottom: '12px', borderRadius: '10px', border: `1px solid ${aiPlan === 'premium' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)'}`, background: aiPlan === 'premium' ? 'rgba(99,102,241,0.05)' : 'rgba(16,185,129,0.05)', padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    {aiPlan === 'premium' ? 'Gemini Summary Premium' : 'Gemini Summary Free'}
                                  </p>
                                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {aiPlan === 'premium'
                                      ? 'Tạo summary sát mục tiêu ứng tuyển hơn và ưu tiên ngôn ngữ tuyển dụng.'
                                      : `Miễn phí: ${FREE_AI_DAILY_LIMIT} lượt/ngày cho summary cơ bản. Cần nhiều hơn hoặc muốn rewrite kinh nghiệm thì nâng cấp Premium.`}
                                  </p>
                                  {aiPlan === 'free' && (
                                    <p style={{ marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                      Lượt còn lại hôm nay: {remainingToday ?? FREE_AI_DAILY_LIMIT}
                                    </p>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {aiPlan === 'free' && (
                                    <Link href="/pricing" className="btn btn-ghost btn-sm">
                                      Xem Premium
                                    </Link>
                                  )}
                                  <button
                                    type="button"
                                    onClick={handleGenerateSummary}
                                    disabled={summaryAiLoading || !canGenerateSummary}
                                    className="btn btn-primary btn-sm"
                                  >
                                    {aiStatusLoading ? 'Đang kiểm tra quyền...' : summaryAiLoading ? 'AI đang viết...' : aiPlan === 'free' && (remainingToday ?? 0) <= 0 ? 'Hết lượt hôm nay' : 'Tạo summary bằng AI'}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div style={{ marginBottom: '12px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.05)', padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    AI cho sinh viên/Fresher
                                  </p>
                                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    Hỗ trợ viết summary cho người ít kinh nghiệm, chuyển đồ án thành bullet CV, hoặc biến hoạt động/CLB/part-time thành mô tả chuyên nghiệp hơn.
                                  </p>
                                </div>
                                {aiPlan === 'free' && (
                                  <Link href="/pricing" className="btn btn-ghost btn-sm">
                                    Mở khóa tools Premium
                                  </Link>
                                )}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Vị trí muốn ứng tuyển
                                  </label>
                                  <input
                                    className="input"
                                    placeholder="Ví dụ: Frontend Developer Intern"
                                    value={studentAiForm.targetJob}
                                    onChange={(e) => setStudentAiForm((current) => ({ ...current, targetJob: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Ngành học / Chuyên ngành
                                  </label>
                                  <input
                                    className="input"
                                    placeholder="Ví dụ: Công nghệ thông tin"
                                    value={studentAiForm.fieldOfStudy}
                                    onChange={(e) => setStudentAiForm((current) => ({ ...current, fieldOfStudy: e.target.value }))}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'grid', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Tên đồ án / hoạt động
                                  </label>
                                  <input
                                    className="input"
                                    placeholder="Ví dụ: Đồ án quản lý thư viện / CLB Truyền thông"
                                    value={studentAiForm.itemName}
                                    onChange={(e) => setStudentAiForm((current) => ({ ...current, itemName: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Vai trò
                                  </label>
                                  <input
                                    className="input"
                                    placeholder="Ví dụ: Team member / Project lead / Part-time staff"
                                    value={studentAiForm.role}
                                    onChange={(e) => setStudentAiForm((current) => ({ ...current, role: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Công nghệ / kỹ năng đã dùng
                                  </label>
                                  <input
                                    className="input"
                                    placeholder="React, TypeScript, Communication, Event Planning..."
                                    value={studentAiForm.technologies}
                                    onChange={(e) => setStudentAiForm((current) => ({ ...current, technologies: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Kết quả đạt được nếu có
                                  </label>
                                  <textarea
                                    className="input"
                                    rows={3}
                                    placeholder="Ví dụ: Hoàn thành MVP, hỗ trợ triển khai demo, phối hợp tổ chức sự kiện..."
                                    value={studentAiForm.achievements}
                                    onChange={(e) => setStudentAiForm((current) => ({ ...current, achievements: e.target.value }))}
                                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  disabled={studentAiLoadingAction === 'fresherSummary' || !canGenerateFresherSummary}
                                  onClick={() => void handleRunStudentAi('fresherSummary')}
                                >
                                  {studentAiLoadingAction === 'fresherSummary' ? 'AI đang viết...' : 'Fresher Summary'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  disabled={studentAiLoadingAction === 'generateProjectBullets' || !canGenerateProjectBullets}
                                  onClick={() => void handleRunStudentAi('generateProjectBullets')}
                                >
                                  {studentAiLoadingAction === 'generateProjectBullets' ? 'Đang tạo bullets...' : 'Project Bullets'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  disabled={studentAiLoadingAction === 'convertActivitiesToCvBullets' || !canConvertActivitiesToCvBullets}
                                  onClick={() => void handleRunStudentAi('convertActivitiesToCvBullets')}
                                >
                                  {studentAiLoadingAction === 'convertActivitiesToCvBullets' ? 'Đang tạo bullets...' : 'Activities to CV Bullets'}
                                </button>
                              </div>
                              <p style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                `Fresher Summary` dùng được trong quota Free. Hai tool bullets chỉ mở cho Premium. Mọi kết quả đều cần bạn review trước khi áp dụng.
                              </p>
                            </div>
                            <div style={{ marginBottom: '12px', borderRadius: '10px', border: `1px solid ${aiPlan === 'premium' ? 'rgba(14,165,233,0.24)' : 'rgba(148,163,184,0.2)'}`, background: aiPlan === 'premium' ? 'rgba(14,165,233,0.05)' : 'rgba(148,163,184,0.05)', padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    Tailor CV to Job
                                  </p>
                                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {aiPlan === 'premium'
                                      ? 'AI đề xuất summary mới, thứ tự skills nên nhấn mạnh, bullets kinh nghiệm nên tối ưu, keyword còn thiếu và hướng chỉnh CV theo JD.'
                                      : 'Tailor CV to Job là tính năng Premium. Bạn sẽ xem đề xuất trước rồi mới chọn phần nào cần áp dụng vào CV.'}
                                  </p>
                                  {!cv.jobDescription?.trim() && (
                                    <p style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                      Chưa có job description. Bạn vẫn có thể chạy, nhưng đề xuất sẽ ít bám sát JD hơn.
                                    </p>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {aiPlan === 'free' && (
                                    <Link href="/pricing" className="btn btn-ghost btn-sm">
                                      Mở khóa Tailor AI
                                    </Link>
                                  )}
                                  <button type="button" onClick={handleTailorCvForJob} disabled={!canTailorCvForJob || tailorCvLoading} className="btn btn-outline btn-sm">
                                    {aiStatusLoading ? 'Đang kiểm tra quyền...' : tailorCvLoading ? 'Đang tối ưu...' : 'Tailor CV to Job'}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div style={{ marginBottom: '12px', borderRadius: '10px', border: `1px solid ${aiPlan === 'premium' ? 'rgba(245,158,11,0.25)' : 'rgba(148,163,184,0.2)'}`, background: aiPlan === 'premium' ? 'rgba(245,158,11,0.06)' : 'rgba(148,163,184,0.05)', padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: aiPlan === 'premium' && atsReview ? '12px' : 0 }}>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    ATS Optimizer
                                  </p>
                                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {aiPlan === 'premium'
                                      ? 'Chấm độ khớp CV với vị trí ứng tuyển, tìm keyword thiếu và gợi ý chỉnh sửa cụ thể.'
                                      : 'ATS review và keyword gap là tính năng Premium. Free chỉ dùng summary generator cơ bản.'}
                                  </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {aiPlan === 'free' && (
                                    <Link href="/pricing" className="btn btn-ghost btn-sm">
                                      Mở khóa ATS
                                    </Link>
                                  )}
                                  <button type="button" onClick={handleAtsReview} disabled={!canRunAtsReview || atsLoading} className="btn btn-outline btn-sm">
                                    {aiStatusLoading ? 'Đang kiểm tra quyền...' : atsLoading ? 'Đang phân tích...' : 'Chấm ATS'}
                                  </button>
                                </div>
                              </div>
                              {aiPlan === 'premium' && atsReview && (
                                <div style={{ display: 'grid', gap: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: atsReview.score >= 75 ? 'rgba(16,185,129,0.12)' : atsReview.score >= 55 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ fontWeight: 800, fontSize: '1rem', color: atsReview.score >= 75 ? '#10b981' : atsReview.score >= 55 ? '#d97706' : '#ef4444' }}>
                                        {atsReview.score}
                                      </span>
                                    </div>
                                    <div>
                                      <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                        Điểm ATS hiện tại
                                      </p>
                                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        Dựa trên target job, JD và nội dung CV hiện có.
                                      </p>
                                    </div>
                                  </div>
                                  <AtsList title="Điểm mạnh" items={atsReview.strengths} tone="success" />
                                  <AtsList title="Khoảng trống" items={atsReview.gaps} tone="danger" />
                                  <AtsList title="Từ khóa còn thiếu" items={atsReview.keywordsMissing} tone="warning" />
                                  <AtsList title="Gợi ý cải thiện" items={atsReview.recommendations} tone="default" />
                                </div>
                              )}
                            </div>
                            <div style={{ marginBottom: '12px', borderRadius: '10px', border: `1px solid ${aiPlan === 'premium' ? 'rgba(236,72,153,0.22)' : 'rgba(148,163,184,0.2)'}`, background: aiPlan === 'premium' ? 'rgba(236,72,153,0.05)' : 'rgba(148,163,184,0.05)', padding: '12px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'end', marginBottom: '12px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Người nhận thư
                                  </label>
                                  <input className="input" placeholder="Ví dụ: Hiring Manager" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
                                </div>
                                <button type="button" onClick={handleGenerateCoverLetter} disabled={!canGenerateCoverLetter || coverLetterLoading} className="btn btn-outline btn-sm">
                                  {aiStatusLoading ? 'Đang kiểm tra quyền...' : coverLetterLoading ? 'Đang tạo...' : 'Tạo cover letter'}
                                </button>
                              </div>
                              {aiPlan === 'free' && (
                                <div style={{ marginBottom: '12px' }}>
                                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    Cover letter generator là tính năng Premium. Khi mở khóa, bạn có thể tạo thư ứng tuyển bám sát JD và lưu vào tài khoản.
                                  </p>
                                  <div style={{ marginTop: '8px' }}>
                                    <Link href="/pricing" className="btn btn-ghost btn-sm">
                                      Mở khóa Cover Letter AI
                                    </Link>
                                  </div>
                                </div>
                              )}
                              {coverLetterDraft && aiPlan === 'premium' && (
                                <div>
                                  <textarea className="input" rows={10} value={coverLetterDraft} onChange={e => setCoverLetterDraft(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit', marginBottom: '10px' }} />
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await navigator.clipboard.writeText(coverLetterDraft);
                                        toast.success('Đã sao chép cover letter.');
                                      }}
                                      className="btn btn-secondary btn-sm"
                                    >
                                      Sao chép
                                    </button>
                                    <button type="button" onClick={handleSaveCoverLetter} disabled={coverLetterSaving} className="btn btn-primary btn-sm">
                                      {coverLetterSaving ? 'Đang lưu...' : 'Lưu vào tài khoản'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              💡 Viết 3-5 câu tóm tắt điểm mạnh, năm kinh nghiệm và mục tiêu nghề nghiệp ngắn hạn. Không quá 100 từ.
                            </div>
                            <textarea
                              className="input"
                              rows={7}
                              placeholder="Tôi là Frontend Developer với 3 năm kinh nghiệm xây dựng các ứng dụng web hiệu suất cao bằng React. Đam mê tạo ra trải nghiệm người dùng tuyệt vời..."
                              value={cv.content.summary || ''}
                              onChange={e => updateSummary(e.target.value)}
                              style={{ resize: 'vertical', fontFamily: 'inherit' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                              {(cv.content.summary || '').length} ký tự
                            </p>
                          </div>
                        )}
                        {section === 'experience' && (
                          <ExperienceForm
                            data={cv.content.experience || []}
                            onChange={d => updateSection('experience', d)}
                            lang={cv.language}
                            aiPlan={aiPlan}
                            canRewriteWithAi={canRewriteExperience}
                            aiStatusLoading={aiStatusLoading}
                            aiLoadingIndex={experienceAiLoadingIndex}
                            onRewriteWithAi={handleRewriteExperience}
                          />
                        )}
                        {section === 'education' && (
                          <EducationForm data={cv.content.education || []} onChange={d => updateSection('education', d)} />
                        )}
                        {section === 'skills' && (
                          <SkillsForm data={cv.content.skills || []} onChange={d => updateSection('skills', d)} />
                        )}
                        {section === 'projects' && (
                          <ProjectsForm data={cv.content.projects || []} onChange={d => updateSection('projects', d)} />
                        )}
                        {section === 'languages' && (
                          <LanguagesForm data={cv.content.languages || []} onChange={d => updateSection('languages', d)} />
                        )}
                        {section === 'interests' && (
                          <InterestsForm data={cv.content.interests || []} onChange={d => updateSection('interests', d)} />
                        )}
                        {(section === 'certificates' || section === 'activities') && (
                          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Tính năng đang được phát triển...
                          </div>
                        )}
                      </AccordionSection>
                    );
                  })}

                  <AccordionSection
                    title="🤖 AI History"
                    isOpen={isAiHistoryOpen}
                    onToggle={() => setIsAiHistoryOpen((current) => !current)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {([
                          { key: 'all', label: 'Tất cả' },
                          ...Object.entries(AI_HISTORY_ACTION_LABELS).map(([key, label]) => ({ key, label })),
                        ] as { key: AiHistoryFilter; label: string }[]).map((filter) => {
                          const active = aiHistoryFilter === filter.key;

                          return (
                            <button
                              key={filter.key}
                              type="button"
                              className="btn btn-sm"
                              onClick={() => setAiHistoryFilter(filter.key)}
                              style={{
                                background: active ? 'rgba(99,102,241,0.12)' : 'var(--bg-base)',
                                color: active ? 'var(--primary)' : 'var(--text-secondary)',
                                border: `1px solid ${active ? 'rgba(99,102,241,0.24)' : 'var(--border)'}`,
                              }}
                            >
                              {filter.label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => setAiHistoryFilter('tailorCvForJob')}
                          style={{
                            background: aiHistoryFilter === 'tailorCvForJob' ? 'rgba(99,102,241,0.12)' : 'var(--bg-base)',
                            color: aiHistoryFilter === 'tailorCvForJob' ? 'var(--primary)' : 'var(--text-secondary)',
                            border: `1px solid ${aiHistoryFilter === 'tailorCvForJob' ? 'rgba(99,102,241,0.24)' : 'var(--border)'}`,
                          }}
                        >
                          {AI_HISTORY_FILTERS[AI_HISTORY_FILTERS.length - 1].label}
                        </button>
                      </div>

                      {aiHistoryLoading && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          Đang tải lịch sử AI...
                        </div>
                      )}

                      {!aiHistoryLoading && filteredAiHistory.length === 0 && (
                        <div
                          style={{
                            borderRadius: '12px',
                            border: '1px dashed var(--border)',
                            padding: '16px',
                            fontSize: '0.82rem',
                            color: 'var(--text-muted)',
                            textAlign: 'center',
                          }}
                        >
                          Chưa có bản ghi AI nào cho bộ lọc này.
                        </div>
                      )}

                      {!aiHistoryLoading && filteredAiHistory.map((history) => {
                        const atsMetadata = history.action === 'atsReview' ? history.metadata as {
                          score?: number;
                          strengths?: string[];
                          gaps?: string[];
                          keywordsMissing?: string[];
                          recommendations?: string[];
                        } | undefined : undefined;
                        const tailorMetadata = history.action === 'tailorCvForJob' ? history.metadata as {
                          suggestedSkillsOrder?: string[];
                          improvedExperienceBullets?: TailorCvForJobResponse['improvedExperienceBullets'];
                          keywordsMissing?: string[];
                          recommendations?: string[];
                        } | undefined : undefined;
                        const studentMetadata = (
                          history.action === 'fresherSummary'
                          || history.action === 'generateProjectBullets'
                          || history.action === 'convertActivitiesToCvBullets'
                        ) ? history.metadata as {
                          fieldOfStudy?: string;
                          itemName?: string;
                          role?: string;
                          technologies?: string[];
                          achievements?: string;
                        } | undefined : undefined;

                        return (
                          <div
                            key={history.id}
                            style={{
                              borderRadius: '14px',
                              border: '1px solid var(--border)',
                              background: 'var(--bg-base)',
                              padding: '14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                              <div>
                                <p style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {getAiActionLabel(history.action)}
                                </p>
                                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  {formatAiHistoryDate(history.createdAt)}
                                </p>
                              </div>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '5px 10px',
                                  borderRadius: '9999px',
                                  background: history.accepted ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                  color: history.accepted ? '#059669' : '#d97706',
                                }}
                              >
                                {history.accepted ? 'Đã áp dụng' : 'Chưa áp dụng'}
                              </span>
                            </div>

                            {(history.targetJob || history.targetCompany) && (
                              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Target: {history.targetJob || 'N/A'} {history.targetCompany ? `• ${history.targetCompany}` : ''}
                              </p>
                            )}

                            {studentMetadata && (
                              <div style={{ display: 'grid', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {studentMetadata.fieldOfStudy ? <p>Field of study: {studentMetadata.fieldOfStudy}</p> : null}
                                {studentMetadata.itemName ? <p>Item name: {studentMetadata.itemName}</p> : null}
                                {studentMetadata.role ? <p>Role: {studentMetadata.role}</p> : null}
                                {studentMetadata.technologies?.length ? <p>Skills/Tech: {studentMetadata.technologies.join(', ')}</p> : null}
                              </div>
                            )}

                            {history.action === 'atsReview' && atsMetadata && (
                              <div style={{ display: 'grid', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary)' }}>
                                      {typeof atsMetadata.score === 'number' ? atsMetadata.score : '--'}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    Điểm ATS và các góp ý chính từ lần phân tích này.
                                  </p>
                                </div>
                                <AtsList title="Điểm mạnh" items={atsMetadata.strengths || []} tone="success" />
                                <AtsList title="Khoảng trống" items={atsMetadata.gaps || []} tone="danger" />
                                <AtsList title="Từ khóa còn thiếu" items={atsMetadata.keywordsMissing || []} tone="warning" />
                                <AtsList title="Gợi ý cải thiện" items={atsMetadata.recommendations || []} tone="default" />
                              </div>
                            )}

                            {history.action === 'tailorCvForJob' && tailorMetadata && (
                              <div style={{ display: 'grid', gap: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                                  <div>
                                    <p style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                      Summary hiện tại
                                    </p>
                                    <textarea
                                      className="input"
                                      rows={5}
                                      readOnly
                                      value={history.oldText || ''}
                                      style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-card)' }}
                                    />
                                  </div>
                                  <div>
                                    <p style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                      Summary AI đề xuất
                                    </p>
                                    <textarea
                                      className="input"
                                      rows={5}
                                      readOnly
                                      value={history.newText || ''}
                                      style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-card)' }}
                                    />
                                  </div>
                                </div>
                                <AtsList title="Thứ tự skills nên nhấn mạnh" items={tailorMetadata.suggestedSkillsOrder || []} tone="default" />
                                <AtsList title="Keywords còn thiếu" items={tailorMetadata.keywordsMissing || []} tone="warning" />
                                <AtsList title="Khuyến nghị" items={tailorMetadata.recommendations || []} tone="default" />
                                {(tailorMetadata.improvedExperienceBullets || []).length > 0 && (
                                  <div style={{ display: 'grid', gap: '10px' }}>
                                    {(tailorMetadata.improvedExperienceBullets || []).map((item) => (
                                      <div key={`${history.id}-${item.experienceIndex}`} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '12px' }}>
                                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                          Experience #{item.experienceIndex + 1}: {item.role || 'N/A'} {item.company ? `• ${item.company}` : ''}
                                        </p>
                                        <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                          {item.bullets.map((bullet, index) => (
                                            <li key={`${history.id}-${item.experienceIndex}-${index}`}>{bullet}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {history.action !== 'atsReview' && history.action !== 'tailorCvForJob' && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                                <div>
                                  <p style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                    Bản gốc
                                  </p>
                                  <textarea
                                    className="input"
                                    rows={history.action === 'generateSummary' || history.action === 'fresherSummary' ? 5 : 7}
                                    readOnly
                                    value={history.oldText || ''}
                                    style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-card)' }}
                                  />
                                </div>
                                <div>
                                  <p style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                    Bản AI
                                  </p>
                                  <textarea
                                    className="input"
                                    rows={history.action === 'generateSummary' || history.action === 'fresherSummary' ? 5 : 7}
                                    readOnly
                                    value={history.newText || ''}
                                    style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-card)' }}
                                  />
                                </div>
                              </div>
                            )}

                            {history.action === 'rewriteExperience' && !history.accepted && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleApplyRewriteFromHistory(history)}
                                >
                                  Áp dụng lại
                                </button>
                              </div>
                            )}

                            {(history.action === 'generateSummary' || history.action === 'fresherSummary') && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => void handleCopyHistoryText(history.oldText || '', 'Đã sao chép summary cũ.')}
                                >
                                  Copy bản cũ
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => void handleCopyHistoryText(history.newText || '', 'Đã sao chép summary AI.')}
                                >
                                  Copy bản AI
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleApplySummaryFromHistory(history.oldText || '', 'Đã khôi phục summary cũ từ AI History.')}
                                  disabled={!history.oldText}
                                >
                                  Áp dụng bản cũ
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleApplySummaryFromHistory(history.newText || '', 'Đã áp dụng summary AI từ lịch sử.')}
                                  disabled={!history.newText}
                                >
                                  Áp dụng bản AI
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionSection>
                </>
              )}

              {/* Sections tab */}
              {tab === 'sections' && (
                <SectionsPanel
                  order={sections}
                  visibility={visibility}
                  onReorder={updateSectionOrder}
                  onToggle={toggleSectionVisibility}
                />
              )}

              {/* Theme tab */}
              {tab === 'theme' && (
                <ThemePanel
                  theme={cv.theme}
                  templateId={cv.templateId}
                  onUpdate={updateTheme}
                  onChangeTemplate={changeTemplate}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Draggable Divider ── */}
        {!previewMode && (
          <div
            className="resizable-divider"
            onMouseDown={onDividerMouseDown}
            title="Kéo để thay đổi kích thước"
            style={{
              width: '6px',
              flexShrink: 0,
              background: 'var(--border)',
              cursor: 'col-resize',
              position: 'sticky',
              top: '102px',
              height: 'calc(100vh - 102px)',
              transition: 'background 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--primary)';
              const dots = e.currentTarget.querySelector('.drag-dots') as HTMLElement | null;
              if (dots) dots.style.opacity = '1';
            }}
            onMouseLeave={e => {
              if (isDragging.current) return;
              (e.currentTarget as HTMLElement).style.background = 'var(--border)';
              const dots = e.currentTarget.querySelector('.drag-dots') as HTMLElement | null;
              if (dots) dots.style.opacity = '0';
            }}
          >
            {/* Visual drag handle dots */}
            <div
              className="drag-dots"
              style={{
                display: 'flex', flexDirection: 'column', gap: '3px',
                opacity: 0, transition: 'opacity 0.15s', pointerEvents: 'none',
              }}
            >
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'white' }} />
              ))}
            </div>
          </div>
        )}

        {/* Preview Panel */}
      <div className="preview-panel" style={{
          flex: 1,
          overflow: 'auto',
          background: '#e8ecf0',
          padding: '32px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
          <div
            id="cv-preview"
            style={{
              width: '794px', // A4 ~210mm tại 96dpi
              minWidth: '794px',
              background: 'white',
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            }}
          >
            <TemplateRenderer cv={cv} />
          </div>
        </div>
      </div>

      {pendingRewrite && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 85,
          }}
          onClick={handleDiscardPendingRewrite}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '960px',
              borderRadius: '22px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 28px 90px rgba(15, 23, 42, 0.32)',
              padding: '24px',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  So sánh bản gốc và bản AI đề xuất
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {pendingRewrite.role || 'Vị trí chưa đặt tên'}{pendingRewrite.company ? ` tại ${pendingRewrite.company}` : ''}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscardPendingRewrite}>
                Đóng
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div
                style={{
                  borderRadius: '16px',
                  border: '1px solid rgba(148,163,184,0.22)',
                  background: 'rgba(148,163,184,0.06)',
                  padding: '16px',
                }}
              >
                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Bản gốc
                </p>
                <textarea
                  className="input"
                  rows={12}
                  readOnly
                  value={pendingRewrite.oldDescription}
                  style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-base)' }}
                />
              </div>

              <div
                style={{
                  borderRadius: '16px',
                  border: '1px solid rgba(99,102,241,0.24)',
                  background: 'rgba(99,102,241,0.06)',
                  padding: '16px',
                }}
              >
                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Bản AI đề xuất
                </p>
                <textarea
                  className="input"
                  rows={12}
                  readOnly
                  value={pendingRewrite.newDescription}
                  style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-base)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscardPendingRewrite}>
                Giữ bản cũ
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => void handleRegeneratePendingRewrite()}
                disabled={experienceAiLoadingIndex === pendingRewrite.index}
              >
                {experienceAiLoadingIndex === pendingRewrite.index ? 'Đang tạo lại...' : 'Tạo lại'}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyPendingRewrite}>
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingStudentAi && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.62)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 84,
          }}
          onClick={handleDiscardPendingStudentAi}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              borderRadius: '22px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 28px 90px rgba(15, 23, 42, 0.32)',
              padding: '24px',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {getAiActionLabel(pendingStudentAi.action)}
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {pendingStudentAi.targetJob ? `Target: ${pendingStudentAi.targetJob}. ` : ''}
                  {pendingStudentAi.fieldOfStudy ? `Ngành học: ${pendingStudentAi.fieldOfStudy}. ` : ''}
                  {pendingStudentAi.itemName ? `Mục áp dụng: ${pendingStudentAi.itemName}.` : 'Xem lại đề xuất trước khi áp dụng vào CV.'}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscardPendingStudentAi}>
                Đóng
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ borderRadius: '16px', border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(148,163,184,0.06)', padding: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Bản hiện tại
                </p>
                <textarea
                  className="input"
                  rows={12}
                  readOnly
                  value={pendingStudentAi.oldText}
                  style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-base)' }}
                />
              </div>
              <div style={{ borderRadius: '16px', border: '1px solid rgba(34,197,94,0.24)', background: 'rgba(34,197,94,0.06)', padding: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Đề xuất AI
                </p>
                <textarea
                  className="input"
                  rows={12}
                  readOnly
                  value={pendingStudentAi.newText}
                  style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-base)' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.16)', background: 'rgba(99,102,241,0.04)', padding: '16px' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Metadata dùng để tạo đề xuất
              </p>
              <div style={{ display: 'grid', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <p>Vai trò: {pendingStudentAi.role || 'N/A'}</p>
                <p>Công nghệ / kỹ năng: {pendingStudentAi.technologies.join(', ') || 'N/A'}</p>
                <p>Kết quả đạt được: {pendingStudentAi.achievements || 'N/A'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscardPendingStudentAi}>
                Giữ bản hiện tại
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyPendingStudentAi}>
                Áp dụng kết quả
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingTailorCv && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.64)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 84,
          }}
          onClick={handleDiscardPendingTailorCv}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '1080px',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              borderRadius: '22px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 28px 90px rgba(15, 23, 42, 0.32)',
              padding: '24px',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Tailor CV to Job
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Xem trước các đề xuất AI cho summary, bullets kinh nghiệm, keywords còn thiếu và hướng tối ưu CV theo job mục tiêu.
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscardPendingTailorCv}>
                Đóng
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '9999px', border: '1px solid rgba(99,102,241,0.18)', background: 'rgba(99,102,241,0.05)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={pendingTailorCv.applySummary}
                  onChange={(event) => setPendingTailorCv((current) => current ? { ...current, applySummary: event.target.checked } : current)}
                />
                Áp dụng summary đề xuất
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '9999px', border: '1px solid rgba(14,165,233,0.18)', background: 'rgba(14,165,233,0.05)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={pendingTailorCv.applyExperienceBullets}
                  onChange={(event) => setPendingTailorCv((current) => current ? { ...current, applyExperienceBullets: event.target.checked } : current)}
                />
                Áp dụng bullets kinh nghiệm đề xuất
              </label>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ borderRadius: '16px', border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(148,163,184,0.06)', padding: '16px' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Summary hiện tại
                  </p>
                  <textarea
                    className="input"
                    rows={8}
                    readOnly
                    value={cv?.content.summary || ''}
                    style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-base)' }}
                  />
                </div>
                <div style={{ borderRadius: '16px', border: '1px solid rgba(99,102,241,0.24)', background: 'rgba(99,102,241,0.06)', padding: '16px' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Summary đề xuất
                  </p>
                  <textarea
                    className="input"
                    rows={8}
                    readOnly
                    value={pendingTailorCv.improvedSummary}
                    style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-base)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ borderRadius: '16px', border: '1px solid rgba(14,165,233,0.18)', background: 'rgba(14,165,233,0.04)', padding: '16px' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Thứ tự skills nên nhấn mạnh
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {pendingTailorCv.suggestedSkillsOrder.length ? pendingTailorCv.suggestedSkillsOrder.map((skill) => (
                      <span key={skill} style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0369a1', background: 'rgba(14,165,233,0.10)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: '9999px', padding: '6px 10px' }}>
                        {skill}
                      </span>
                    )) : (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Không có gợi ý thứ tự skills cụ thể.</p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  <div style={{ borderRadius: '16px', border: '1px solid rgba(245,158,11,0.18)', background: 'rgba(245,158,11,0.05)', padding: '16px' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                      Keywords còn thiếu
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {pendingTailorCv.keywordsMissing.length ? pendingTailorCv.keywordsMissing.map((item, index) => (
                        <li key={`keyword-${index}`}>{item}</li>
                      )) : <li>Không có keyword thiếu nổi bật.</li>}
                    </ul>
                  </div>

                  <div style={{ borderRadius: '16px', border: '1px solid rgba(99,102,241,0.18)', background: 'rgba(99,102,241,0.05)', padding: '16px' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                      Recommendations
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {pendingTailorCv.recommendations.length ? pendingTailorCv.recommendations.map((item, index) => (
                        <li key={`recommendation-${index}`}>{item}</li>
                      )) : <li>Không có khuyến nghị bổ sung.</li>}
                    </ul>
                  </div>
                </div>

                <div style={{ borderRadius: '16px', border: '1px solid rgba(16,185,129,0.18)', background: 'rgba(16,185,129,0.04)', padding: '16px' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Bullets kinh nghiệm đề xuất
                  </p>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {pendingTailorCv.improvedExperienceBullets.length ? pendingTailorCv.improvedExperienceBullets.map((item) => (
                      <div key={`tailor-exp-${item.experienceIndex}`} style={{ borderRadius: '12px', border: '1px solid rgba(16,185,129,0.16)', background: 'var(--bg-base)', padding: '12px' }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                          Experience #{item.experienceIndex + 1}: {item.role || 'N/A'} {item.company ? `• ${item.company}` : ''}
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {item.bullets.map((bullet, index) => (
                            <li key={`tailor-exp-${item.experienceIndex}-${index}`}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    )) : (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Không có bullets kinh nghiệm cần điều chỉnh.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscardPendingTailorCv}>
                Giữ bản hiện tại
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyPendingTailorCv}>
                Áp dụng đề xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {aiPrompt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.56)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 80,
          }}
          onClick={() => setAiPrompt(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              borderRadius: '20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)',
              padding: '24px',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {aiPrompt.title}
              </p>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {aiPrompt.message}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAiPrompt(null)}>
                Để sau
              </button>
              <Link href={aiPrompt.ctaHref} className="btn btn-primary btn-sm" onClick={() => setAiPrompt(null)}>
                {aiPrompt.ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 1024px) {
          .editor-layout {
            flex-direction: column;
          }
          .editor-layout.form-active .form-panel {
            width: 100% !important;
            max-width: 100vw !important;
            position: static !important;
            height: auto !important;
          }
          .editor-layout.form-active .resizable-divider {
            display: none !important;
          }
          .editor-layout.form-active .preview-panel {
            display: none !important;
          }
          
          .editor-layout.preview-active .preview-panel {
            width: 100% !important;
            padding: 16px !important;
            display: flex !important;
          }
          
          #cv-preview {
            transform: scale(0.9);
            transform-origin: top center;
          }
        }
        @media (max-width: 768px) {
          #cv-preview {
            transform: scale(0.42);
          }
          .editor-layout.preview-active .preview-panel {
            padding: 8px !important;
          }
        }
      `}</style>
    </>
  );
}

// ─── Inline Mini-Forms ─────────────────────────────────────────
function LanguagesForm({ data, onChange }: { data: {name:string;level:string}[]; onChange: (d: {name:string;level:string}[]) => void }) {
  const add = () => onChange([...data, { name: '', level: '' }]);
  const update = (i: number, field: 'name'|'level', val: string) => { const list = [...data]; list[i] = {...list[i], [field]: val}; onChange(list); };
  const remove = (i: number) => onChange(data.filter((_,j)=>j!==i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((lang, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
          <input className="input" placeholder="Tiếng Anh" value={lang.name} onChange={e => update(i,'name',e.target.value)} />
          <select className="input" value={lang.level} onChange={e => update(i,'level',e.target.value)}>
            <option value="">-- Trình độ --</option>
            <option>Sơ cấp (A1)</option>
            <option>Cơ bản (A2)</option>
            <option>Trung cấp (B1)</option>
            <option>Khá (B2)</option>
            <option>Nâng cao (C1)</option>
            <option>Thành thạo (C2)</option>
            <option>Bản ngữ</option>
            <option>IELTS 6.0+</option>
            <option>TOEIC 700+</option>
          </select>
          <button onClick={() => remove(i)} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:'8px', padding:'8px', cursor:'pointer', color:'#ef4444' }}>✕</button>
        </div>
      ))}
      <button onClick={add} className="btn btn-outline btn-sm" style={{ justifyContent: 'center', borderStyle: 'dashed' }}>+ Thêm ngoại ngữ</button>
    </div>
  );
}

function InterestsForm({ data, onChange }: { data: string[]; onChange: (d: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => { if (input.trim() && !data.includes(input.trim())) { onChange([...data, input.trim()]); setInput(''); }};
  const PRESETS = ['Đọc sách', 'Du lịch', 'Âm nhạc', 'Thể thao', 'Nấu ăn', 'Chụp ảnh', 'Gaming', 'Thiết kế', 'Viết lách'];
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        {PRESETS.map(p => {
          const added = data.includes(p);
          return <button key={p} onClick={() => added ? onChange(data.filter(x=>x!==p)) : onChange([...data,p])}
            style={{ fontSize:'0.78rem', fontWeight:600, padding:'4px 10px', borderRadius:'9999px', background: added?'var(--primary)':'var(--bg-base)', color: added?'white':'var(--text-secondary)', border:`1px solid ${added?'var(--primary)':'var(--border)'}`, cursor:'pointer' }}>
            {added ? '✓ ' : '+ '}{p}</button>;
        })}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input className="input" placeholder="Sở thích khác..." value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>{if(e.key==='Enter'){e.preventDefault();add();}}} style={{ flex:1 }} />
        <button onClick={add} className="btn btn-secondary btn-sm">Thêm</button>
      </div>
      {data.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {data.map(d => (
            <span key={d} style={{ background:'rgba(99,102,241,0.1)', color:'var(--primary)', padding:'4px 10px', borderRadius:'9999px', fontSize:'0.82rem', fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}>
              {d}
              <button onClick={()=>onChange(data.filter(x=>x!==d))} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', padding:0, display:'flex', alignItems:'center' }}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AtsList({ title, items, tone }: { title: string; items: string[]; tone: 'success' | 'warning' | 'danger' | 'default' }) {
  if (!items.length) return null;

  const styles = {
    success: { border: 'rgba(16,185,129,0.2)', bg: 'rgba(16,185,129,0.05)', color: '#059669' },
    warning: { border: 'rgba(245,158,11,0.2)', bg: 'rgba(245,158,11,0.05)', color: '#d97706' },
    danger: { border: 'rgba(239,68,68,0.2)', bg: 'rgba(239,68,68,0.05)', color: '#dc2626' },
    default: { border: 'rgba(99,102,241,0.16)', bg: 'rgba(99,102,241,0.05)', color: 'var(--primary)' },
  }[tone];

  return (
    <div style={{ border: `1px solid ${styles.border}`, background: styles.bg, borderRadius: '10px', padding: '10px 12px' }}>
      <p style={{ fontWeight: 700, fontSize: '0.78rem', color: styles.color, marginBottom: '8px' }}>{title}</p>
      <div style={{ display: 'grid', gap: '6px' }}>
        {items.map(item => (
          <p key={item} style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            - {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function LoadingEditor() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
      <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Đang tải CV...</p>
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

