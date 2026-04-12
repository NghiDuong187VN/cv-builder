'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Eye, Download, TrendingUp,
  User, Settings, Clock, Sparkles, ArrowRight, Copy
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getCVsByUser, getProfile } from '@/lib/firestore';
import { CV, Profile } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !firebaseUser) router.push('/auth');
  }, [loading, firebaseUser, router]);

  useEffect(() => {
    if (firebaseUser) {
      Promise.all([
        getCVsByUser(firebaseUser.uid),
        getProfile(firebaseUser.uid),
      ]).then(([cvsData, profileData]) => {
        setCvs(cvsData);
        setProfile(profileData);
        setDataLoading(false);
      });
    }
  }, [firebaseUser]);

  const totalViews = cvs.reduce((sum, cv) => sum + (cv.viewCount || 0), 0);
  const totalDownloads = cvs.reduce((sum, cv) => sum + (cv.downloadCount || 0), 0);

  const stats = [
    { label: 'CV đã tạo', value: cvs.length, icon: FileText, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', bg: 'rgba(99,102,241,0.08)' },
    { label: 'Lượt xem', value: totalViews, icon: Eye, gradient: 'linear-gradient(135deg, #06b6d4, #6366f1)', bg: 'rgba(6,182,212,0.08)' },
    { label: 'Lượt tải', value: totalDownloads, icon: Download, gradient: 'linear-gradient(135deg, #10b981, #06b6d4)', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Profile công khai', value: profile?.isPublic ? 1 : 0, icon: TrendingUp, gradient: 'linear-gradient(135deg, #ec4899, #f59e0b)', bg: 'rgba(236,72,153,0.08)' },
  ];

  const profileCompletion = profile ? calculateCompletion(profile) : 0;

  if (loading || dataLoading) {
    return (
      <>
        <Navbar />
        <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="skeleton" style={{ width: '200px', height: '32px', margin: '0 auto 16px' }} />
            <div className="skeleton" style={{ width: '300px', height: '18px', margin: '0 auto' }} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <div className="container" style={{ padding: '40px 24px' }}>

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '32px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '6px' }}>
                  Xin chào, {firebaseUser?.displayName?.split(' ').pop()}! 👋
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Đây là tổng quan hoạt động của bạn.
                </p>
              </div>
              <Link href="/cv/new" className="btn btn-primary">
                <Plus size={18} /> Tạo CV Mới
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}
          >
            {stats.map((s, i) => (
              <div key={s.label} className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 12px ${s.bg.replace('0.08', '0.4')}`,
                  }}>
                    <s.icon size={22} color="white" />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>

            {/* Profile Completion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
              style={{ padding: '28px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="white" />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Hồ sơ cá nhân</h3>
              </div>

              {/* Avatar */}
              {firebaseUser?.photoURL && (
                <img src={firebaseUser.photoURL} alt="avatar" style={{
                  width: '64px', height: '64px', borderRadius: '50%', marginBottom: '16px',
                  border: '3px solid var(--primary)', objectFit: 'cover',
                }} />
              )}
              <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>{firebaseUser?.displayName}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>{firebaseUser?.email}</p>

              {/* Completion bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Độ hoàn thiện profile</span>
                  <span style={{ fontSize: '0.83rem', fontWeight: 800, color: 'var(--primary)' }}>{profileCompletion}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${profileCompletion}%` }} />
                </div>
              </div>

              <Link href="/profile/edit" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                Chỉnh sửa Profile <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card"
              style={{ padding: '28px' }}
            >
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '20px' }}>⚡ Thao tác nhanh</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { href: '/cv/new', icon: Plus, label: 'Tạo CV mới', desc: 'Bắt đầu từ mẫu trống hoặc template', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
                  { href: '/templates', icon: Sparkles, label: 'Khám phá mẫu CV', desc: '50+ mẫu đẹp, miễn phí & premium', gradient: 'linear-gradient(135deg, #ec4899, #f59e0b)' },
                  { href: '/profile/edit', icon: Settings, label: 'Hoàn thiện profile', desc: 'Thêm kỹ năng, kinh nghiệm, dự án', gradient: 'linear-gradient(135deg, #10b981, #06b6d4)' },
                ].map(({ href, icon: Icon, label, desc, gradient }) => (
                  <Link key={href} href={href} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px', borderRadius: '12px',
                    background: 'rgba(99,102,241,0.04)',
                    border: '1px solid var(--border)',
                    textDecoration: 'none', transition: 'var(--transition)',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color="white" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{desc}</p>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent CVs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                <Clock size={18} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--primary)' }} />
                CV của bạn
              </h2>
              <Link href="/cv" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>
                Xem tất cả →
              </Link>
            </div>

            {cvs.length === 0 ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>Chưa có CV nào</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.92rem' }}>
                  Tạo CV đầu tiên của bạn ngay bây giờ!
                </p>
                <Link href="/cv/new" className="btn btn-primary">
                  <Plus size={18} /> Tạo CV đầu tiên
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {cvs.slice(0, 6).map(cv => (
                  <CVCard key={cv.cvId} cv={cv} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}

function CVCard({ cv }: { cv: CV }) {
  const handleCopyLink = () => {
    if (cv.isPublic && cv.shareSlug) {
      navigator.clipboard.writeText(`${window.location.origin}/cv/${cv.shareSlug}/view`);
      toast.success('Đã sao chép link!');
    } else {
      toast.error('CV này chưa được công khai');
    }
  };

  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* Template color bar */}
      <div style={{
        height: '6px', borderRadius: '3px',
        background: cv.theme?.primaryColor
          ? `linear-gradient(90deg, ${cv.theme.primaryColor}, ${cv.theme.secondaryColor || '#8b5cf6'})`
          : 'var(--gradient-primary)',
        marginBottom: '14px',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', flex: 1, marginRight: '8px' }}>
          {cv.title}
        </h4>
        {cv.isPublic && (
          <span className="badge badge-free" style={{ fontSize: '0.7rem', flexShrink: 0 }}>Công khai</span>
        )}
      </div>

      {cv.targetJob && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
          🎯 {cv.targetJob} {cv.targetCompany && `• ${cv.targetCompany}`}
        </p>
      )}

      <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        <span><Eye size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{cv.viewCount}</span>
        <span><Download size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{cv.downloadCount}</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Link href={`/cv/${cv.cvId}/edit`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
          Chỉnh sửa
        </Link>
        <button onClick={handleCopyLink} className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>
          <Copy size={14} />
        </button>
      </div>
    </div>
  );
}

function calculateCompletion(profile: Profile): number {
  let score = 0;
  const checks = [
    profile.fullName, profile.jobTitle, profile.bio,
    profile.phone, profile.location, profile.avatarUrl,
    profile.skills?.length > 0,
    profile.education?.length > 0,
    profile.experience?.length > 0,
    profile.socials?.linkedin || profile.socials?.github,
  ];
  checks.forEach(c => { if (c) score += 10; });
  return score;
}
