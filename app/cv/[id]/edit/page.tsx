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
import type { AtsReviewResponse } from '@/lib/atsReview';
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
      ? 'Rewrite kinh nghiÃ¡Â»â€¡m'
      : action === 'atsReview'
        ? 'ATS review'
        : 'Cover letter';
};

const AI_HISTORY_FILTERS: { key: AiHistoryFilter; label: string }[] = [
  { key: 'all', label: 'TÃ¡ÂºÂ¥t cÃ¡ÂºÂ£' },
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
  rewriteExperience: 'Rewrite kinh nghiá»‡m',
  atsReview: 'ATS review',
  generateCoverLetter: 'Cover letter',
  generateProjectBullets: 'Project Bullets',
  convertActivitiesToCvBullets: 'Activities to CV Bullets',
};

const AI_HISTORY_ACTION_LABELS: Partial<Record<CvAiHistoryAction, string>> = {
  generateSummary: 'Summary AI',
  fresherSummary: 'Fresher Summary',
  rewriteExperience: 'Rewrite kinh nghiá»‡m',
  atsReview: 'ATS review',
  generateCoverLetter: 'Cover letter',
  generateProjectBullets: 'Project Bullets',
  convertActivitiesToCvBullets: 'Activities to CV Bullets',
};

const SECTION_LABELS_VI: Partial<Record<CVSection, string>> = {
  personalInfo: 'ðŸ‘¤ ThÃ´ng tin cÃ¡ nhÃ¢n',
  summary: 'ðŸ“ Giá»›i thiá»‡u báº£n thÃ¢n',
  experience: 'ðŸ’¼ Kinh nghiá»‡m',
  education: 'ðŸŽ“ Há»c váº¥n',
  skills: 'âš¡ Ká»¹ nÄƒng',
  projects: 'ðŸš€ Dá»± Ã¡n',
  certificates: 'ðŸ“œ Chá»©ng chá»‰',
  activities: 'ðŸ† Hoáº¡t Ä‘á»™ng',
  interests: 'â¤ï¸ Sá»Ÿ thÃ­ch',
  languages: 'ðŸŒ Ngoáº¡i ngá»¯',
};

