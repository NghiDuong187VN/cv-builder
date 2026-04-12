'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, DollarSign, Grid3X3, Home, LogOut, Menu, Shield, Users, X } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/templates', label: 'Templates', icon: Grid3X3 },
  { href: '/admin/plans', label: 'Plans', icon: DollarSign },
  { href: '/admin/stats', label: 'Stats', icon: BarChart3 },
];

export default function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { firebaseUser, loading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && (!firebaseUser || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [loading, firebaseUser, isAdmin, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060613' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px', background: 'rgba(99,102,241,0.2)' }} />
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !isAdmin) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060613' }}>
      <aside
        style={{
          width: sidebarOpen ? '240px' : '0',
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #0f0f1a, #0a0a15)',
          borderRight: '1px solid rgba(99,102,241,0.15)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
        }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(99,102,241,0.15)', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>CVFlow</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>Admin Panel</p>
            </div>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1, whiteSpace: 'nowrap' }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  marginBottom: '4px',
                  color: active ? 'white' : 'rgba(255,255,255,0.58)',
                  background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.88rem',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={17} /> {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(99,102,241,0.15)', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <img src={firebaseUser.photoURL || ''} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: 'white', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {firebaseUser.displayName}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(239,68,68,0.12)',
              border: 'none',
              cursor: 'pointer',
              color: '#f87171',
              fontSize: '0.85rem',
              fontWeight: 600,
              width: '100%',
              whiteSpace: 'nowrap',
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, paddingLeft: sidebarOpen ? '240px' : '0', transition: 'padding-left 0.25s ease' }}>
        <div
          style={{
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(99,102,241,0.1)',
            backdropFilter: 'blur(20px)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', padding: '4px' }}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 style={{ fontWeight: 700, fontSize: '1.04rem', color: 'white', lineHeight: 1.2 }}>{title}</h1>
              {subtitle ? <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.76rem' }}>{subtitle}</p> : null}
            </div>
          </div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.55)', fontSize: '0.83rem', textDecoration: 'none' }}>
            <Home size={14} /> Website
          </Link>
        </div>

        <div style={{ padding: '24px' }}>{children}</div>
      </main>
    </div>
  );
}

