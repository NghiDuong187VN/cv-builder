'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, User, Loader } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, saveProfile } from '@/lib/firestore';
import { Profile, Skill, Experience, Education, Project } from '@/lib/types';
import toast from 'react-hot-toast';
import type { User as FirebaseUser } from 'firebase/auth';

const EMPTY_PROFILE: Partial<Profile> = {
  isPublic: false,
  fullName: '',
  jobTitle: '',
  bio: '',
  phone: '',
  email: '',
  location: '',
  slogan: '',
  skills: [],
  education: [],
  experience: [],
  projects: [],
  certificates: [],
  activities: [],
  interests: [],
  languages: [],
  socials: {},
};

export default function ProfileEditPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();
  const [profile, setProfile] = useState<Partial<Profile>>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('basic');

  useEffect(() => {
    if (!loading && !firebaseUser) router.push('/auth');
  }, [loading, firebaseUser, router]);

  useEffect(() => {
    if (firebaseUser) {
      getProfile(firebaseUser.uid).then(data => {
        if (data) setProfile(data);
        else setProfile({ ...EMPTY_PROFILE, email: firebaseUser.email || '', fullName: firebaseUser.displayName || '' });
      });
    }
  }, [firebaseUser]);

  const update = (field: string, value: unknown) => setProfile(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await saveProfile(firebaseUser.uid, {
        ...profile,
        uid: firebaseUser.uid,
        username: profile.username || firebaseUser.uid.slice(0, 10),
        email: firebaseUser.email || profile.email || '',
      });
      toast.success('Đã lưu profile! 🎉');
    } catch {
      toast.error('Lưu thất bại, thử lại sau');
    }
    setSaving(false);
  };

  const tabs = [
    { key: 'basic', label: '👤 Cơ bản' },
    { key: 'skills', label: '💪 Kỹ năng' },
    { key: 'experience', label: '💼 Kinh nghiệm' },
    { key: 'education', label: '🎓 Học vấn' },
    { key: 'projects', label: '🚀 Dự án' },
    { key: 'socials', label: '🌐 Mạng xã hội' },
  ];

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} /></div>;

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <div className="container" style={{ padding: '40px 24px', maxWidth: '900px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: '6px' }}>✏️ Chỉnh Sửa Profile</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Xây dựng hồ sơ cá nhân ấn tượng của bạn</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Public toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Công khai</span>
                <button
                  onClick={() => update('isPublic', !profile.isPublic)}
                  style={{
                    width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
                    background: profile.isPublic ? 'var(--primary)' : '#e2e8f0',
                    transition: 'all 0.25s', position: 'relative',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px',
                    left: profile.isPublic ? '24px' : '3px',
                    width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                    transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                {saving ? 'Đang lưu...' : 'Lưu Profile'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '10px 18px', borderRadius: '10px', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap',
                background: tab === t.key ? 'var(--primary)' : 'var(--bg-card)',
                color: tab === t.key ? 'white' : 'var(--text-secondary)',
                border: tab === t.key ? '1px solid transparent' : '1px solid var(--border)',
                transition: 'var(--transition)',
                boxShadow: tab === t.key ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
              }}>{t.label}</button>
            ))}
          </div>

          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {tab === 'basic' && <BasicTab profile={profile} update={update} firebaseUser={firebaseUser} />}
            {tab === 'skills' && <SkillsTab profile={profile} update={update} />}
            {tab === 'experience' && <ExperienceTab profile={profile} update={update} />}
            {tab === 'education' && <EducationTab profile={profile} update={update} />}
            {tab === 'projects' && <ProjectsTab profile={profile} update={update} />}
            {tab === 'socials' && <SocialsTab profile={profile} update={update} />}
          </motion.div>
        </div>
      </div>
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─── Tab Components ───────────────────────────────────────────

