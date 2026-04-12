'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import toast from 'react-hot-toast';
import { LogOut, Save, User } from 'lucide-react';

import Navbar from '@/components/layout/Navbar';
import { signOut } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { User as AppUser } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const { firebaseUser, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !firebaseUser) router.push('/auth');
  }, [loading, firebaseUser, router]);

  if (loading || !firebaseUser || !user) {
    return (
      <>
        <Navbar />
        <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
          <div className="container" style={{ padding: '40px 24px', maxWidth: '680px' }}>
            <div className="skeleton" style={{ height: '24px', width: '220px', borderRadius: '10px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ height: '14px', width: '360px', borderRadius: '10px', marginBottom: '28px' }} />
            <div className="skeleton" style={{ height: '160px', borderRadius: '16px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ height: '140px', borderRadius: '16px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ height: '48px', borderRadius: '14px' }} />
          </div>
        </div>
      </>
    );
  }

  return <SettingsInner firebaseUser={firebaseUser} user={user} />;
}

function SettingsInner({ firebaseUser, user }: { firebaseUser: FirebaseUser; user: AppUser }) {
  const router = useRouter();
  const [language, setLanguage] = useState<'vi' | 'en'>(user.settings?.language || 'vi');
  const [saving, setSaving] = useState(false);

  const saveSettings = async () => {
    setSaving(true);
    await updateDoc(doc(db, 'users', firebaseUser.uid), { 'settings.language': language });
    toast.success('Đã lưu cài đặt!');
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <div className="container" style={{ padding: '40px 24px', maxWidth: '680px' }}>
          <h1 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: '8px' }}>Cài đặt</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Quản lý tài khoản và tuỳ chọn của bạn</p>

          <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="white" />
              </div>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Thông tin tài khoản</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {firebaseUser.photoURL && <img src={firebaseUser.photoURL} alt="" style={{ width: '56px', height: '56px', borderRadius: '50%', border: '3px solid var(--primary)' }} />}
              <div>
                <p style={{ fontWeight: 700, fontSize: '1rem' }}>{firebaseUser.displayName}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{firebaseUser.email}</p>
                <span
                  style={{
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: '9999px',
                    background: user.plan === 'premium' ? 'linear-gradient(135deg, #f59e0b, #ec4899)' : 'rgba(99,102,241,0.1)',
                    color: user.plan === 'premium' ? 'white' : 'var(--primary)',
                  }}
                >
                  {user.plan === 'premium' ? 'Premium' : 'Free'}
                </span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>Ngôn ngữ</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[{ val: 'vi', label: 'Tiếng Việt' }, { val: 'en', label: 'English' }].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setLanguage(val as 'vi' | 'en')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: `2px solid ${language === val ? 'var(--primary)' : 'var(--border)'}`,
                    background: language === val ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)',
                    color: language === val ? 'var(--primary)' : 'var(--text-secondary)',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveSettings} disabled={saving} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '20px' }}>
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>

          <div className="card" style={{ padding: '24px', border: '1px solid rgba(239,68,68,0.25)' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#ef4444', marginBottom: '16px' }}>Vùng nguy hiểm</h2>
            <button onClick={handleSignOut} className="btn btn-secondary btn-sm" style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              <LogOut size={14} /> Đăng xuất khỏi tất cả thiết bị
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

