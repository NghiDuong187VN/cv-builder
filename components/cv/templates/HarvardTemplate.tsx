import { CV, CVSection } from '@/lib/types';

// Harvard template: classic black & white, Serif font, 1 column academic style
const VI: Record<string,string> = { summary:'MỤC TIÊU', experience:'KINH NGHIỆM LÀM VIỆC', education:'HỌC VẤN', skills:'KỸ NĂNG', projects:'DỰ ÁN', languages:'NGOẠI NGỮ', interests:'SỞ THÍCH' };
const EN: Record<string,string> = { summary:'OBJECTIVE', experience:'WORK EXPERIENCE', education:'EDUCATION', skills:'SKILLS', projects:'PROJECTS', languages:'LANGUAGES', interests:'INTERESTS' };
const t = (lang: string, k: string) => (lang==='en'?EN:VI)[k] ?? k.toUpperCase();

export default function HarvardTemplate({ cv }: { cv: CV }) {
  const font = cv.theme?.font || 'Georgia, serif';
  const lang = cv.language || 'vi';
  const sections = (cv.sections?.order || []) as CVSection[];
  const vis = cv.sections?.visibility || {};
  const info = cv.content?.personalInfo;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ borderBottom: '2px solid #1a1a1a', marginBottom: '10px', paddingBottom: '4px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '2.5px', color: '#1a1a1a', margin: 0, fontFamily: 'Arial, sans-serif' }}>{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ fontFamily: font, color: '#1a1a1a', minHeight: '297mm', background: 'white', padding: '48px 60px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #1a1a1a' }}>
        <h1 style={{ fontWeight: 700, fontSize: '1.8rem', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, marginBottom: '8px', color: '#1a1a1a' }}>
          {info?.fullName || 'HỌ VÀ TÊN'}
        </h1>
        {(info?.jobTitle || cv.targetJob) && (
          <p style={{ fontStyle: 'italic', fontSize: '0.95rem', color: '#444', margin: 0, marginBottom: '10px' }}>
            {info?.jobTitle || cv.targetJob}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: '#444' }}>
          {info?.email && <span>{info.email}</span>}
          {info?.phone && <span>• {info.phone}</span>}
          {info?.address && <span>• {info.address}</span>}
          {info?.linkedin && <span>• {info.linkedin}</span>}
          {info?.github && <span>• {info.github}</span>}
        </div>
      </div>

      {sections.map(section => {
        if (vis[section] === false) return null;

        if (section === 'summary' && cv.content?.summary) {
          return (
            <Section key="summary" title={t(lang,'summary')}>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.8, textAlign: 'justify', color: '#222' }}>{cv.content.summary}</p>
            </Section>
          );
        }

        if (section === 'education' && cv.content?.education?.length > 0) {
          return (
            <Section key="education" title={t(lang,'education')}>
              {cv.content.education.map((edu, i) => (
                <div key={edu.id} style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0, marginBottom: '2px' }}>{edu.school}</p>
                    <p style={{ fontStyle: 'italic', fontSize: '0.83rem', color: '#444', margin: 0 }}>{edu.degree} {edu.field && `in ${edu.field}`} {edu.gpa && `· GPA: ${edu.gpa}`}</p>
                    {edu.achievements && <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '2px' }}>{edu.achievements}</p>}
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#555', whiteSpace: 'nowrap', fontStyle: 'italic' }}>{edu.from} – {edu.to}</span>
                </div>
              ))}
            </Section>
          );
        }

        if (section === 'experience' && cv.content?.experience?.length > 0) {
          return (
            <Section key="experience" title={t(lang,'experience')}>
              {cv.content.experience.map((exp, i) => (
                <div key={exp.id} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{exp.company}</span>
                      {exp.location && <span style={{ fontSize: '0.83rem', color: '#555', fontStyle: 'italic' }}> · {exp.location}</span>}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontStyle: 'italic', color: '#555' }}>{exp.from} – {exp.current ? 'Present' : exp.to}</span>
                  </div>
                  <p style={{ fontStyle: 'italic', fontSize: '0.85rem', margin: '2px 0 6px' }}>{exp.role}</p>
                  {exp.description && (
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {exp.description.split('\n').filter(Boolean).map((line, j) => (
                        <li key={j} style={{ fontSize: '0.83rem', lineHeight: 1.7, color: '#333' }}>{line.replace(/^[-•]\s*/, '')}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          );
        }

        if (section === 'skills' && cv.content?.skills?.length > 0) {
          return (
            <Section key="skills" title={t(lang,'skills')}>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: '#333' }}>
                {cv.content.skills.map(s => s.name).join(' • ')}
              </p>
            </Section>
          );
        }

        if (section === 'projects' && cv.content?.projects?.length > 0) {
          return (
            <Section key="projects" title={t(lang,'projects')}>
              {cv.content.projects.map((proj, i) => (
                <div key={proj.id} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{proj.name}</span>
                    {proj.url && <a href={proj.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#1a1a1a' }}>{proj.url}</a>}
                  </div>
                  {proj.role && <p style={{ fontStyle: 'italic', fontSize: '0.83rem', color: '#444', margin: '2px 0' }}>{proj.role}</p>}
                  {proj.technologies.length > 0 && <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '4px' }}>Tech: {proj.technologies.join(', ')}</p>}
                  {proj.description && <p style={{ fontSize: '0.83rem', lineHeight: 1.7, color: '#333' }}>{proj.description}</p>}
                </div>
              ))}
            </Section>
          );
        }

        if (section === 'languages' && cv.content?.languages?.length > 0) {
          return (
            <Section key="languages" title={t(lang,'languages')}>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
                {cv.content.languages.map(l => `${l.name} (${l.level})`).join(' • ')}
              </p>
            </Section>
          );
        }

        return null;
      })}
    </div>
  );
}
