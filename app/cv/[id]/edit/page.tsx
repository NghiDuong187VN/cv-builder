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
import { createCoverLetter, getCV, updateCV } from '@/lib/firestore';
import { CV, CVSection, CVTheme, PersonalInfo } from '@/lib/types';
import toast from 'react-hot-toast';
import { FREE_AI_DAILY_LIMIT } from '@/lib/ai';

// Editor sub-components
import PersonalInfoForm from '@/components/cv/editor/PersonalInfoForm';
import ExperienceForm from '@/components/cv/editor/ExperienceForm';
import EducationForm from '@/components/cv/editor/EducationForm';
import ProjectsForm from '@/components/cv/editor/ProjectsForm';
import SkillsForm from '@/components/cv/editor/SkillsForm';
import SectionsPanel from '@/components/cv/editor/SectionsPanel';
import ThemePanel from '@/components/cv/editor/ThemePanel';
import TemplateRenderer from '@/components/cv/TemplateRenderer';
import ExportButton from '@/components/cv/ExportButton';

type TabType = 'content' | 'sections' | 'theme';

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
  const [summaryAiLoading, setSummaryAiLoading] = useState(false);
  const [experienceAiLoadingIndex, setExperienceAiLoadingIndex] = useState<number | null>(null);
  const [freeAiRemaining, setFreeAiRemaining] = useState<number | null>(FREE_AI_DAILY_LIMIT);
  const [atsLoading, setAtsLoading] = useState(false);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterSaving, setCoverLetterSaving] = useState(false);
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
      throw new Error(result.message || result.error || 'AI request failed');
    }

    if (typeof result.remainingToday === 'number') {
      setFreeAiRemaining(result.remainingToday);
    }

    return result as {
      text?: string;
      review?: {
        score: number;
        strengths: string[];
        gaps: string[];
        keywordsMissing: string[];
        recommendations: string[];
      };
      remainingToday: number | null;
    };
  }, [firebaseUser]);

  const handleGenerateSummary = useCallback(async () => {
    if (!cv) return;

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
      toast.success(user?.plan === 'premium' ? 'AI đã viết lại summary.' : 'Đã tạo summary bằng AI.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo summary bằng AI.');
    } finally {
      setSummaryAiLoading(false);
    }
  }, [callCvAi, cv, updateSummary, user?.plan]);

  const handleRewriteExperience = useCallback(async (index: number) => {
    if (!cv) return;

    const selected = cv.content.experience?.[index];
    if (!selected?.description?.trim()) {
      toast.error('Hãy nhập mô tả kinh nghiệm trước khi dùng AI.');
      return;
    }

    setExperienceAiLoadingIndex(index);
    try {
      const result = await callCvAi({
        action: 'rewriteExperience',
        language: cv.language,
        cv: {
          targetJob: cv.targetJob || '',
          targetCompany: cv.targetCompany || '',
        },
        experience: selected,
      });

      const next = [...(cv.content.experience || [])];
      next[index] = { ...selected, description: result.text || '' };
      updateSection('experience', next);
      toast.success('Đã viết lại mô tả kinh nghiệm bằng AI.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể viết lại mô tả.');
    } finally {
      setExperienceAiLoadingIndex(null);
    }
  }, [callCvAi, cv, updateSection]);

  const handleAtsReview = useCallback(async () => {
    if (!cv) return;

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
        toast.success('Đã phân tích ATS cho CV này.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể phân tích ATS.');
    } finally {
      setAtsLoading(false);
    }
  }, [callCvAi, cv]);

  const handleGenerateCoverLetter = useCallback(async () => {
    if (!cv) return;

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
  }, [callCvAi, cv, recipientName]);

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

  if (dataLoading) return <LoadingEditor />;
  if (!cv) return null;

  const sections = cv.sections?.order || [];
  const visibility = cv.sections?.visibility || {};
  const aiPlan = user?.plan === 'premium' ? 'premium' : 'free';

  return (
    <>
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

          {/* Language toggle */}
          <button onClick={toggleLanguage} className="btn btn-ghost btn-sm" title="Đổi ngôn ngữ CV" style={{ flexShrink: 0 }}>
            <Globe size={14} />
            <span style={{ fontSize: '0.75rem' }}>{cv.language === 'vi' ? 'VI' : 'EN'}</span>
          </button>

          {/* Preview toggle */}
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="btn btn-ghost btn-sm"
            style={{ flexShrink: 0 }}
          >
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
            <span style={{ fontSize: '0.75rem' }}>{previewMode ? 'Chỉnh sửa' : 'Xem trước'}</span>
          </button>

          <ExportButton cvId={cv.cvId} cvTitle={cv.title} />

          <button
            onClick={handleManualSave}
            disabled={saving}
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0 }}
          >
            {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            Lưu
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
      <div style={{
        paddingTop: previewMode ? '56px' : '102px',
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-base)',
      }}>
        {/* Form Panel */}
        {!previewMode && (
          <div style={{
            width: `${panelWidth}px`, flexShrink: 0, overflowY: 'auto',
            background: 'var(--bg-card)',
            height: 'calc(100vh - 102px)',
            position: 'sticky', top: '102px',
          }}>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                                      Lượt còn lại hôm nay: {freeAiRemaining ?? FREE_AI_DAILY_LIMIT}
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
                                    disabled={summaryAiLoading}
                                    className="btn btn-primary btn-sm"
                                  >
                                    {summaryAiLoading ? 'AI đang viết...' : 'Tạo summary bằng AI'}
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
                                  <button type="button" onClick={handleAtsReview} disabled={aiPlan !== 'premium' || atsLoading} className="btn btn-outline btn-sm">
                                    {atsLoading ? 'Đang phân tích...' : 'Chấm ATS'}
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
                                <button type="button" onClick={handleGenerateCoverLetter} disabled={aiPlan !== 'premium' || coverLetterLoading} className="btn btn-outline btn-sm">
                                  {coverLetterLoading ? 'Đang tạo...' : 'Tạo cover letter'}
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
        <div style={{
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

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
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
