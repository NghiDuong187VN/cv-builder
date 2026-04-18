import { CV, CVSection } from '@/lib/types';

// Creative template: Bold sidebar, vibrant colors, for designers & marketers
const VI: Record<string,string> = { summary:'Về Tôi', experience:'Kinh Nghiệm', education:'Học Vấn', skills:'Kỹ Năng', projects:'Dự Án', languages:'Ngoại Ngữ', interests:'Sở Thích', contact:'Liên Hệ' };
const EN: Record<string,string> = { summary:'About Me', experience:'Experience', education:'Education', skills:'Skills', projects:'Projects', languages:'Languages', interests:'Interests', contact:'Contact' };
const t = (lang: string, k: string) => (lang==='en'?EN:VI)[k] ?? k;

export default function CreativeTemplate({ cv }: { cv: CV }) {
  const primary = cv.theme?.primaryColor || '#ec4899';
  const secondary = cv.theme?.secondaryColor || '#f59e0b';
  const font = cv.theme?.font || 'Montserrat, Plus Jakarta Sans';
  const fontStack = `${font}, "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif`;
  const lang = cv.language || 'vi';
  const sections = (cv.sections?.order || []) as CVSection[];
  const vis = cv.sections?.visibility || {};
  const info = cv.content?.personalInfo;

  return (
    <div style={{ fontFamily: fontStack, color: '#1e1e2e', minHeight: '297mm', background: 'white', display: 'flex' }}>
      {/* SIDEBAR */}
      <div style={{ width: '38%', background: `linear-gradient(180deg, ${primary}, ${secondary})`, padding: '40px 24px', color: 'white', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {/* BG decoration */}
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

        {/* Avatar */}
        {cv.theme?.showAvatar && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            {info?.avatarUrl ? (
              <img src={info.avatarUrl} alt="avatar" style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} />
            ) : (
              <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', border: '4px solid rgba(255,255,255,0.6)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                {info?.fullName?.charAt(0) || '?'}
              </div>
            )}
          </div>
        )}

        {/* Name */}
        <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontWeight: 900, fontSize: '1.4rem', margin: 0, marginBottom: '6px', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
            {info?.fullName || 'Họ Và Tên'}
          </h1>
          <p style={{ fontSize: '0.82rem', opacity: 0.9, fontWeight: 500, margin: 0 }}>{info?.jobTitle || cv.targetJob || 'Vị trí'}</p>
        </div>

        {/* Contact */}
        <div style={{ marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <SideTitle title={t(lang,'contact')} />
          {info?.email && <SideItem icon="✉" text={info.email} />}
          {info?.phone && <SideItem icon="📱" text={info.phone} />}
          {info?.address && <SideItem icon="📍" text={info.address} />}
          {info?.linkedin && <SideItem icon="in" text="LinkedIn" link={`https://${info.linkedin}`} />}
          {info?.github && <SideItem icon="⌥" text="GitHub" link={`https://${info.github}`} />}
          {info?.website && <SideItem icon="🌐" text="Portfolio" link={info.website} />}
        </div>

        {/* Skills */}
        {vis.skills !== false && cv.content?.skills?.length > 0 && (
          <div style={{ marginBottom: '24px', position: 'relative', zIndex: 1 }}>
            <SideTitle title={t(lang,'skills')} />
            {cv.content.skills.map((sk, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0, marginBottom: '4px' }}>{sk.name}</p>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.3)', borderRadius: '3px' }}>
                  <div style={{ height: '100%', width: `${sk.level}%`, background: 'white', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Languages */}
        {vis.languages !== false && cv.content?.languages?.length > 0 && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <SideTitle title={t(lang,'languages')} />
            {cv.content.languages.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>{l.name}</span>
                <span style={{ opacity: 0.8 }}>{l.level}</span>
              </div>
            ))}
          </div>
        )}

        {/* Interests */}
        {vis.interests !== false && cv.content?.interests?.length > 0 && (
          <div style={{ marginTop: '24px', position: 'relative', zIndex: 1 }}>
            <SideTitle title={t(lang,'interests')} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {cv.content.interests.map((int, i) => (
                <span key={i} style={{ fontSize: '0.72rem', padding: '3px 8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', fontWeight: 600 }}>{int}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '40px 32px' }}>
        {sections.map(section => {
          if (vis[section] === false) return null;

          const MainTitle = ({ title }: { title: string }) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '8px', height: '24px', background: `linear-gradient(135deg,${primary},${secondary})`, borderRadius: '4px' }} />
              <h3 style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '1.5px', color: '#1e1e2e', textTransform: 'uppercase', margin: 0 }}>{title}</h3>
            </div>
          );

          if (section === 'summary' && cv.content?.summary) {
            return (
              <div key="summary" style={{ marginBottom: '28px' }}>
                <MainTitle title={t(lang,'summary')} />
                <p style={{ fontSize: '0.88rem', lineHeight: 1.8, color: '#475569' }}>{cv.content.summary}</p>
              </div>
            );
          }

          if (section === 'experience' && cv.content?.experience?.length > 0) {
            return (
              <div key="experience" style={{ marginBottom: '28px' }}>
                <MainTitle title={t(lang,'experience')} />
                {cv.content.experience.map((exp, i) => (
                  <div key={exp.id} style={{ marginBottom: '16px', position: 'relative', paddingLeft: '16px' }}>
                    <div style={{ position: 'absolute', left: 0, top: '6px', width: '6px', height: '6px', borderRadius: '50%', background: primary }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e1e2e' }}>{exp.role}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{exp.from}–{exp.current?'Nay':exp.to}</span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '0.82rem', color: primary, marginBottom: '6px' }}>{exp.company}</p>
                    {exp.description && <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: '#475569', whiteSpace: 'pre-wrap' }}>{exp.description}</p>}
                  </div>
                ))}
              </div>
            );
          }

          if (section === 'education' && cv.content?.education?.length > 0) {
            return (
              <div key="education" style={{ marginBottom: '28px' }}>
                <MainTitle title={t(lang,'education')} />
                {cv.content.education.map((edu, i) => (
                  <div key={edu.id} style={{ marginBottom: '12px', paddingLeft: '16px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: '6px', width: '6px', height: '6px', borderRadius: '50%', background: secondary }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e1e2e' }}>{edu.school}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{edu.from}–{edu.to}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{edu.degree} {edu.field && `· ${edu.field}`} {edu.gpa && `· GPA: ${edu.gpa}`}</p>
                  </div>
                ))}
              </div>
            );
          }

          if (section === 'projects' && cv.content?.projects?.length > 0) {
            return (
              <div key="projects" style={{ marginBottom: '28px' }}>
                <MainTitle title={t(lang,'projects')} />
                {cv.content.projects.map((proj, i) => (
                  <div key={proj.id} style={{ marginBottom: '14px', padding: '12px', borderRadius: '10px', border: `1px solid ${primary}30`, background: `${primary}06` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e1e2e' }}>{proj.name}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {proj.url && <a href={proj.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: primary, fontWeight: 700 }}>Demo↗</a>}
                        {proj.github && <a href={`https://${proj.github}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#64748b' }}>Code↗</a>}
                      </div>
                    </div>
                    {proj.technologies.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                        {proj.technologies.map(tech => <span key={tech} style={{ fontSize: '0.68rem', padding: '2px 6px', background: `${primary}15`, color: primary, borderRadius: '4px', fontWeight: 700 }}>{tech}</span>)}
                      </div>
                    )}
                    {proj.description && <p style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#475569' }}>{proj.description}</p>}
                  </div>
                ))}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

function SideTitle({ title }: { title: string }) {
  return <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px', opacity: 0.85, paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>{title}</p>;
}
function SideItem({ icon, text, link }: { icon: string; text: string; link?: string }) {
  const content = <span style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{text}</span>;
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '7px', opacity: 0.9 }}>
      <span style={{ fontSize: '0.7rem', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
      {link ? <a href={link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'white' }}>{content}</a> : content}
    </div>
  );
}