function BasicTab({ profile, update, firebaseUser }: { profile: Partial<Profile>; update: (f: string, v: unknown) => void; firebaseUser: FirebaseUser | null }) {
  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Avatar */}
      <div className="card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        {firebaseUser?.photoURL
          ? <img src={firebaseUser.photoURL} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
          : <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={36} color="white" /></div>
        }
        <div>
          <p style={{ fontWeight: 700, marginBottom: '4px' }}>Ảnh đại diện</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '10px' }}>Lấy từ tài khoản Google của bạn</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormField label="Họ và tên *">
          <input className="input" value={profile.fullName || ''} onChange={e => update('fullName', e.target.value)} placeholder="Nguyễn Văn A" />
        </FormField>
        <FormField label="Nghề nghiệp / Vị trí mong muốn">
          <input className="input" value={profile.jobTitle || ''} onChange={e => update('jobTitle', e.target.value)} placeholder="Frontend Developer" />
        </FormField>
        <FormField label="Số điện thoại">
          <input className="input" value={profile.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="0901234567" />
        </FormField>
        <FormField label="Email">
          <input className="input" type="email" value={profile.email || ''} onChange={e => update('email', e.target.value)} placeholder="you@email.com" />
        </FormField>
        <FormField label="Địa chỉ" style={{ gridColumn: 'span 2' }}>
          <input className="input" value={profile.location || ''} onChange={e => update('location', e.target.value)} placeholder="Hà Nội, Việt Nam" />
        </FormField>
        <FormField label="Slogan nghề nghiệp" style={{ gridColumn: 'span 2' }}>
          <input className="input" value={profile.slogan || ''} onChange={e => update('slogan', e.target.value)} placeholder="Turning ideas into reality, one line of code at a time" />
        </FormField>
        <FormField label="Giới thiệu bản thân" style={{ gridColumn: 'span 2' }}>
          <textarea className="input" rows={5} value={profile.bio || ''} onChange={e => update('bio', e.target.value)} placeholder="Mô tả ngắn về bản thân, đam mê, và mục tiêu nghề nghiệp..." style={{ resize: 'vertical' }} />
        </FormField>
        <FormField label="Sở thích" style={{ gridColumn: 'span 2' }}>
          <input className="input" value={(profile.interests || []).join(', ')} onChange={e => update('interests', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Đọc sách, Lập trình, Du lịch (cách nhau bởi dấu phẩy)" />
        </FormField>
      </div>
    </div>
  );
}

function SkillsTab({ profile, update }: { profile: Partial<Profile>; update: (f: string, v: unknown) => void }) {
  const skills = profile.skills || [];
  const addSkill = () => update('skills', [...skills, { name: '', level: 80 }]);
  const removeSkill = (i: number) => update('skills', skills.filter((_, j) => j !== i));
  const updateSkill = (i: number, field: string, value: string | number) => {
    const s = [...skills]; s[i] = { ...s[i], [field]: value }; update('skills', s);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {skills.map((skill, i) => (
        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input className="input" value={skill.name} style={{ flex: 3 }} placeholder="Tên kỹ năng (VD: React, Python...)"
            onChange={e => updateSkill(i, 'name', e.target.value)} />
          <input type="number" min={0} max={100} className="input" value={skill.level} style={{ flex: 1 }} placeholder="Mức độ (0-100)"
            onChange={e => updateSkill(i, 'level', Number(e.target.value))} />
          <div style={{ flex: 2, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${skill.level}%`, background: 'var(--gradient-primary)', transition: 'width 0.3s' }} />
          </div>
          <button onClick={() => removeSkill(i)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', color: '#ef4444' }}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button className="btn btn-outline btn-sm" onClick={addSkill} style={{ alignSelf: 'flex-start' }}>
        <Plus size={16} /> Thêm kỹ năng
      </button>
    </div>
  );
}

function ExperienceTab({ profile, update }: { profile: Partial<Profile>; update: (f: string, v: unknown) => void }) {
  const list = profile.experience || [];
  const add = () => update('experience', [...list, { id: Date.now().toString(), company: '', role: '', from: '', to: '', current: false, description: '' }]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {list.map((exp, i) => (
        <div key={i} className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <FormField label="Tên công ty">
              <input className="input" value={exp.company} placeholder="Google, FPT..."
                onChange={e => { const l = [...list]; l[i] = { ...l[i], company: e.target.value }; update('experience', l); }} />
            </FormField>
            <FormField label="Vị trí / Chức danh">
              <input className="input" value={exp.role} placeholder="Frontend Developer"
                onChange={e => { const l = [...list]; l[i] = { ...l[i], role: e.target.value }; update('experience', l); }} />
            </FormField>
            <FormField label="Từ">
              <input className="input" value={exp.from} placeholder="01/2023"
                onChange={e => { const l = [...list]; l[i] = { ...l[i], from: e.target.value }; update('experience', l); }} />
            </FormField>
            <FormField label="Đến (bỏ trống nếu hiện tại)">
              <input className="input" value={exp.to} placeholder="12/2024 hoặc Hiện tại"
                onChange={e => { const l = [...list]; l[i] = { ...l[i], to: e.target.value }; update('experience', l); }} />
            </FormField>
          </div>
          <FormField label="Mô tả công việc">
            <textarea className="input" rows={4} value={exp.description} placeholder="Mô tả các công việc, thành tích, kết quả..."
              style={{ resize: 'vertical' }}
              onChange={e => { const l = [...list]; l[i] = { ...l[i], description: e.target.value }; update('experience', l); }} />
          </FormField>
          <button onClick={() => update('experience', list.filter((_, j) => j !== i))}
            style={{ marginTop: '12px', background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
            <Trash2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Xóa
          </button>
        </div>
      ))}
      <button className="btn btn-outline btn-sm" onClick={add} style={{ alignSelf: 'flex-start' }}>
        <Plus size={16} /> Thêm kinh nghiệm
      </button>
    </div>
  );
}

function EducationTab({ profile, update }: { profile: Partial<Profile>; update: (f: string, v: unknown) => void }) {
  const list = profile.education || [];
  const add = () => update('education', [...list, { id: Date.now().toString(), school: '', degree: '', field: '', from: '', to: '' }]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {list.map((edu, i) => (
        <div key={i} className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Trường học" style={{ gridColumn: 'span 2' }}>
              <input className="input" value={edu.school} placeholder="Đại học Bách Khoa Hà Nội"
                onChange={e => { const l = [...list]; l[i] = { ...l[i], school: e.target.value }; update('education', l); }} />
            </FormField>
            <FormField label="Bằng cấp">
              <input className="input" value={edu.degree} placeholder="Cử nhân, Thạc sĩ..."
                onChange={e => { const l = [...list]; l[i] = { ...l[i], degree: e.target.value }; update('education', l); }} />
            </FormField>
            <FormField label="Ngành học">
              <input className="input" value={edu.field} placeholder="Công nghệ thông tin"
                onChange={e => { const l = [...list]; l[i] = { ...l[i], field: e.target.value }; update('education', l); }} />
            </FormField>
            <FormField label="Từ năm">
              <input className="input" value={edu.from} placeholder="2020"
                onChange={e => { const l = [...list]; l[i] = { ...l[i], from: e.target.value }; update('education', l); }} />
            </FormField>
            <FormField label="Đến năm">
              <input className="input" value={edu.to} placeholder="2024"
                onChange={e => { const l = [...list]; l[i] = { ...l[i], to: e.target.value }; update('education', l); }} />
            </FormField>
          </div>
          <button onClick={() => update('education', list.filter((_, j) => j !== i))}
            style={{ marginTop: '12px', background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
            <Trash2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Xóa
          </button>
        </div>
      ))}
      <button className="btn btn-outline btn-sm" onClick={add} style={{ alignSelf: 'flex-start' }}>
        <Plus size={16} /> Thêm học vấn
      </button>
    </div>
  );
}

function ProjectsTab({ profile, update }: { profile: Partial<Profile>; update: (f: string, v: unknown) => void }) {
  const list = profile.projects || [];
  const add = () => update('projects', [...list, { id: Date.now().toString(), name: '', url: '', description: '', technologies: [] }]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {list.map((proj, i) => (
        <div key={i} className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <FormField label="Tên dự án">
              <input className="input" value={proj.name} placeholder="CVFlow, E-commerce Website..."
                onChange={e => { const l = [...list]; l[i] = { ...l[i], name: e.target.value }; update('projects', l); }} />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="URL demo">
                <input className="input" value={proj.url || ''} placeholder="https://..."
                  onChange={e => { const l = [...list]; l[i] = { ...l[i], url: e.target.value }; update('projects', l); }} />
              </FormField>
              <FormField label="GitHub">
                <input className="input" value={proj.github || ''} placeholder="https://github.com/..."
                  onChange={e => { const l = [...list]; l[i] = { ...l[i], github: e.target.value }; update('projects', l); }} />
              </FormField>
            </div>
            <FormField label="Công nghệ sử dụng">
              <input className="input" value={(proj.technologies || []).join(', ')} placeholder="React, Node.js, Firebase (cách nhau bởi dấu phẩy)"
                onChange={e => { const l = [...list]; l[i] = { ...l[i], technologies: e.target.value.split(',').map(s => s.trim()) }; update('projects', l); }} />
            </FormField>
            <FormField label="Mô tả dự án">
              <textarea className="input" rows={3} value={proj.description} placeholder="Dự án này giải quyết vấn đề gì? Bạn đóng góp gì vào dự án?"
                style={{ resize: 'vertical' }}
                onChange={e => { const l = [...list]; l[i] = { ...l[i], description: e.target.value }; update('projects', l); }} />
            </FormField>
          </div>
          <button onClick={() => update('projects', list.filter((_, j) => j !== i))}
            style={{ marginTop: '12px', background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
            <Trash2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Xóa
          </button>
        </div>
      ))}
      <button className="btn btn-outline btn-sm" onClick={add} style={{ alignSelf: 'flex-start' }}>
        <Plus size={16} /> Thêm dự án
      </button>
    </div>
  );
}

function SocialsTab({ profile, update }: { profile: Partial<Profile>; update: (f: string, v: unknown) => void }) {
  const socials = profile.socials || {};
  const updateSocial = (key: string, val: string) => update('socials', { ...socials, [key]: val });

  return (
    <div style={{ display: 'grid', gap: '16px', maxWidth: '600px' }}>
      {[
        { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname', icon: '💼' },
        { key: 'github', label: 'GitHub', placeholder: 'https://github.com/yourname', icon: '🐙' },
        { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourname', icon: '📘' },
        { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourname', icon: '🐦' },
        { key: 'website', label: 'Website cá nhân', placeholder: 'https://yoursite.com', icon: '🌐' },
        { key: 'portfolio', label: 'Portfolio', placeholder: 'https://behance.net/yourname', icon: '🎨' },
      ].map(({ key, label, placeholder, icon }) => (
        <FormField key={key} label={`${icon} ${label}`}>
          <input className="input" value={(socials as Record<string, string>)[key] || ''} placeholder={placeholder}
            onChange={e => updateSocial(key, e.target.value)} />
        </FormField>
      ))}
    </div>
  );
}

function FormField({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}
