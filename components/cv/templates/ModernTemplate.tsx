import { CV, CVSection } from '@/lib/types';
import { Mail, Phone, MapPin, Globe, ExternalLink } from 'lucide-react';

const VI: Record<string,string> = { summary:'MỤC TIÊU NGHỀ NGHIỆP', skills:'KỸ NĂNG', experience:'KINH NGHIỆM', education:'HỌC VẤN', projects:'DỰ ÁN', languages:'NGOẠI NGỮ', interests:'SỞ THÍCH' };
const EN: Record<string,string> = { summary:'CAREER OBJECTIVE', skills:'SKILLS', experience:'EXPERIENCE', education:'EDUCATION', projects:'PROJECTS', languages:'LANGUAGES', interests:'INTERESTS' };
const t = (lang: string, k: string) => (lang==='en'?EN:VI)[k] ?? k.toUpperCase();

export default function ModernTemplate({ cv }: { cv: CV }) {
  const primary = cv.theme?.primaryColor || '#6366f1';
  const secondary = cv.theme?.secondaryColor || '#8b5cf6';
  const font = cv.theme?.font || 'Inter';
  const lang = cv.language || 'vi';
  const sections = (cv.sections?.order || []) as CVSection[];
  const vis = cv.sections?.visibility || {};
  const info = cv.content?.personalInfo;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ width: '32px', height: '3px', background: `linear-gradient(90deg,${primary},${secondary})`, borderRadius: '2px' }} />
        <h3 style={{ fontWeight: 900, fontSize: '0.78rem', letterSpacing: '2px', color: '#0f172a', margin: 0 }}>{title}</h3>
        <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily: font, color: '#334155', minHeight: '297mm', background: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, padding: '40px 40px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '30%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          {cv.theme?.showAvatar && (
            <div style={{ flexShrink: 0 }}>
              {info?.avatarUrl ? (
                <img src={info.avatarUrl} alt="avatar" style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.6)' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', border: '3px solid rgba(255,255,255,0.4)' }}>
                  {info?.fullName?.charAt(0) || '?'}
                </div>
              )}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontWeight: 900, fontSize: '2rem', margin: 0, marginBottom: '4px', letterSpacing: '-0.5px' }}>
              {info?.fullName || 'Họ Và Tên'}
            </h1>
            <p style={{ fontWeight: 500, fontSize: '1rem', margin: 0, marginBottom: '16px', opacity: 0.9 }}>
              {info?.jobTitle || cv.targetJob || 'Vị trí ứng tuyển'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', opacity: 0.85 }}>
              {info?.email && <span style={{ display:'flex',alignItems:'center',gap:'5px' }}><Mail size={12}/>{info.email}</span>}
              {info?.phone && <span style={{ display:'flex',alignItems:'center',gap:'5px' }}><Phone size={12}/>{info.phone}</span>}
              {info?.address && <span style={{ display:'flex',alignItems:'center',gap:'5px' }}><MapPin size={12}/>{info.address}</span>}
              {info?.website && <a href={info.website} target="_blank" rel="noreferrer" style={{ display:'flex',alignItems:'center',gap:'5px',color:'white',textDecoration:'none' }}><Globe size={12}/>Portfolio</a>}
              {info?.linkedin && <a href={`https://${info.linkedin}`} target="_blank" rel="noreferrer" style={{ display:'flex',alignItems:'center',gap:'5px',color:'white',textDecoration:'none' }}>in LinkedIn</a>}
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, padding: '36px 40px' }}>
        {sections.map(section => {
          if (vis[section] === false) return null;

          if (section === 'summary' && cv.content?.summary) {
            return (
              <Section key="summary" title={t(lang,'summary')}>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: '#475569', textAlign: 'justify', padding: '16px', background: '#f8fafc', borderRadius: '10px', borderLeft: `4px solid ${primary}` }}>
                  {cv.content.summary}
                </p>
              </Section>
            );
          }

          if (section === 'skills' && cv.content?.skills?.length > 0) {
            return (
              <Section key="skills" title={t(lang,'skills')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {cv.content.skills.map((sk, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: `${primary}0f`, borderRadius: '8px', border: `1px solid ${primary}30` }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: primary }}>{sk.name}</span>
                      <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${sk.level}%`, background: `linear-gradient(90deg,${primary},${secondary})`, borderRadius: '2px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            );
          }

          if (section === 'experience' && cv.content?.experience?.length > 0) {
            return (
              <Section key="experience" title={t(lang,'experience')}>
                {cv.content.experience.map((exp, i) => (
                  <div key={exp.id} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: primary, border: '2px solid white', boxShadow: `0 0 0 2px ${primary}` }} />
                      {i < cv.content.experience.length - 1 && <div style={{ width: '2px', flex: 1, background: '#e2e8f0', marginTop: '4px' }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: i < cv.content.experience.length - 1 ? '16px' : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: 0 }}>{exp.role}</h4>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                          {exp.from} – {exp.current ? 'Hiện tại' : exp.to}
                        </span>
                      </div>
                      <p style={{ fontWeight: 700, color: primary, fontSize: '0.85rem', marginBottom: '6px' }}>{exp.company} {exp.location && `· ${exp.location}`}</p>
                      {exp.description && <p style={{ fontSize: '0.83rem', lineHeight: 1.7, color: '#475569', whiteSpace: 'pre-wrap' }}>{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </Section>
            );
          }

          if (section === 'education' && cv.content?.education?.length > 0) {
            return (
              <Section key="education" title={t(lang,'education')}>
                {cv.content.education.map((edu, i) => (
                  <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '14px', padding: '14px', background: '#f8fafc', borderRadius: '10px', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', margin: 0, marginBottom: '4px' }}>{edu.school}</h4>
                      <p style={{ fontSize: '0.83rem', color: '#475569', margin: 0 }}>{edu.degree} {edu.field && `· ${edu.field}`}</p>
                      {edu.gpa && <p style={{ fontSize: '0.78rem', color: primary, fontWeight: 700, margin: '4px 0 0' }}>GPA: {edu.gpa}</p>}
                      {edu.achievements && <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>{edu.achievements}</p>}
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', alignSelf: 'flex-start', background: '#e2e8f0', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                      {edu.from} – {edu.to}
                    </span>
                  </div>
                ))}
              </Section>
            );
          }

          if (section === 'projects' && cv.content?.projects?.length > 0) {
            return (
              <Section key="projects" title={t(lang,'projects')}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {cv.content.projects.map((proj, i) => (
                    <div key={proj.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <h4 style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', margin: 0 }}>{proj.name}</h4>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {proj.url && <a href={proj.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: primary, fontWeight: 700 }}>Demo↗</a>}
                          {proj.github && <a href={`https://${proj.github}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: '#64748b' }}>Code↗</a>}
                        </div>
                      </div>
                      {proj.role && <p style={{ fontSize: '0.75rem', color: primary, fontWeight: 600, marginBottom: '6px' }}>{proj.role}</p>}
                      {proj.technologies.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                          {proj.technologies.map(tech => <span key={tech} style={{ fontSize: '0.68rem', padding: '2px 5px', background: `${primary}15`, color: primary, borderRadius: '3px', fontWeight: 600 }}>{tech}</span>)}
                        </div>
                      )}
                      {proj.description && <p style={{ fontSize: '0.78rem', lineHeight: 1.5, color: '#475569' }}>{proj.description}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            );
          }

          if (section === 'languages' && cv.content?.languages?.length > 0) {
            return (
              <Section key="languages" title={t(lang,'languages')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {cv.content.languages.map((l, i) => (
                    <div key={i} style={{ padding: '8px 14px', background: `${primary}0f`, borderRadius: '8px', border: `1px solid ${primary}25` }}>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: primary }}>{l.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px' }}>{l.level}</span>
                    </div>
                  ))}
                </div>
              </Section>
            );
          }

          if (section === 'interests' && cv.content?.interests?.length > 0) {
            return (
              <Section key="interests" title={t(lang,'interests')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {cv.content.interests.map((interest, i) => (
                    <span key={i} style={{ fontSize: '0.8rem', padding: '4px 12px', background: '#f1f5f9', color: '#475569', borderRadius: '9999px', fontWeight: 500 }}>{interest}</span>
                  ))}
                </div>
              </Section>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
