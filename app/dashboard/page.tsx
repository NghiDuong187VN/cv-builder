'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Eye, Download, TrendingUp,
  User, Settings, Clock, Sparkles, ArrowRight, Copy,
  Crown, Target, BarChart3, Zap, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getCVsByUser, getProfile } from '@/lib/firestore';
import { CV, Profile } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import PremiumBanner from '@/components/ui/PremiumBanner';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { firebaseUser, user, loading } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const isPremium = user?.plan === 'premium';

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
  const atCvLimit = !isPremium && cvs.length >= 3;

  const stats = [
    { label: 'CV đã tạo', value: cvs.length, icon: FileText, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', suffix: isPremium ? '' : `/3` },
    { label: 'Lượt xem tổng', value: totalViews, icon: Eye, gradient: 'linear-gradient(135deg, #06b6d4, #6366f1)', suffix: '' },
    { label: 'Lượt tải', value: totalDownloads, icon: Download, gradient: 'linear-gradient(135deg, #10b981, #06b6d4)', suffix: '' },
    { label: 'Profile công khai', value: profile?.isPublic ? 1 : 0, icon: TrendingUp, gradient: 'linear-gradient(135deg, #ec4899, #f59e0b)', suffix: '' },
  ];

  const profileCompletion = profile ? calculateCompletion(profile) : 0;
  const missingItems = profile ? getMissingItems(profile) : [];

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '6px' }}>
                  Xin chào, {firebaseUser?.displayName?.split(' ').pop()}! 👋
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  {isPremium
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Crown size={14} color="#f59e0b" /> Tài khoản Premium đang hoạt động</span>
                    : 'Đây là tổng quan hoạt động của bạn.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {atCvLimit ? (
                  <Link href="/pricing" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>
                    <Crown size={16} /> Nâng cấp để tạo thêm
                  </Link>
                ) : (
                  <Link href="/cv/new" className="btn btn-primary">
                    <Plus size={18} /> Tạo CV Mới
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* Smart Premium upsell for free users who have CV with views */}
          {!isPremium && totalViews > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: '24px' }}>
              <PremiumBanner variant="inline" context="analytics" />
            </motion.div>
          )}

          {/* CV limit warning */}
          {atCvLimit && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: '24px' }}>
              <PremiumBanner variant="compact" context="cv-limit" />
            </motion.div>
          )}

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}
          >
            {stats.map(s => (
              <div key={s.label} className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                  }}>
                    <s.icon size={22} color="white" />
                  </div>
                  {s.label === 'CV đã tạo' && !isPremium && (
                    <span style={{ fontSize: '0.72rem', color: cvs.length >= 3 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                      {cvs.length >= 3 ? '⚠ Đã đạt giới hạn' : `${3 - cvs.length} còn lại`}
                    </span>
                  )}
                </div>
                <p style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {s.value}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{s.suffix}</span>
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{s.label}</p>
              </div>
            ))}
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>

            {/* Profile Completion Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="white" />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Hồ sơ cá nhân</h3>
              </div>

              {firebaseUser?.photoURL && (
                <img src={firebaseUser.photoURL} alt="avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', marginBottom: '16px', border: '3px solid var(--primary)', objectFit: 'cover' }} />
              )}
              <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>{firebaseUser?.displayName}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>{firebaseUser?.email}</p>

              {/* Completion bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Độ hoàn thiện profile</span>
                  <span style={{ fontSize: '0.83rem', fontWeight: 800, color: profileCompletion >= 80 ? '#10b981' : 'var(--primary)' }}>{profileCompletion}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${profileCompletion}%` }} />
                </div>
                {profileCompletion < 100 && missingItems.length > 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Thiếu: {missingItems.slice(0, 2).join(', ')}{missingItems.length > 2 ? ` +${missingItems.length - 2}` : ''}
                  </p>
                )}
              </div>

              <Link href="/profile/edit" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                Chỉnh sửa Profile <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* CV Score Card (Premium teaser) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: isPremium ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.08)', filter: 'blur(20px)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isPremium ? 'var(--gradient-primary)' : 'linear-gradient(135deg, #f59e0b, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={20} color="white" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>CV Score</h3>
                  {!isPremium && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '1px 8px', borderRadius: '9999px', background: 'linear-gradient(135deg, #f59e0b, #ec4899)', color: 'white' }}>
                      PREMIUM
                    </span>
                  )}
                </div>
              </div>

              {isPremium ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeDasharray={`${Math.PI * 80 * 0.72} ${Math.PI * 80}`} strokeLinecap="round" />
                        <defs>
                          <linearGradient id="scoreGrad">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>72</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ 100</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'Bố cục', score: 90 },
                      { label: 'Nội dung', score: 65 },
                      { label: 'Từ khóa ATS', score: 55 },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444' }}>{item.score}%</span>
                        </div>
                        <div style={{ height: '4px', borderRadius: '9999px', background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.score}%`, background: item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444', borderRadius: '9999px', transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ filter: 'blur(4px)', pointerEvents: 'none', opacity: 0.5 }}>
                  {/* Blurred teaser */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--primary)' }}>--</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['Bố cục', 'Nội dung', 'ATS'].map(label => (
                      <div key={label} style={{ height: '18px', borderRadius: '4px', background: 'var(--border)' }} />
                    ))}
                  </div>
                </div>
              )}

              {!isPremium && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Crown size={28} color="#f59e0b" />
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', textAlign: 'center' }}>
                    Chấm điểm CV của bạn
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.4, maxWidth: '180px' }}>
                    Biết điểm yếu và cải thiện trước khi ứng tuyển
                  </p>
                  <Link href="/pricing" className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>
                    Mở khóa CV Score
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '20px' }}>⚡ Thao tác nhanh</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { href: '/cv/new', icon: Plus, label: 'Tạo CV mới', desc: 'Bắt đầu từ mẫu trống hoặc template', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', locked: atCvLimit },
                  { href: '/templates', icon: Sparkles, label: 'Khám phá mẫu CV', desc: '50+ mẫu đẹp theo ngành nghề', gradient: 'linear-gradient(135deg, #ec4899, #f59e0b)', locked: false },
                  { href: '/profile/edit', icon: Settings, label: 'Hoàn thiện profile', desc: 'Thêm kỹ năng, kinh nghiệm, dự án', gradient: 'linear-gradient(135deg, #10b981, #06b6d4)', locked: false },
                  ...(!isPremium ? [{
                    href: '/pricing', icon: Crown, label: 'Nâng cấp Premium', desc: 'AI viết CV, ATS Optimizer, Templates cao cấp', gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)', locked: false, isPremiumCta: true,
                  }] : []),
                ].map(({ href, icon: Icon, label, desc, gradient, locked, isPremiumCta }) => (
                  <Link key={href} href={locked ? '/pricing' : href} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '13px', borderRadius: '12px',
                    background: isPremiumCta ? 'rgba(245,158,11,0.06)' : 'rgba(99,102,241,0.04)',
                    border: `1px solid ${isPremiumCta ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
                    textDecoration: 'none', transition: 'var(--transition)',
                    opacity: locked ? 0.6 : 1,
                  }}
                    onMouseEnter={e => {
                      if (!locked) {
                        (e.currentTarget as HTMLElement).style.background = isPremiumCta ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.08)';
                        (e.currentTarget as HTMLElement).style.borderColor = isPremiumCta ? 'rgba(245,158,11,0.4)' : 'var(--primary)';
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = isPremiumCta ? 'rgba(245,158,11,0.06)' : 'rgba(99,102,241,0.04)';
                      (e.currentTarget as HTMLElement).style.borderColor = isPremiumCta ? 'rgba(245,158,11,0.2)' : 'var(--border)';
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{label}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{desc}</p>
                    </div>
                    <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* AI Features teaser for free users */}
          {!isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{ marginBottom: '28px' }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #1a0533 0%, #0f172a 50%, #0a1628 100%)',
                borderRadius: '20px', padding: '28px 32px',
                border: '1px solid rgba(139,92,246,0.2)',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Sparkles size={18} color="#8b5cf6" />
                    <span style={{ fontWeight: 700, color: 'white', fontSize: '0.88rem' }}>Tính năng AI cao cấp</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px', borderRadius: '9999px', background: 'linear-gradient(135deg, #f59e0b, #ec4899)', color: 'white' }}>PREMIUM</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.83rem', lineHeight: 1.6 }}>
                    Nâng cấp để truy cập AI viết CV, ATS Optimizer và nhiều hơn nữa.
                  </p>
                </div>
                {[
                  { icon: Zap, label: 'AI viết lại nội dung CV' },
                  { icon: Target, label: 'ATS Optimizer' },
                  { icon: BarChart3, label: 'Chấm điểm & gợi ý CV' },
                  { icon: CheckCircle2, label: 'Cover Letter AI' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color="#a5b4fc" />
                    </div>
                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{label}</span>
                  </div>
                ))}
                <Link
                  href="/pricing"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '12px 20px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                    color: 'white', fontWeight: 700, fontSize: '0.88rem',
                    textDecoration: 'none', boxShadow: '0 6px 20px rgba(245,158,11,0.4)',
                    transition: 'all 0.25s', whiteSpace: 'nowrap',
                  }}
                >
                  <Crown size={15} /> Xem gói Premium
                </Link>
              </div>
            </motion.div>
          )}

          {/* Recent CVs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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

function getMissingItems(profile: Profile): string[] {
  const missing: string[] = [];
  if (!profile.bio) missing.push('Giới thiệu bản thân');
  if (!profile.jobTitle) missing.push('Vị trí công việc');
  if (!profile.phone) missing.push('Số điện thoại');
  if (!profile.location) missing.push('Địa chỉ');
  if (!profile.skills?.length) missing.push('Kỹ năng');
  if (!profile.education?.length) missing.push('Học vấn');
  if (!profile.experience?.length) missing.push('Kinh nghiệm');
  if (!profile.socials?.linkedin && !profile.socials?.github) missing.push('Mạng xã hội');
  return missing;
}
