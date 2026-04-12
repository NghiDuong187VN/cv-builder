'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Eye, EyeOff, Share2, Globe, ChevronDown,
  ChevronRight, Loader, Check, LayoutTemplate, Palette, ListOrdered,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getCV, updateCV } from '@/lib/firestore';
import { CV, CVSection, CVTheme, PersonalInfo, Skill, Education, Experience, Project, CVLanguage } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import toast from 'react-hot-toast';

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
type SectionKey = CVSection | 'instructions';

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

  const { firebaseUser, loading } = useAuth();
  const [cv, setCv] = useState<CV | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<TabType>('content');
  const [openSection, setOpenSection] = useState<CVSection>('personalInfo');
  const [previewMode, setPreviewMode] = useState(false);
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
  }, [firebaseUser, id]);

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
  const updateSummary = (val: string) => updateCvState(prev => ({ ...prev, content: { ...prev.content, summary: val } }));
  const updateSection = <K extends keyof CV['content']>(key: K, val: CV['content'][K]) => updateCvState(prev => ({ ...prev, content: { ...prev.content, [key]: val } }));
  const updateTheme = (t: Partial<CVTheme>) => updateCvState(prev => ({ ...prev, theme: { ...prev.theme, ...t } }));
  const changeTemplate = (templateId: string) => updateCvState(prev => ({ ...prev, templateId }));
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

  if (dataLoading) return <LoadingEditor />;
  if (!cv) return null;

  const sections = cv.sections?.order || [];
  const visibility = cv.sections?.visibility || {};

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
                          <ExperienceForm data={cv.content.experience || []} onChange={d => updateSection('experience', d)} lang={cv.language} />
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

function LoadingEditor() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
      <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Đang tải CV...</p>
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
