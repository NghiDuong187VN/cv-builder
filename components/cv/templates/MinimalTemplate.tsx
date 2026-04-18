import { CV, CVSection } from '@/lib/types';
import type { ReactNode } from 'react';

const VI: Record<string, string> = {
  contact: 'Liên Hệ', skills: 'Kỹ Năng', languages: 'Ngoại Ngữ', interests: 'Sở Thích',
  summary: 'Mục Tiêu Nghề Nghiệp', experience: 'Kinh Nghiệm Làm Việc',
  education: 'Học Vấn', projects: 'Dự Án', certificates: 'Chứng Chỉ',
};
const EN: Record<string, string> = {
  contact: 'Contact', skills: 'Skills', languages: 'Languages', interests: 'Interests',
  summary: 'Career Objective', experience: 'Work Experience',
  education: 'Education', projects: 'Projects', certificates: 'Certificates',
};
const t = (lang: string, key: string) => (lang === 'en' ? EN[key] : VI[key]) ?? key;

function SideSection({ title, primary, children }: { title: string; primary: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '6px', borderBottom: `2px solid ${primary}` }}>
        <h3 style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', color: primary, margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MainSection({ title, primary, children }: { title: string; primary: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ width: '4px', height: '22px', background: primary, borderRadius: '2px' }} />
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function MinimalTemplate({ cv }: { cv: CV }) {
  const primary = cv.theme?.primaryColor || '#1e293b';
  const font = cv.theme?.font || 'Plus Jakarta Sans';
  const fontStack = `${font}, "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif`;
  const lang = cv.language || 'vi';
  const sections = (cv.sections?.order || []) as CVSection[];
  const vis = cv.sections?.visibility || {};
  const info = cv.content?.personalInfo;

  return (
    <div style={{ fontFamily: fontStack, color: '#334155', display: 'flex', minHeight: '297mm', background: 'white' }}>
      {/* LEFT SIDEBAR */}
      <div style={{ width: '33%', background: '#f8fafc', padding: '36px 24px', borderRight: '1px solid #e2e8f0', flexShrink: 0 }}>
        {cv.theme?.showAvatar && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            {info?.avatarUrl ? (
              <img src={info.avatarUrl} alt="avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: `4px solid ${primary}` }} />
            ) : (
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: `linear-gradient(135deg, ${primary}, #8b5cf6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                {info?.fullName ? info.fullName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
        )}

        {/* Contact Info */}
        <SideSection primary={primary} title={t(lang, 'contact')}>
          {info?.email && <ContactItem icon="✉" text={info.email} />}
          {info?.phone && <ContactItem icon="📱" text={info.phone} />}
          {info?.address && <ContactItem icon="📍" text={info.address} />}
          {info?.linkedin && <ContactItem icon="in" text={info.linkedin} link={`https://${info.linkedin}`} />}
          {info?.github && <ContactItem icon="⌥" text={info.github.replace('github.com/', '')} link={`https://${info.github}`} />}
          {info?.website && <ContactItem icon="🌐" text="Portfolio" link={info.website} />}
        </SideSection>

        {/* Skills sidebar */}
        {vis.skills !== false && cv.content?.skills?.length > 0 && (
          <SideSection primary={primary} title={t(lang, 'skills')}>
            {cv.content.skills.map((skill, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{skill.name}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {skill.level >= 80 ? 'Chuyên gia' : skill.level >= 60 ? 'Tốt' : skill.level >= 40 ? 'Khá' : 'Cơ bản'}
                  </span>
                </div>
                <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${skill.level}%`, background: primary, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </SideSection>
        )}

        {/* Languages sidebar */}
        {vis.languages !== false && cv.content?.languages?.length > 0 && (
          <SideSection primary={primary} title={t(lang, 'languages')}>
            {cv.content.languages.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 600 }}>{l.name}</span>
                <span style={{ color: '#64748b' }}>{l.level}</span>
              </div>
            ))}
          </SideSection>
        )}

        {/* Interests sidebar */}
        {vis.interests !== false && cv.content?.interests?.length > 0 && (
          <SideSection primary={primary} title={t(lang, 'interests')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {cv.content.interests.map((interest, i) => (
                <span key={i} style={{ fontSize: '0.75rem', padding: '3px 8px', background: `${primary}18`, color: primary, borderRadius: '4px', fontWeight: 600 }}>{interest}</span>
              ))}
            </div>
          </SideSection>
        )}
      </div>

      {/* RIGHT CONTENT */}
      <div style={{ flex: 1, padding: '36px 32px' }}>
        {/* Name block */}
        {info && (
          <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: `2px solid ${primary}` }}>
            <h1 style={{ fontWeight: 900, fontSize: '2.2rem', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, marginBottom: '6px' }}>
              {info.fullName || 'Họ Và Tên'}
            </h1>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: primary, textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>
              {info.jobTitle || cv.targetJob || 'Vị Trí Ứng Tuyển'}
            </p>
          </div>
        )}

        {/* Sections */}
        {sections.map(section => {
          if (vis[section] === false) return null;
          if (section === 'summary' && cv.content?.summary) {
            return (
              <MainSection key="summary" primary={primary} title={t(lang, 'summary')}>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.8, color: '#475569', textAlign: 'justify' }}>{cv.content.summary}</p>
              </MainSection>
            );
          }
          if (section === 'experience' && cv.content?.experience?.length > 0) {
            return (
              <MainSection key="experience" primary={primary} title={t(lang, 'experience')}>
                {cv.content.experience.map((exp, i) => (
                  <div key={exp.id} style={{ marginBottom: '18px', paddingLeft: '16px', borderLeft: `2px solid ${i === 0 ? primary : '#e2e8f0'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                      <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', margin: 0 }}>{exp.role}</h4>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{exp.from} – {exp.current ? 'Hiện tại' : exp.to}</span>
                    </div>
                    <p style={{ fontWeight: 700, color: primary, fontSize: '0.85rem', marginBottom: '6px' }}>{exp.company} {exp.location && `· ${exp.location}`}</p>
                    {exp.description && <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#475569', whiteSpace: 'pre-wrap' }}>{exp.description}</p>}
                  </div>
                ))}
              </MainSection>
            );
          }
          if (section === 'education' && cv.content?.education?.length > 0) {
            return (
              <MainSection key="education" primary={primary} title={t(lang, 'education')}>
                {cv.content.education.map((edu, i) => (
                  <div key={edu.id} style={{ marginBottom: '14px', paddingLeft: '16px', borderLeft: '2px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>{edu.school}</h4>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{edu.from} – {edu.to}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#475569' }}>{edu.degree} {edu.field && `· ${edu.field}`} {edu.gpa && `· GPA: ${edu.gpa}`}</p>
                    {edu.achievements && <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>{edu.achievements}</p>}
                  </div>
                ))}
              </MainSection>
            );
          }
          if (section === 'projects' && cv.content?.projects?.length > 0) {
            return (
              <MainSection key="projects" primary={primary} title={t(lang, 'projects')}>
                {cv.content.projects.map((proj, i) => (
                  <div key={proj.id} style={{ marginBottom: '14px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', margin: 0 }}>{proj.name}</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {proj.url && <a href={proj.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: primary }}>Demo ↗</a>}
                        {proj.github && <a href={`https://${proj.github}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#64748b' }}>GitHub ↗</a>}
                      </div>
                    </div>
                    {proj.role && <p style={{ fontSize: '0.78rem', color: primary, fontWeight: 600, marginBottom: '4px' }}>{proj.role}</p>}
                    {proj.technologies.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                        {proj.technologies.map(tech => <span key={tech} style={{ fontSize: '0.7rem', padding: '2px 6px', background: `${primary}15`, color: primary, borderRadius: '4px', fontWeight: 600 }}>{tech}</span>)}
                      </div>
                    )}
                    {proj.description && <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: '#475569' }}>{proj.description}</p>}
                  </div>
                ))}
              </MainSection>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function ContactItem({ icon, text, link }: { icon: string; text: string; link?: string }) {
  const content = <span style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{text}</span>;
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '9px', color: '#334155' }}>
      <span style={{ fontSize: '0.7rem', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
      {link ? <a href={link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#334155' }}>{content}</a> : content}
    </div>
  );
}
