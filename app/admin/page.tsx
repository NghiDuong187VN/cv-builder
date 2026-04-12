'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, FileText, Eye, Download, TrendingUp, Shield,
  Grid3X3, DollarSign, Settings, BarChart3, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Stats {
  totalUsers: number;
  totalCVs: number;
  premiumUsers: number;
  totalViews: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, firebaseUser, loading, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCVs: 0, premiumUsers: 0, totalViews: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser || !isAdmin) router.push('/dashboard');
    }
  }, [loading, firebaseUser, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'cvs')),
      ]).then(([usersSnap, cvsSnap]) => {
        const users = usersSnap.docs.map(d => d.data());
        const cvs = cvsSnap.docs.map(d => d.data());
        setStats({
          totalUsers: users.length,
          totalCVs: cvs.length,
          premiumUsers: users.filter(u => u.plan === 'premium').length,
          totalViews: cvs.reduce((sum, cv) => sum + (cv.viewCount || 0), 0),
        });
      });
    }
  }, [isAdmin]);

  if (loading) return <AdminLoading />;
  if (!isAdmin) return null;

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/users', label: 'Quản lý Users', icon: Users },
    { href: '/admin/templates', label: 'Quản lý Templates', icon: Grid3X3 },
    { href: '/admin/plans', label: 'Gói dịch vụ', icon: DollarSign },
    { href: '/admin/stats', label: 'Thống kê', icon: TrendingUp },
  ];

  const statCards = [
    { label: 'Tổng Users', value: stats.totalUsers, icon: Users, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', change: '+12 hôm nay' },
    { label: 'Tổng CV', value: stats.totalCVs, icon: FileText, gradient: 'linear-gradient(135deg, #06b6d4, #6366f1)', change: '+5 hôm nay' },
    { label: 'Premium Users', value: stats.premiumUsers, icon: DollarSign, gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)', change: `${Math.round(stats.premiumUsers / Math.max(stats.totalUsers, 1) * 100)}% tổng` },
    { label: 'Lượt xem CV', value: stats.totalViews, icon: Eye, gradient: 'linear-gradient(135deg, #10b981, #06b6d4)', change: 'Tổng cộng' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060613' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '240px' : '0',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f0f1a, #0a0a15)',
        borderRight: '1px solid rgba(99,102,241,0.15)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(99,102,241,0.15)', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>CVFlow</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1, whiteSpace: 'nowrap' }}>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 12px', borderRadius: '10px',
              textDecoration: 'none', marginBottom: '4px',
              color: 'rgba(255,255,255,0.55)', fontWeight: 500, fontSize: '0.88rem',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; }}
            >
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(99,102,241,0.15)', whiteSpace: 'nowrap' }}>
          {firebaseUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <img src={firebaseUser.photoURL || ''} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              <div style={{ overflow: 'hidden' }}>
                <p style={{ color: 'white', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firebaseUser.displayName}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>Admin</p>
              </div>
            </div>
          )}
          <button onClick={() => { signOut(); router.push('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '0.85rem', fontWeight: 600, width: '100%', whiteSpace: 'nowrap' }}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, paddingLeft: sidebarOpen ? '240px' : '0', transition: 'padding-left 0.3s ease' }}>
        {/* Topbar */}
        <div style={{
          height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(99,102,241,0.1)',
          backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '4px' }}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>Admin Dashboard</h1>
          </div>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.83rem', textDecoration: 'none' }}>← Về trang chính</Link>
        </div>

        {/* Content */}
        <div style={{ padding: '32px 28px' }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {statCards.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '16px', padding: '24px', backdropFilter: 'blur(20px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                    <s.icon size={22} color="white" />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{s.change}</span>
                </div>
                <p style={{ fontWeight: 800, fontSize: '2rem', color: 'white', lineHeight: 1 }}>{s.value.toLocaleString()}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.83rem', marginTop: '4px' }}>{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick Links */}
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>Quản lý nhanh</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { href: '/admin/users', title: 'Quản lý Users', desc: 'Xem, khóa, phân quyền tài khoản', icon: Users, color: '#6366f1' },
              { href: '/admin/templates', title: 'Quản lý Templates', desc: 'Thêm, sửa, xóa mẫu CV', icon: Grid3X3, color: '#ec4899' },
              { href: '/admin/plans', title: 'Gói dịch vụ', desc: 'Quản lý Free/Premium plans', icon: DollarSign, color: '#f59e0b' },
              { href: '/admin/stats', title: 'Thống kê chi tiết', desc: 'Charts, báo cáo doanh thu', icon: TrendingUp, color: '#10b981' },
            ].map(({ href, title, desc, icon: Icon, color }) => (
              <Link key={href} href={href} style={{
                display: 'block', padding: '20px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.12)',
                textDecoration: 'none', transition: 'all 0.25s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.12)'; }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Icon size={20} color={color} />
                </div>
                <p style={{ fontWeight: 700, color: 'white', marginBottom: '4px', fontSize: '0.92rem' }}>{title}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function AdminLoading() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060613' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(99,102,241,0.2)' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Đang xác thực quyền admin...</p>
      </div>
    </div>
  );
}