// â”€â”€â”€ Accordion Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Main Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const [coverLetterTone, setCoverLetterTone] = useState<'professional' | 'friendly' | 'concise'>('professional');
  const [coverLetterDraft, setCoverLetterDraft] = useState('');
  const [atsReview, setAtsReview] = useState<AtsReviewResponse | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // â”€â”€ Resizable panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        throw new Error(result.message || result.error || 'KhÃ´ng thá»ƒ táº£i tráº¡ng thÃ¡i AI.');
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
        throw new Error(result.message || result.error || 'KhÃ´ng thá»ƒ táº£i tráº¡ng thÃ¡i quota.');
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
  const canGenerateSummary = !aiStatusLoading && allowedActions.has('generateSummary');
  const canGenerateFresherSummary = !aiStatusLoading && allowedActions.has('fresherSummary');
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
      toast.success('ÄÃ£ lÆ°u CV!');
      setSaved(true);
    } catch { toast.error('LÆ°u tháº¥t báº¡i'); }
    setSaving(false);
  };

  const toggleLanguage = () => {
    updateCvState(prev => ({ ...prev, language: prev.language === 'vi' ? 'en' : 'vi' }));
  };

  const openUpgradePrompt = useCallback((message?: string) => {
    setAiPrompt({
      title: 'Má»Ÿ khÃ³a AI Premium',
      message: message || 'TÃ­nh nÄƒng AI nÃ y chá»‰ cÃ³ trong gÃ³i Premium. NÃ¢ng cáº¥p Ä‘á»ƒ dÃ¹ng rewrite kinh nghiá»‡m, ATS review vÃ  cover letter.',
      ctaLabel: 'Xem gÃ³i Premium',
      ctaHref: '/pricing',
    });
  }, []);

  const openQuotaPrompt = useCallback((message?: string) => {
    setAiPrompt({
      title: 'ÄÃ£ háº¿t lÆ°á»£t AI miá»…n phÃ­ hÃ´m nay',
      message: message || 'Báº¡n Ä‘Ã£ dÃ¹ng háº¿t quota AI cá»§a gÃ³i Free. NÃ¢ng cáº¥p Premium Ä‘á»ƒ tiáº¿p tá»¥c dÃ¹ng ngay.',
      ctaLabel: 'NÃ¢ng cáº¥p Ä‘á»ƒ dÃ¹ng tiáº¿p',
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

    if (message.includes('miá»…n phÃ­ hÃ´m nay') || message.includes('dÃ¹ng háº¿t 3 lÆ°á»£t AI')) {
      openQuotaPrompt(message);
      return;
    }

    if (message.includes('Premium') || message.includes('credit')) {
      openUpgradePrompt(message);
      return;
    }

    toast.error(message);
  }, [isHandledAiError, openQuotaPrompt, openUpgradePrompt]);

  const callCvAi = useCallback(async (payload: Record<string, unknown>) => {
    if (!firebaseUser) {
      throw new Error('Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ dÃ¹ng AI.');
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
        throw new Error(result.message || 'Thiáº¿u há»“ sÆ¡ ngÆ°á»i dÃ¹ng trong Firestore. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i Ä‘á»ƒ há»‡ thá»‘ng tá»± Ä‘á»“ng bá»™.');
      }

      if (result?.error === 'ATS_INVALID_FORMAT') {
        const error = new Error(result.message || 'AI tráº£ vá» Ä‘á»‹nh dáº¡ng ATS khÃ´ng há»£p lá»‡. Vui lÃ²ng thá»­ láº¡i.') as Error & { code?: string };
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
        const error = new Error(result.message || 'AI tráº£ vá» Ä‘á»‹nh dáº¡ng khÃ´ng há»£p lá»‡. Vui lÃ²ng thá»­ láº¡i.') as Error & { code?: string };
        error.code = result.error;
        throw error;
      }

      if ((response.status === 402 || response.status === 403) && result?.upgradeRequired) {
        openUpgradePrompt(result.message);
        const error = new Error(result.message || 'Báº¡n cáº§n nÃ¢ng cáº¥p Premium hoáº·c náº¡p thÃªm credit Ä‘á»ƒ sá»­ dá»¥ng tÃ­nh nÄƒng nÃ y.') as Error & { handled?: boolean };
        error.handled = true;
        throw error;
      }

      if (response.status === 429) {
        setAiStatus((current) => current ? { ...current, remainingToday: 0 } : current);
        setFreeAiRemaining(0);
        openQuotaPrompt(result.message);
        const error = new Error(result.message || 'Báº¡n Ä‘Ã£ dÃ¹ng háº¿t quota AI hÃ´m nay.') as Error & { handled?: boolean };
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
      review?: AtsReviewResponse;
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
        openQuotaPrompt('Báº¡n Ä‘Ã£ dÃ¹ng háº¿t lÆ°á»£t AI miá»…n phÃ­ hÃ´m nay. NÃ¢ng cáº¥p Premium Ä‘á»ƒ tiáº¿p tá»¥c dÃ¹ng summary ngay.');
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
      toast.success(user?.plan === 'premium' ? 'AI Ä‘Ã£ viáº¿t láº¡i summary.' : 'ÄÃ£ táº¡o summary báº±ng AI.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ táº¡o summary báº±ng AI.');
    } finally {
      setSummaryAiLoading(false);
    }
  }, [aiPlan, callCvAi, canGenerateSummary, createAiHistorySafely, cv, openQuotaPrompt, openUpgradePrompt, remainingToday, updateSummary, upgradeRequiredActions, user?.plan]);

  const handleRewriteExperience = useCallback(async (index: number) => {
    if (!cv) return;

    if (!canRewriteExperience) {
      handleAiRequestError(new Error('AI rewrite kinh nghiá»‡m hiá»‡n chá»‰ cÃ³ trong gÃ³i Premium.'), 'TÃ­nh nÄƒng nÃ y cáº§n gÃ³i Premium.');
      return;
    }

    const selected = cv.content.experience?.[index];
    if (!selected?.description?.trim()) {
      toast.error('HÃ£y nháº­p mÃ´ táº£ kinh nghiá»‡m trÆ°á»›c khi dÃ¹ng AI.');
      return;
    }

    if (!cv.jobDescription?.trim()) {
      toast('ChÆ°a cÃ³ mÃ´ táº£ cÃ´ng viá»‡c. AI váº«n rewrite Ä‘Æ°á»£c, nhÆ°ng káº¿t quáº£ sáº½ Ã­t cÃ¡ nhÃ¢n hÃ³a hÆ¡n.');
    }

    setExperienceAiLoadingIndex(index);
    try {
      const result = await callCvAi({
        action: 'rewriteExperience',
        cvId: cv.cvId,
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
      toast.success('AI Ä‘Ã£ táº¡o báº£n rewrite Ä‘á» xuáº¥t. HÃ£y xem láº¡i trÆ°á»›c khi Ã¡p dá»¥ng.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ viáº¿t láº¡i mÃ´ táº£.');
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
    toast.success('ÄÃ£ Ã¡p dá»¥ng báº£n rewrite AI vÃ o mÃ´ táº£ kinh nghiá»‡m.');
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
      handleAiRequestError(new Error('Tailor CV to Job hiá»‡n chá»‰ cÃ³ trong gÃ³i Premium.'), 'TÃ­nh nÄƒng nÃ y cáº§n gÃ³i Premium.');
      return;
    }

    if (!cv.jobDescription?.trim() || cv.jobDescription.trim().length < 50) {
      toast.error('Vui lÃ²ng nháº­p mÃ´ táº£ cÃ´ng viá»‡c Ä‘á»ƒ AI tá»‘i Æ°u CV chÃ­nh xÃ¡c hÆ¡n.');
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
        throw new Error('AI chÆ°a tráº£ vá» gá»£i Ã½ Tailor CV há»£p lá»‡.');
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
      toast.success('AI Ä‘Ã£ táº¡o Ä‘á» xuáº¥t Tailor CV. Báº¡n hÃ£y xem láº¡i trÆ°á»›c khi Ã¡p dá»¥ng.');
    } catch (error) {
      if (error instanceof Error && (error as Error & { code?: string }).code === 'TAILOR_INVALID_FORMAT') {
        toast.error(error.message || 'AI tráº£ vá» Ä‘á»‹nh dáº¡ng Tailor CV khÃ´ng há»£p lá»‡. Vui lÃ²ng thá»­ láº¡i.');
        return;
      }
      toast.error(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ táº¡o Ä‘á» xuáº¥t Tailor CV.');
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
      toast.error('HÃ£y chá»n Ã­t nháº¥t má»™t pháº§n Ä‘á»ƒ Ã¡p dá»¥ng.');
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
    toast.success('ÄÃ£ Ã¡p dá»¥ng cÃ¡c Ä‘á» xuáº¥t Tailor CV Ä‘Ã£ chá»n.');
  }, [applyTailoredExperienceBullets, pendingTailorCv, updateAiHistorySafely, updateSummary]);

  const handleRunStudentAi = useCallback(async (action: StudentAiAction) => {
    if (!cv) return;

    if (action === 'fresherSummary' && !canGenerateFresherSummary) {
      if (aiPlan === 'free' && (remainingToday ?? 0) <= 0) {
        openQuotaPrompt('BÃ¡ÂºÂ¡n Ã„â€˜ÃƒÂ£ dÃƒÂ¹ng hÃ¡ÂºÂ¿t lÃ†Â°Ã¡Â»Â£t AI miÃ¡Â»â€¦n phÃƒÂ­ hÃƒÂ´m nay. NÃƒÂ¢ng cÃ¡ÂºÂ¥p Premium Ã„â€˜Ã¡Â»Æ’ tiÃ¡ÂºÂ¿p tÃ¡Â»Â¥c dÃƒÂ¹ng fresher summary.');
      } else {
        toast.error('KhÃƒÂ´ng thÃ¡Â»Æ’ dÃƒÂ¹ng Fresher Summary lÃƒÂºc nÃƒÂ y.');
      }
      return;
    }

    if (action === 'generateProjectBullets' && !canGenerateProjectBullets) {
      handleAiRequestError(new Error('Project Bullets hiÃ¡Â»â€¡n chÃ¡Â»â€° cÃƒÂ³ trong gÃƒÂ³i Premium.'), 'TÃƒÂ­nh nÃ„Æ’ng nÃƒÂ y cÃ¡ÂºÂ§n gÃƒÂ³i Premium.');
      return;
    }

    if (action === 'convertActivitiesToCvBullets' && !canConvertActivitiesToCvBullets) {
      handleAiRequestError(new Error('Activities to CV Bullets hiÃ¡Â»â€¡n chÃ¡Â»â€° cÃƒÂ³ trong gÃƒÂ³i Premium.'), 'TÃƒÂ­nh nÃ„Æ’ng nÃƒÂ y cÃ¡ÂºÂ§n gÃƒÂ³i Premium.');
      return;
    }

    const technologies = normalizeStudentTechnologies(studentAiForm.technologies);
    if (action !== 'fresherSummary' && !studentAiForm.itemName.trim()) {
      toast.error('HÃƒÂ£y nhÃ¡ÂºÂ­p tÃƒÂªn Ã„â€˜Ã¡Â»â€œ ÃƒÂ¡n hoÃ¡ÂºÂ·c hoÃ¡ÂºÂ¡t Ã„â€˜Ã¡Â»â„¢ng trÃ†Â°Ã¡Â»â€ºc khi dÃƒÂ¹ng AI.');
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
        throw new Error('AI chÃ†Â°a trÃ¡ÂºÂ£ vÃ¡Â»Â nÃ¡Â»â„¢i dung phÃƒÂ¹ hÃ¡Â»Â£p Ã„â€˜Ã¡Â»Æ’ ÃƒÂ¡p dÃ¡Â»Â¥ng.');
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

      toast.success('AI Ã„â€˜ÃƒÂ£ tÃ¡ÂºÂ¡o bÃ¡ÂºÂ£n Ã„â€˜Ã¡Â»Â xuÃ¡ÂºÂ¥t. HÃƒÂ£y xem lÃ¡ÂºÂ¡i trÃ†Â°Ã¡Â»â€ºc khi ÃƒÂ¡p dÃ¡Â»Â¥ng.');
    } catch (error) {
      const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined;
      if (
        code === 'FRESHER_SUMMARY_INVALID_FORMAT'
        || code === 'PROJECT_BULLETS_INVALID_FORMAT'
        || code === 'ACTIVITY_BULLETS_INVALID_FORMAT'
      ) {
        toast.error(error instanceof Error ? error.message : 'AI trÃ¡ÂºÂ£ vÃ¡Â»Â Ã„â€˜Ã¡Â»â€¹nh dÃ¡ÂºÂ¡ng khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡.');
        return;
      }

      toast.error(error instanceof Error ? error.message : 'KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ¡o nÃ¡Â»â„¢i dung AI cho sinh viÃƒÂªn/Fresher.');
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
    toast.success('Ã„ÂÃƒÂ£ ÃƒÂ¡p dÃ¡Â»Â¥ng nÃ¡Â»â„¢i dung AI vÃƒÂ o CV.');
  }, [applyActivityBullets, applyProjectBullets, pendingStudentAi, updateAiHistorySafely, updateSummary]);

  const handleAtsReview = useCallback(async () => {
    if (!cv) return;

    if (!canRunAtsReview) {
      handleAiRequestError(new Error('ATS review hiá»‡n chá»‰ cÃ³ trong gÃ³i Premium.'), 'TÃ­nh nÄƒng nÃ y cáº§n gÃ³i Premium.');
      return;
    }

    if (!cv.targetJob?.trim() || !cv.targetCompany?.trim() || !cv.jobDescription?.trim()) {
      toast.error('Hay nhap day du vi tri ung tuyen, cong ty muc tieu va JD truoc khi phan tich CV.');
      return;
    }

    setAtsLoading(true);
    try {
      const result = await callCvAi({
        action: 'atsReview',
        cvId: cv.cvId,
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
            matchScore: result.review.matchScore,
            missingKeywords: result.review.missingKeywords,
            matchedKeywords: result.review.matchedKeywords,
            weakSections: result.review.weakSections,
            improvementSuggestions: result.review.improvementSuggestions,
            suggestedSummary: result.review.suggestedSummary,
            suggestedExperienceBullets: result.review.suggestedExperienceBullets,
          },
        });
        toast.success('ÄÃ£ phÃ¢n tÃ­ch ATS cho CV nÃ y.');
      }
    } catch (error) {
      if (error instanceof Error && (error as Error & { code?: string }).code === 'ATS_INVALID_FORMAT') {
        toast.error(error.message || 'AI tráº£ vá» Ä‘á»‹nh dáº¡ng ATS khÃ´ng há»£p lá»‡. Vui lÃ²ng thá»­ láº¡i.');
        return;
      }
      toast.error(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ phÃ¢n tÃ­ch ATS.');
    } finally {
      setAtsLoading(false);
    }
  }, [callCvAi, canRunAtsReview, createAiHistorySafely, cv, handleAiRequestError]);

  const handleGenerateCoverLetter = useCallback(async () => {
    if (!cv) return;

    if (!canGenerateCoverLetter) {
      handleAiRequestError(new Error('Cover letter AI hiá»‡n chá»‰ cÃ³ trong gÃ³i Premium.'), 'TÃ­nh nÄƒng nÃ y cáº§n gÃ³i Premium.');
      return;
    }

    if (!cv.targetJob?.trim() || !cv.targetCompany?.trim() || !cv.jobDescription?.trim()) {
      toast.error('Hay nhap day du vi tri ung tuyen, cong ty muc tieu va JD truoc khi tao cover letter.');
      return;
    }

    setCoverLetterLoading(true);
    try {
      const result = await callCvAi({
        action: 'generateCoverLetter',
        cvId: cv.cvId,
        language: cv.language,
        recipientName,
        tone: coverLetterTone,
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
      toast.success('ÄÃ£ táº¡o cover letter báº±ng AI.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ táº¡o cover letter.');
    } finally {
      setCoverLetterLoading(false);
    }
  }, [callCvAi, canGenerateCoverLetter, coverLetterTone, cv, handleAiRequestError, recipientName]);

  const handleSaveCoverLetter = useCallback(async () => {
    if (!firebaseUser || !coverLetterDraft.trim() || !cv) return;

    setCoverLetterSaving(true);
    try {
      await createCoverLetter(firebaseUser.uid, {
        title: `Cover Letter - ${cv.targetJob || cv.title}`,
        cvId: cv.cvId,
        recipientName: recipientName || undefined,
        companyName: cv.targetCompany || undefined,
        jobTitle: cv.targetJob || undefined,
        tone: coverLetterTone,
        content: coverLetterDraft,
        templateId: 'classic',
      });
      toast.success('ÄÃ£ lÆ°u cover letter vÃ o tÃ i khoáº£n.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ lÆ°u cover letter.');
    } finally {
      setCoverLetterSaving(false);
    }
  }, [coverLetterDraft, coverLetterTone, cv, firebaseUser, recipientName]);

  const handleDownloadCoverLetter = useCallback(() => {
    if (!coverLetterDraft.trim() || !cv) {
      toast.error('ChÆ°a cÃ³ cover letter Ä‘á»ƒ táº£i xuá»‘ng.');
      return;
    }

    const blob = new Blob([coverLetterDraft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (cv.targetJob || cv.title || 'cover-letter').replace(/[^\w-]+/g, '-').toLowerCase();
    link.href = url;
    link.download = `${safeTitle}-cover-letter.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('ÄÃ£ táº£i xuá»‘ng cover letter.');
  }, [coverLetterDraft, cv]);

  const handleApplyAtsSuggestions = useCallback(() => {
    if (!atsReview || !cv) return;

    if (!atsReview.suggestedSummary.trim() && atsReview.suggestedExperienceBullets.length === 0) {
      toast.error('ChÆ°a cÃ³ gá»£i Ã½ ATS Ä‘á»ƒ Ã¡p dá»¥ng.');
      return;
    }

    if (atsReview.suggestedSummary.trim()) {
      updateSummary(atsReview.suggestedSummary.trim());
    }

    if (atsReview.suggestedExperienceBullets.length > 0 && cv.content.experience.length > 0) {
      applyRewriteToExperience(0, atsReview.suggestedExperienceBullets.join('\n'));
    }

    toast.success('ÄÃ£ Ã¡p dá»¥ng gá»£i Ã½ ATS vÃ o CV hiá»‡n táº¡i.');
  }, [applyRewriteToExperience, atsReview, cv, updateSummary]);

  const handleCopyHistoryText = useCallback(async (text: string, successMessage: string) => {
    if (!text.trim()) {
      toast.error('KhÃ´ng cÃ³ ná»™i dung Ä‘á»ƒ sao chÃ©p.');
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
      toast.error('KhÃ´ng tÃ¬m tháº¥y vá»‹ trÃ­ kinh nghiá»‡m Ä‘á»ƒ Ã¡p dá»¥ng láº¡i.');
      return;
    }

    applyRewriteToExperience(experienceIndex, history.newText || '');
    void updateAiHistorySafely(history.id, { accepted: true });
    toast.success('ÄÃ£ Ã¡p dá»¥ng láº¡i báº£n rewrite tá»« lá»‹ch sá»­ AI.');
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
      : 'ChÆ°a cÃ³ thá»i gian';
  };

  return (
    <>
      <MobileEditorWarning storageKey="cv-editor-mobile-warning" />
      {/* â”€â”€ Toolbar cá»‘ Ä‘á»‹nh â”€â”€ */}
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
              {saved ? <span style={{ color: '#10b981' }}>âœ“ ÄÃ£ lÆ°u</span> : 'Tá»± Ä‘á»™ng lÆ°u...'}
            </p>
          </div>
          <div
            style={{
              display: 'none', // hide quota here on small screens to save space
            }}
            title="Quota hiá»‡n táº¡i cá»§a tÃ i khoáº£n"
          >
            {aiStatusLoading
              ? 'Äang táº£i quota...'
              : `AI ${aiLimit === null ? 'âˆž' : `${aiUsedToday}/${aiLimit}`} â€¢ CV ${cvLimit === null ? cvCount : `${cvCount}/${cvLimit}`}`}
          </div>

          <button
            onClick={() => {
              updateMeta('isPublic', !cv.isPublic);
              toast.success(!cv.isPublic ? 'ÄÃ£ Ä‘á»•i sang cháº¿ Ä‘á»™ CÃ´ng Khai' : 'ÄÃ£ Ä‘á»•i sang cháº¿ Ä‘á»™ RiÃªng TÆ°');
            }}
            className="btn btn-ghost btn-sm"
            title={cv.isPublic ? "Äang chia sáº» cÃ´ng khai" : "Äang á»Ÿ cháº¿ Ä‘á»™ riÃªng tÆ°"}
            style={{ flexShrink: 0, color: cv.isPublic ? '#10b981' : 'inherit' }}
          >
            <Globe size={14} />
            <span style={{ fontSize: '0.75rem', display: 'none' }} className="hidden sm:inline">
              {cv.isPublic ? 'Public' : 'Private'}
            </span>
          </button>

          {/* Language toggle */}
          <button onClick={toggleLanguage} className="btn btn-ghost btn-sm" title="Äá»•i ngÃ´n ngá»¯ CV" style={{ flexShrink: 0 }}>
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
              {previewMode ? 'Chá»‰nh sá»­a' : 'Xem trÆ°á»›c'}
            </span>
          </button>

          <ExportButton cvTitle={cv.title} printPath={`/cv/${cv.cvId}/print`} cvId={cv.cvId} watermarkRemoved={cv.watermarkRemoved} />

          <button
            onClick={handleManualSave}
            disabled={saving}
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0 }}
          >
            {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            <span style={{ display: 'none' }} className="hidden sm:inline">LÆ°u</span>
          </button>
        </div>

        {/* Tab Bar */}
        {!previewMode && (
          <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
            {([
              { key: 'content', icon: <ChevronRight size={14} />, label: 'Ná»™i dung' },
              { key: 'sections', icon: <ListOrdered size={14} />, label: 'Má»¥c CV' },
              { key: 'theme', icon: <Palette size={14} />, label: 'Giao diá»‡n' },
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

      {/* â”€â”€ Layout Editor â”€â”€ */}
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
                                  Vá»‹ trÃ­ á»©ng tuyá»ƒn
                                </label>
                                <input className="input" placeholder="VÃ­ dá»¥: Frontend Developer" value={cv.targetJob || ''} onChange={e => updateMeta('targetJob', e.target.value)} />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                  CÃ´ng ty má»¥c tiÃªu
                                </label>
                                <input className="input" placeholder="VÃ­ dá»¥: Google" value={cv.targetCompany || ''} onChange={e => updateMeta('targetCompany', e.target.value)} />
                              </div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                MÃ´ táº£ cÃ´ng viá»‡c / Job Description
                              </label>
                              <textarea
                                className="input"
                                rows={5}
                                placeholder="DÃ¡n JD á»Ÿ Ä‘Ã¢y Ä‘á»ƒ ATS review, AI rewrite vÃ  cover letter bÃ¡m sÃ¡t Ä‘Ãºng yÃªu cáº§u tuyá»ƒn dá»¥ng."
                                value={cv.jobDescription || ''}
                                onChange={e => updateMeta('jobDescription', e.target.value)}
                                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                              />
                            </div>
                            <div style={{ marginBottom: '12px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.16)', background: 'rgba(99,102,241,0.04)', padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    Tráº¡ng thÃ¡i AI hiá»‡n táº¡i
                                  </p>
                                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                    GÃ³i hiá»‡n táº¡i: <strong>{aiPlan === 'premium' ? 'Premium' : 'Free'}</strong>
                                    {aiPlan === 'free' ? ` â€¢ CÃ²n ${remainingToday ?? FREE_AI_DAILY_LIMIT} lÆ°á»£t hÃ´m nay` : ' â€¢ KhÃ´ng giá»›i háº¡n lÆ°á»£t theo ngÃ y'}
                                  </p>
                                </div>
                                {aiPlan === 'free' && (
                                  <Link href="/pricing" className="btn btn-ghost btn-sm">
                                    NÃ¢ng cáº¥p Premium
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
                                      {label} {enabled ? 'â€¢ Äang má»Ÿ' : 'â€¢ Premium'}
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
                                      ? 'Táº¡o summary sÃ¡t má»¥c tiÃªu á»©ng tuyá»ƒn hÆ¡n vÃ  Æ°u tiÃªn ngÃ´n ngá»¯ tuyá»ƒn dá»¥ng.'
                                      : `Miá»…n phÃ­: ${FREE_AI_DAILY_LIMIT} lÆ°á»£t/ngÃ y cho summary cÆ¡ báº£n. Cáº§n nhiá»u hÆ¡n hoáº·c muá»‘n rewrite kinh nghiá»‡m thÃ¬ nÃ¢ng cáº¥p Premium.`}
                                  </p>
                                  {aiPlan === 'free' && (
                                    <p style={{ marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                      LÆ°á»£t cÃ²n láº¡i hÃ´m nay: {remainingToday ?? FREE_AI_DAILY_LIMIT}
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
                                    {aiStatusLoading ? 'Äang kiá»ƒm tra quyá»n...' : summaryAiLoading ? 'AI Ä‘ang viáº¿t...' : aiPlan === 'free' && (remainingToday ?? 0) <= 0 ? 'Háº¿t lÆ°á»£t hÃ´m nay' : 'Táº¡o summary báº±ng AI'}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div style={{ marginBottom: '12px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.05)', padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    AI cho sinh viÃªn/Fresher
                                  </p>
                                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    Há»— trá»£ viáº¿t summary cho ngÆ°á»i Ã­t kinh nghiá»‡m, chuyá»ƒn Ä‘á»“ Ã¡n thÃ nh bullet CV, hoáº·c biáº¿n hoáº¡t Ä‘á»™ng/CLB/part-time thÃ nh mÃ´ táº£ chuyÃªn nghiá»‡p hÆ¡n.
                                  </p>
                                </div>
                                {aiPlan === 'free' && (
                                  <Link href="/pricing" className="btn btn-ghost btn-sm">
                                    Má»Ÿ khÃ³a tools Premium
                                  </Link>
                                )}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Vá»‹ trÃ­ muá»‘n á»©ng tuyá»ƒn
                                  </label>
                                  <input
                                    className="input"
                                    placeholder="VÃ­ dá»¥: Frontend Developer Intern"
                                    value={studentAiForm.targetJob}
                                    onChange={(e) => setStudentAiForm((current) => ({ ...current, targetJob: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    NgÃ nh há»c / ChuyÃªn ngÃ nh
                                  </label>
                                  <input
                                    className="input"
                                    placeholder="VÃ­ dá»¥: CÃ´ng nghá»‡ thÃ´ng tin"
                                    value={studentAiForm.fieldOfStudy}
                                    onChange={(e) => setStudentAiForm((current) => ({ ...current, fieldOfStudy: e.target.value }))}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'grid', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    TÃªn Ä‘á»“ Ã¡n / hoáº¡t Ä‘á»™ng
                                  </label>
                                  <input
                                    className="input"
                                    placeholder="VÃ­ dá»¥: Äá»“ Ã¡n quáº£n lÃ½ thÆ° viá»‡n / CLB Truyá»n thÃ´ng"
                                    value={studentAiForm.itemName}
                                    onChange={(e) => setStudentAiForm((current) => ({ ...current, itemName: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Vai trÃ²
                                  </label>
                                  <input
                                    className="input"
                                    placeholder="VÃ­ dá»¥: Team member / Project lead / Part-time staff"
                                    value={studentAiForm.role}
                                    onChange={(e) => setStudentAiForm((current) => ({ ...current, role: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    CÃ´ng nghá»‡ / ká»¹ nÄƒng Ä‘Ã£ dÃ¹ng
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
                                    Káº¿t quáº£ Ä‘áº¡t Ä‘Æ°á»£c náº¿u cÃ³
                                  </label>
                                  <textarea
                                    className="input"
                                    rows={3}
                                    placeholder="VÃ­ dá»¥: HoÃ n thÃ nh MVP, há»— trá»£ triá»ƒn khai demo, phá»‘i há»£p tá»• chá»©c sá»± kiá»‡n..."
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
                                  {studentAiLoadingAction === 'fresherSummary' ? 'AI Ä‘ang viáº¿t...' : 'Fresher Summary'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  disabled={studentAiLoadingAction === 'generateProjectBullets' || !canGenerateProjectBullets}
                                  onClick={() => void handleRunStudentAi('generateProjectBullets')}
                                >
                                  {studentAiLoadingAction === 'generateProjectBullets' ? 'Äang táº¡o bullets...' : 'Project Bullets'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  disabled={studentAiLoadingAction === 'convertActivitiesToCvBullets' || !canConvertActivitiesToCvBullets}
                                  onClick={() => void handleRunStudentAi('convertActivitiesToCvBullets')}
                                >
                                  {studentAiLoadingAction === 'convertActivitiesToCvBullets' ? 'Äang táº¡o bullets...' : 'Activities to CV Bullets'}
                                </button>
                              </div>
                              <p style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                `Fresher Summary` dÃ¹ng Ä‘Æ°á»£c trong quota Free. Hai tool bullets chá»‰ má»Ÿ cho Premium. Má»i káº¿t quáº£ Ä‘á»u cáº§n báº¡n review trÆ°á»›c khi Ã¡p dá»¥ng.
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
                                      ? 'AI Ä‘á» xuáº¥t summary má»›i, thá»© tá»± skills nÃªn nháº¥n máº¡nh, bullets kinh nghiá»‡m nÃªn tá»‘i Æ°u, keyword cÃ²n thiáº¿u vÃ  hÆ°á»›ng chá»‰nh CV theo JD.'
                                      : 'Tailor CV to Job lÃ  tÃ­nh nÄƒng Premium. Báº¡n sáº½ xem Ä‘á» xuáº¥t trÆ°á»›c rá»“i má»›i chá»n pháº§n nÃ o cáº§n Ã¡p dá»¥ng vÃ o CV.'}
                                  </p>
                                  {!cv.jobDescription?.trim() && (
                                    <p style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                      ChÆ°a cÃ³ job description. Báº¡n váº«n cÃ³ thá»ƒ cháº¡y, nhÆ°ng Ä‘á» xuáº¥t sáº½ Ã­t bÃ¡m sÃ¡t JD hÆ¡n.
                                    </p>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {aiPlan === 'free' && (
                                    <Link href="/pricing" className="btn btn-ghost btn-sm">
                                      Má»Ÿ khÃ³a Tailor AI
                                    </Link>
                                  )}
                                  <button type="button" onClick={handleTailorCvForJob} disabled={!canTailorCvForJob || tailorCvLoading} className="btn btn-outline btn-sm">
                                    {aiStatusLoading ? 'Äang kiá»ƒm tra quyá»n...' : tailorCvLoading ? 'Äang tá»‘i Æ°u...' : 'Tailor CV to Job'}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div style={{ marginBottom: '12px', borderRadius: '10px', border: `1px solid ${canRunAtsReview ? 'rgba(245,158,11,0.25)' : 'rgba(148,163,184,0.2)'}`, background: canRunAtsReview ? 'rgba(245,158,11,0.06)' : 'rgba(148,163,184,0.05)', padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: atsReview ? '12px' : 0 }}>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    T?i uu theo JD
                                  </p>
                                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {canRunAtsReview
                                      ? 'Phân tích CV theo v? trí, công ty và JD hi?n t?i d? ch?m di?m match, tìm keyword thi?u và t?o g?i ý áp d?ng nhanh.'
                                      : 'Tính nang này c?n Premium ho?c d? credit. B?n v?n có th? chu?n b? JD và m? khóa khi c?n.'}
                                  </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {!canRunAtsReview && (
                                    <Link href="/pricing" className="btn btn-ghost btn-sm">
                                      M? khóa ATS AI
                                    </Link>
                                  )}
                                  <button type="button" onClick={handleAtsReview} disabled={!canRunAtsReview || atsLoading} className="btn btn-outline btn-sm">
                                    {aiStatusLoading ? 'Ðang ki?m tra quy?n...' : atsLoading ? 'Ðang phân tích...' : 'Phân tích CV'}
                                  </button>
                                </div>
                              </div>
                              {atsReview && (
                                <div style={{ display: 'grid', gap: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: atsReview.matchScore >= 75 ? 'rgba(16,185,129,0.12)' : atsReview.matchScore >= 55 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ fontWeight: 800, fontSize: '1rem', color: atsReview.matchScore >= 75 ? '#10b981' : atsReview.matchScore >= 55 ? '#d97706' : '#ef4444' }}>
                                        {atsReview.matchScore}
                                      </span>
                                    </div>
                                    <div>
                                      <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                        Ði?m ATS hi?n t?i
                                      </p>
                                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        D?a trên target job, JD và n?i dung CV hi?n có.
                                      </p>
                                    </div>
                                  </div>
                                  <AtsList title="Matched keywords" items={atsReview.matchedKeywords} tone="success" />
                                  <AtsList title="Weak sections" items={atsReview.weakSections} tone="danger" />
                                  <AtsList title="Missing keywords" items={atsReview.missingKeywords} tone="warning" />
                                  <AtsList title="Improvement suggestions" items={atsReview.improvementSuggestions} tone="default" />
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                                    <div>
                                      <p style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                        Suggested summary
                                      </p>
                                      <textarea className="input" rows={6} readOnly value={atsReview.suggestedSummary} style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-base)' }} />
                                    </div>
                                    <div>
                                      <p style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                        Suggested experience bullets
                                      </p>
                                      <textarea className="input" rows={6} readOnly value={atsReview.suggestedExperienceBullets.join('\n')} style={{ resize: 'none', fontFamily: 'inherit', background: 'var(--bg-base)' }} />
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyAtsSuggestions}>
                                      Áp d?ng g?i ý vào CV
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div style={{ marginBottom: '12px', borderRadius: '10px', border: `1px solid ${canGenerateCoverLetter ? 'rgba(236,72,153,0.22)' : 'rgba(148,163,184,0.2)'}`, background: canGenerateCoverLetter ? 'rgba(236,72,153,0.05)' : 'rgba(148,163,184,0.05)', padding: '12px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) auto', gap: '10px', alignItems: 'end', marginBottom: '12px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Ngu?i nh?n thu
                                  </label>
                                  <input className="input" placeholder="Ví d?: Hiring Manager" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                    Gi?ng van
                                  </label>
                                  <select className="input" value={coverLetterTone} onChange={e => setCoverLetterTone(e.target.value as 'professional' | 'friendly' | 'concise')}>
                                    <option value="professional">Chuyên nghi?p</option>
                                    <option value="friendly">Thân thi?n</option>
                                    <option value="concise">Ng?n g?n</option>
                                  </select>
                                </div>
                                <button type="button" onClick={handleGenerateCoverLetter} disabled={!canGenerateCoverLetter || coverLetterLoading} className="btn btn-outline btn-sm">
                                  {aiStatusLoading ? 'Ðang ki?m tra quy?n...' : coverLetterLoading ? 'Ðang t?o...' : 'T?o cover letter'}
                                </button>
                              </div>
                              {!canGenerateCoverLetter && (
                                <div style={{ marginBottom: '12px' }}>
                                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    Cover letter generator c?n Premium ho?c d? credit. Khi m? khóa, b?n có th? t?o thu ?ng tuy?n bám sát JD và luu vào tài kho?n.
                                  </p>
                                  <div style={{ marginTop: '8px' }}>
                                    <Link href="/pricing" className="btn btn-ghost btn-sm">
                                      M? khóa Cover Letter AI
                                    </Link>
                                  </div>
                                </div>
                              )}
                              {coverLetterDraft && (
                                <div>
                                  <textarea className="input" rows={10} value={coverLetterDraft} onChange={e => setCoverLetterDraft(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit', marginBottom: '10px' }} />
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await navigator.clipboard.writeText(coverLetterDraft);
                                        toast.success('Ðã sao chép cover letter.');
                                      }}
                                      className="btn btn-secondary btn-sm"
                                    >
                                      Sao chép
                                    </button>
                                    <button type="button" onClick={handleSaveCoverLetter} disabled={coverLetterSaving} className="btn btn-primary btn-sm">
                                      {coverLetterSaving ? 'Ðang luu...' : 'Luu vào tài kho?n'}
                                    </button>
                                    <button type="button" onClick={handleDownloadCoverLetter} className="btn btn-outline btn-sm">
                                      T?i xu?ng
                                    </button>
                                    <button type="button" onClick={handleGenerateCoverLetter} disabled={coverLetterLoading || !canGenerateCoverLetter} className="btn btn-ghost btn-sm">
                                      T?o l?i
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              ðŸ’¡ Viáº¿t 3-5 cÃ¢u tÃ³m táº¯t Ä‘iá»ƒm máº¡nh, nÄƒm kinh nghiá»‡m vÃ  má»¥c tiÃªu nghá» nghiá»‡p ngáº¯n háº¡n. KhÃ´ng quÃ¡ 100 tá»«.
                            </div>
                            <textarea
                              className="input"
                              rows={7}
                              placeholder="TÃ´i lÃ  Frontend Developer vá»›i 3 nÄƒm kinh nghiá»‡m xÃ¢y dá»±ng cÃ¡c á»©ng dá»¥ng web hiá»‡u suáº¥t cao báº±ng React. Äam mÃª táº¡o ra tráº£i nghiá»‡m ngÆ°á»i dÃ¹ng tuyá»‡t vá»i..."
                              value={cv.content.summary || ''}
                              onChange={e => updateSummary(e.target.value)}
                              style={{ resize: 'vertical', fontFamily: 'inherit' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                              {(cv.content.summary || '').length} kÃ½ tá»±
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
                            TÃ­nh nÄƒng Ä‘ang Ä‘Æ°á»£c phÃ¡t triá»ƒn...
                          </div>
                        )}
                      </AccordionSection>
                    );
                  })}

                  <AccordionSection
                    title="ðŸ¤– AI History"
                    isOpen={isAiHistoryOpen}
                    onToggle={() => setIsAiHistoryOpen((current) => !current)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {([
                          { key: 'all', label: 'Táº¥t cáº£' },
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
                          Äang táº£i lá»‹ch sá»­ AI...
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
                          ChÆ°a cÃ³ báº£n ghi AI nÃ o cho bá»™ lá»c nÃ y.
                        </div>
                      )}

                      {!aiHistoryLoading && filteredAiHistory.map((history) => {
                        const atsMetadata = history.action === 'atsReview' ? history.metadata as {
                          matchScore?: number;
                          matchedKeywords?: string[];
                          weakSections?: string[];
                          missingKeywords?: string[];
                          improvementSuggestions?: string[];
                          suggestedSummary?: string;
                          suggestedExperienceBullets?: string[];
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
                                {history.accepted ? 'ÄÃ£ Ã¡p dá»¥ng' : 'ChÆ°a Ã¡p dá»¥ng'}
                              </span>
                            </div>

                            {(history.targetJob || history.targetCompany) && (
                              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Target: {history.targetJob || 'N/A'} {history.targetCompany ? `â€¢ ${history.targetCompany}` : ''}
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
                                      {typeof atsMetadata.matchScore === 'number' ? atsMetadata.matchScore : '--'}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    Äiá»ƒm ATS vÃ  cÃ¡c gÃ³p Ã½ chÃ­nh tá»« láº§n phÃ¢n tÃ­ch nÃ y.
                                  </p>
                                </div>
                                <AtsList title="Matched keywords" items={atsMetadata.matchedKeywords || []} tone="success" />
                                <AtsList title="Weak sections" items={atsMetadata.weakSections || []} tone="danger" />
                                <AtsList title="Missing keywords" items={atsMetadata.missingKeywords || []} tone="warning" />
                                <AtsList title="Improvement suggestions" items={atsMetadata.improvementSuggestions || []} tone="default" />
                              </div>
                            )}

                            {history.action === 'tailorCvForJob' && tailorMetadata && (
                              <div style={{ display: 'grid', gap: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                                  <div>
                                    <p style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                      Summary hiá»‡n táº¡i
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
                                      Summary AI Ä‘á» xuáº¥t
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
                                <AtsList title="Thá»© tá»± skills nÃªn nháº¥n máº¡nh" items={tailorMetadata.suggestedSkillsOrder || []} tone="default" />
                                <AtsList title="Keywords cÃ²n thiáº¿u" items={tailorMetadata.keywordsMissing || []} tone="warning" />
                                <AtsList title="Khuyáº¿n nghá»‹" items={tailorMetadata.recommendations || []} tone="default" />
                                {(tailorMetadata.improvedExperienceBullets || []).length > 0 && (
                                  <div style={{ display: 'grid', gap: '10px' }}>
                                    {(tailorMetadata.improvedExperienceBullets || []).map((item) => (
                                      <div key={`${history.id}-${item.experienceIndex}`} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '12px' }}>
                                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                          Experience #{item.experienceIndex + 1}: {item.role || 'N/A'} {item.company ? `â€¢ ${item.company}` : ''}
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
                                    Báº£n gá»‘c
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
                                    Báº£n AI
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
                                  Ãp dá»¥ng láº¡i
                                </button>
                              </div>
                            )}

                            {(history.action === 'generateSummary' || history.action === 'fresherSummary') && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => void handleCopyHistoryText(history.oldText || '', 'ÄÃ£ sao chÃ©p summary cÅ©.')}
                                >
                                  Copy báº£n cÅ©
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => void handleCopyHistoryText(history.newText || '', 'ÄÃ£ sao chÃ©p summary AI.')}
                                >
                                  Copy báº£n AI
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleApplySummaryFromHistory(history.oldText || '', 'ÄÃ£ khÃ´i phá»¥c summary cÅ© tá»« AI History.')}
                                  disabled={!history.oldText}
                                >
                                  Ãp dá»¥ng báº£n cÅ©
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleApplySummaryFromHistory(history.newText || '', 'ÄÃ£ Ã¡p dá»¥ng summary AI tá»« lá»‹ch sá»­.')}
                                  disabled={!history.newText}
                                >
                                  Ãp dá»¥ng báº£n AI
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

        {/* â”€â”€ Draggable Divider â”€â”€ */}
        {!previewMode && (
          <div
            className="resizable-divider"
            onMouseDown={onDividerMouseDown}
            title="KÃ©o Ä‘á»ƒ thay Ä‘á»•i kÃ­ch thÆ°á»›c"
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
              width: '794px', // A4 ~210mm táº¡i 96dpi
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
                  So sÃ¡nh báº£n gá»‘c vÃ  báº£n AI Ä‘á» xuáº¥t
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {pendingRewrite.role || 'Vá»‹ trÃ­ chÆ°a Ä‘áº·t tÃªn'}{pendingRewrite.company ? ` táº¡i ${pendingRewrite.company}` : ''}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscardPendingRewrite}>
                ÄÃ³ng
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
                  Báº£n gá»‘c
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
                  Báº£n AI Ä‘á» xuáº¥t
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
                Giá»¯ báº£n cÅ©
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => void handleRegeneratePendingRewrite()}
                disabled={experienceAiLoadingIndex === pendingRewrite.index}
              >
                {experienceAiLoadingIndex === pendingRewrite.index ? 'Äang táº¡o láº¡i...' : 'Táº¡o láº¡i'}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyPendingRewrite}>
                Ãp dá»¥ng
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
                  {pendingStudentAi.fieldOfStudy ? `NgÃ nh há»c: ${pendingStudentAi.fieldOfStudy}. ` : ''}
                  {pendingStudentAi.itemName ? `Má»¥c Ã¡p dá»¥ng: ${pendingStudentAi.itemName}.` : 'Xem láº¡i Ä‘á» xuáº¥t trÆ°á»›c khi Ã¡p dá»¥ng vÃ o CV.'}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscardPendingStudentAi}>
                ÄÃ³ng
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ borderRadius: '16px', border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(148,163,184,0.06)', padding: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  Báº£n hiá»‡n táº¡i
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
                  Äá» xuáº¥t AI
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
                Metadata dÃ¹ng Ä‘á»ƒ táº¡o Ä‘á» xuáº¥t
              </p>
              <div style={{ display: 'grid', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <p>Vai trÃ²: {pendingStudentAi.role || 'N/A'}</p>
                <p>CÃ´ng nghá»‡ / ká»¹ nÄƒng: {pendingStudentAi.technologies.join(', ') || 'N/A'}</p>
                <p>Káº¿t quáº£ Ä‘áº¡t Ä‘Æ°á»£c: {pendingStudentAi.achievements || 'N/A'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscardPendingStudentAi}>
                Giá»¯ báº£n hiá»‡n táº¡i
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyPendingStudentAi}>
                Ãp dá»¥ng káº¿t quáº£
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
                  Xem trÆ°á»›c cÃ¡c Ä‘á» xuáº¥t AI cho summary, bullets kinh nghiá»‡m, keywords cÃ²n thiáº¿u vÃ  hÆ°á»›ng tá»‘i Æ°u CV theo job má»¥c tiÃªu.
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscardPendingTailorCv}>
                ÄÃ³ng
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '9999px', border: '1px solid rgba(99,102,241,0.18)', background: 'rgba(99,102,241,0.05)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={pendingTailorCv.applySummary}
                  onChange={(event) => setPendingTailorCv((current) => current ? { ...current, applySummary: event.target.checked } : current)}
                />
                Ãp dá»¥ng summary Ä‘á» xuáº¥t
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '9999px', border: '1px solid rgba(14,165,233,0.18)', background: 'rgba(14,165,233,0.05)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={pendingTailorCv.applyExperienceBullets}
                  onChange={(event) => setPendingTailorCv((current) => current ? { ...current, applyExperienceBullets: event.target.checked } : current)}
                />
                Ãp dá»¥ng bullets kinh nghiá»‡m Ä‘á» xuáº¥t
              </label>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ borderRadius: '16px', border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(148,163,184,0.06)', padding: '16px' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Summary hiá»‡n táº¡i
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
                    Summary Ä‘á» xuáº¥t
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
                    Thá»© tá»± skills nÃªn nháº¥n máº¡nh
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {pendingTailorCv.suggestedSkillsOrder.length ? pendingTailorCv.suggestedSkillsOrder.map((skill) => (
                      <span key={skill} style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0369a1', background: 'rgba(14,165,233,0.10)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: '9999px', padding: '6px 10px' }}>
                        {skill}
                      </span>
                    )) : (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>KhÃ´ng cÃ³ gá»£i Ã½ thá»© tá»± skills cá»¥ thá»ƒ.</p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  <div style={{ borderRadius: '16px', border: '1px solid rgba(245,158,11,0.18)', background: 'rgba(245,158,11,0.05)', padding: '16px' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                      Keywords cÃ²n thiáº¿u
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {pendingTailorCv.keywordsMissing.length ? pendingTailorCv.keywordsMissing.map((item, index) => (
                        <li key={`keyword-${index}`}>{item}</li>
                      )) : <li>KhÃ´ng cÃ³ keyword thiáº¿u ná»•i báº­t.</li>}
                    </ul>
                  </div>

                  <div style={{ borderRadius: '16px', border: '1px solid rgba(99,102,241,0.18)', background: 'rgba(99,102,241,0.05)', padding: '16px' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                      Recommendations
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {pendingTailorCv.recommendations.length ? pendingTailorCv.recommendations.map((item, index) => (
                        <li key={`recommendation-${index}`}>{item}</li>
                      )) : <li>KhÃ´ng cÃ³ khuyáº¿n nghá»‹ bá»• sung.</li>}
                    </ul>
                  </div>
                </div>

                <div style={{ borderRadius: '16px', border: '1px solid rgba(16,185,129,0.18)', background: 'rgba(16,185,129,0.04)', padding: '16px' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Bullets kinh nghiá»‡m Ä‘á» xuáº¥t
                  </p>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {pendingTailorCv.improvedExperienceBullets.length ? pendingTailorCv.improvedExperienceBullets.map((item) => (
                      <div key={`tailor-exp-${item.experienceIndex}`} style={{ borderRadius: '12px', border: '1px solid rgba(16,185,129,0.16)', background: 'var(--bg-base)', padding: '12px' }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                          Experience #{item.experienceIndex + 1}: {item.role || 'N/A'} {item.company ? `â€¢ ${item.company}` : ''}
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {item.bullets.map((bullet, index) => (
                            <li key={`tailor-exp-${item.experienceIndex}-${index}`}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    )) : (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>KhÃ´ng cÃ³ bullets kinh nghiá»‡m cáº§n Ä‘iá»u chá»‰nh.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleDiscardPendingTailorCv}>
                Giá»¯ báº£n hiá»‡n táº¡i
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyPendingTailorCv}>
                Ãp dá»¥ng Ä‘á» xuáº¥t
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
                Äá»ƒ sau
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

// â”€â”€â”€ Inline Mini-Forms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LanguagesForm({ data, onChange }: { data: {name:string;level:string}[]; onChange: (d: {name:string;level:string}[]) => void }) {
  const add = () => onChange([...data, { name: '', level: '' }]);
  const update = (i: number, field: 'name'|'level', val: string) => { const list = [...data]; list[i] = {...list[i], [field]: val}; onChange(list); };
  const remove = (i: number) => onChange(data.filter((_,j)=>j!==i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((lang, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
          <input className="input" placeholder="Tiáº¿ng Anh" value={lang.name} onChange={e => update(i,'name',e.target.value)} />
          <select className="input" value={lang.level} onChange={e => update(i,'level',e.target.value)}>
            <option value="">-- TrÃ¬nh Ä‘á»™ --</option>
            <option>SÆ¡ cáº¥p (A1)</option>
            <option>CÆ¡ báº£n (A2)</option>
            <option>Trung cáº¥p (B1)</option>
            <option>KhÃ¡ (B2)</option>
            <option>NÃ¢ng cao (C1)</option>
            <option>ThÃ nh tháº¡o (C2)</option>
            <option>Báº£n ngá»¯</option>
            <option>IELTS 6.0+</option>
            <option>TOEIC 700+</option>
          </select>
          <button onClick={() => remove(i)} style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:'8px', padding:'8px', cursor:'pointer', color:'#ef4444' }}>âœ•</button>
        </div>
      ))}
      <button onClick={add} className="btn btn-outline btn-sm" style={{ justifyContent: 'center', borderStyle: 'dashed' }}>+ ThÃªm ngoáº¡i ngá»¯</button>
    </div>
  );
}

function InterestsForm({ data, onChange }: { data: string[]; onChange: (d: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => { if (input.trim() && !data.includes(input.trim())) { onChange([...data, input.trim()]); setInput(''); }};
  const PRESETS = ['Äá»c sÃ¡ch', 'Du lá»‹ch', 'Ã‚m nháº¡c', 'Thá»ƒ thao', 'Náº¥u Äƒn', 'Chá»¥p áº£nh', 'Gaming', 'Thiáº¿t káº¿', 'Viáº¿t lÃ¡ch'];
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        {PRESETS.map(p => {
          const added = data.includes(p);
          return <button key={p} onClick={() => added ? onChange(data.filter(x=>x!==p)) : onChange([...data,p])}
            style={{ fontSize:'0.78rem', fontWeight:600, padding:'4px 10px', borderRadius:'9999px', background: added?'var(--primary)':'var(--bg-base)', color: added?'white':'var(--text-secondary)', border:`1px solid ${added?'var(--primary)':'var(--border)'}`, cursor:'pointer' }}>
            {added ? 'âœ“ ' : '+ '}{p}</button>;
        })}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input className="input" placeholder="Sá»Ÿ thÃ­ch khÃ¡c..." value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>{if(e.key==='Enter'){e.preventDefault();add();}}} style={{ flex:1 }} />
        <button onClick={add} className="btn btn-secondary btn-sm">ThÃªm</button>
      </div>
      {data.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {data.map(d => (
            <span key={d} style={{ background:'rgba(99,102,241,0.1)', color:'var(--primary)', padding:'4px 10px', borderRadius:'9999px', fontSize:'0.82rem', fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}>
              {d}
              <button onClick={()=>onChange(data.filter(x=>x!==d))} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', padding:0, display:'flex', alignItems:'center' }}>âœ•</button>
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
      <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Äang táº£i CV...</p>
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


