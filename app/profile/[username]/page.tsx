'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfileByUsername, incrementProfileView } from '@/lib/firestore';
import { Profile } from '@/lib/types';
import { MapPin, Mail, Phone, Globe, GitFork, ExternalLink, Download } from 'lucide-react';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PublicProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfileByUsername(params.username).then(data => {
      setProfile(data);
      setLoading(false);
      if (data) incrementProfileView(data.uid);
    });
  }, [params.username]);

  if (loading) return <LoadingProfile />;
  if (!profile) return <NotFoundProfile username={params.username} />;

  const primaryColor = '#6366f1';

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', paddingTop: '68px' }}>
        {/* Hero Header */}
        <div style={{
          background: `linear-gradient(135deg, ${primaryColor}, #8b5cf6, #ec4899)`,
          padding: '60px 24px 80px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt={profile.fullName} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.8)', marginBottom: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} />
              : <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '4px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2.5rem' }}>
                  {profile.fullName.charAt(0)}
                </div>
            }
            <h1 style={{ fontWeight: 800, fontSize: '2rem', color: 'white', marginBottom: '8px' }}>{profile.fullName}</h1>
            {profile.jobTitle && <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>{profile.jobTitle}</p>}
            {profile.slogan && <p style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 16px' }}>&ldquo;{profile.slogan}&rdquo;</p>}
            {profile.location && (
              <p style={{ color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', fontSize: '0.9rem' }}>
                <MapPin size={14} /> {profile.location}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="container" style={{ maxWidth: '800px', padding: '0 24px' }}>
          {/* Contact + Social */}
          <div className="card" style={{ padding: '24px', marginTop: '-32px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            {profile.email && <ContactChip icon={<Mail size={14} />} label={profile.email} href={`mailto:${profile.email}`} />}
            {profile.phone && <ContactChip icon={<Phone size={14} />} label={profile.phone} href={`tel:${profile.phone}`} />}
            {profile.socials?.linkedin && <ContactChip icon={<ExternalLink size={14} />} label="LinkedIn" href={profile.socials.linkedin} />}
            {profile.socials?.github && <ContactChip icon={<GitFork size={14} />} label="GitHub" href={profile.socials.github} />}
            {profile.socials?.website && <ContactChip icon={<Globe size={14} />} label="Website" href={profile.socials.website} />}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {profile.bio && (
                <ProfileSection title="Giới thiệu" color={primaryColor}>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>{profile.bio}</p>
                </ProfileSection>
              )}

              {profile.skills?.length > 0 && (
                <ProfileSection title="Kỹ năng" color={primaryColor}>
                  {profile.skills.map((skill, i) => (
                    <div key={i} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{skill.name}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{skill.level}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${skill.level}%`, background: `linear-gradient(90deg, ${primaryColor}, #ec4899)` }} />
                      </div>
                    </div>
                  ))}
                </ProfileSection>
              )}

              {profile.interests?.length > 0 && (
                <ProfileSection title="Sở thích" color={primaryColor}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {profile.interests.map((interest, i) => (
                      <span key={i} className="badge badge-primary">{interest}</span>
                    ))}
                  </div>
                </ProfileSection>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {profile.experience?.length > 0 && (
                <ProfileSection title="Kinh nghiệm" color={primaryColor}>
                  {profile.experience.map((exp, i) => (
                    <div key={i} style={{ marginBottom: '16px', paddingLeft: '14px', borderLeft: `3px solid ${primaryColor}` }}>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px' }}>{exp.role}</p>
                      <p style={{ color: primaryColor, fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px' }}>{exp.company}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{exp.from} – {exp.to || 'Hiện tại'}</p>
                      {exp.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginTop: '4px', lineHeight: 1.6 }}>{exp.description}</p>}
                    </div>
                  ))}
                </ProfileSection>
              )}

              {profile.education?.length > 0 && (
                <ProfileSection title="Học vấn" color={primaryColor}>
                  {profile.education.map((edu, i) => (
                    <div key={i} style={{ marginBottom: '14px' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.92rem' }}>{edu.school}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{edu.degree} {edu.field && `• ${edu.field}`}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{edu.from} – {edu.to}</p>
                    </div>
                  ))}
                </ProfileSection>
              )}

              {profile.projects?.length > 0 && (
                <ProfileSection title="Dự án" color={primaryColor}>
                  {profile.projects.map((proj, i) => (
                    <div key={i} className="card" style={{ padding: '14px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{proj.name}</p>
                        {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor }}><ExternalLink size={14} /></a>}
                      </div>
                      {proj.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.6 }}>{proj.description}</p>}
                      {proj.technologies?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                          {proj.technologies.map((t, j) => <span key={j} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: primaryColor, fontWeight: 600 }}>{t}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </ProfileSection>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="card" style={{ padding: '20px 24px', margin: '24px 0 48px', display: 'flex', gap: '32px', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)' }}>{profile.viewCount || 0}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Lượt xem</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)' }}>{profile.downloadCount || 0}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Lượt tải</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)' }}>{profile.experience?.length || 0}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Kinh nghiệm</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function ContactChip({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '6px 14px', borderRadius: '9999px',
      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
      color: 'var(--primary)', fontWeight: 600, fontSize: '0.82rem',
      textDecoration: 'none', transition: 'var(--transition)',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
    >
      {icon} {label}
    </a>
  );
}

function ProfileSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ width: '4px', height: '20px', borderRadius: '2px', background: color }} />
        <h2 style={{ fontWeight: 800, fontSize: '1rem' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function LoadingProfile() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: '68px' }}>
      <div className="skeleton" style={{ height: '240px', borderRadius: '0' }} />
      <div className="container" style={{ padding: '24px', maxWidth: '800px' }}>
        <div className="skeleton" style={{ height: '100px', borderRadius: '16px', marginTop: '-32px', marginBottom: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />)}
        </div>
      </div>
    </div>
  );
}

function NotFoundProfile({ username }: { username: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
      <div>
        <p style={{ fontSize: '4rem', marginBottom: '16px' }}>😕</p>
        <h1 style={{ fontWeight: 800, fontSize: '1.6rem', marginBottom: '8px' }}>Không tìm thấy profile</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Profile &quot;@{username}&quot; không tồn tại hoặc chưa được công khai.</p>
        <Link href="/" className="btn btn-primary">Về trang chủ</Link>
      </div>
    </div>
  );
}
