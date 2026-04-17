'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, User, LayoutDashboard, Grid3X3, DollarSign,
  LogOut, Menu, X, ChevronDown, Sun, Moon, Settings, Shield, Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark';
  });
  const { user, firebaseUser, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const toggleTheme = () => {
    setDark(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    setProfileOpen(false);
  };

      const navLinks = [
    { href: '/templates', label: 'Kho mẫu CV', icon: Grid3X3 },
    { href: '/community', label: 'Cộng đồng CV', icon: Users },
    { href: '/pricing', label: 'Gói dịch vụ', icon: DollarSign },
    { href: '/support', label: 'Trợ giúp', icon: Shield },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'var(--bg-card)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : 'none',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
      }}
    >
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
            }}>
              <FileText size={20} color="white" />
            </div>
            <span style={{
              fontWeight: 800,
              fontSize: '1.3rem',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>CVFlow</span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hidden-mobile">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  color: isActive(href) ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive(href) ? 'rgba(99,102,241,0.1)' : 'transparent',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={e => {
                  if (!isActive(href)) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive(href)) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm"
              style={{ padding: '8px', borderRadius: '10px', color: 'var(--text-secondary)' }}
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {loading ? (
              <div className="skeleton" style={{ width: '80px', height: '36px' }} />
            ) : firebaseUser ? (
              /* User Profile Dropdown */
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  <img
                    src={firebaseUser.photoURL || '/default-avatar.png'}
                    alt="avatar"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {firebaseUser.displayName?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} color="var(--text-muted)" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        minWidth: '200px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        backdropFilter: 'blur(20px)',
                        overflow: 'hidden',
                        zIndex: 100,
                      }}
                    >
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {firebaseUser.displayName}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{firebaseUser.email}</p>
                      </div>
                      {[
                        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                        { href: '/cv', label: 'CV của tôi', icon: FileText },
                        { href: '/profile/edit', label: 'Chỉnh sửa Profile', icon: User },
                        { href: '/settings', label: 'Cài đặt', icon: Settings },
                        ...(user?.isAdmin ? [{ href: '/admin', label: 'Admin Panel', icon: Shield }] : []),
                      ].map(({ href, label, icon: Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setProfileOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 16px',
                            textDecoration: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            transition: 'var(--transition)',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)';
                            (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                          }}
                        >
                          <Icon size={16} /> {label}
                        </Link>
                      ))}
                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                          onClick={handleSignOut}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 16px',
                            width: '100%',
                            textAlign: 'left',
                            color: '#ef4444',
                            fontSize: '0.88rem',
                            fontWeight: 500,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'var(--transition)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <LogOut size={16} /> Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Guest Actions */
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link href="/auth" className="btn btn-secondary btn-sm">Đăng nhập</Link>
                <Link href="/auth" className="btn btn-primary btn-sm">
                  Tạo CV ngay ✨
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="show-mobile"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                borderTop: '1px solid var(--border)',
                paddingBottom: '16px',
                paddingTop: '8px',
              }}
            >
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 8px',
                    textDecoration: 'none',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  <Icon size={18} /> {label}
                </Link>
              ))}
              {!firebaseUser && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <Link href="/auth" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setMobileOpen(false)}>
                    Tạo CV ngay ✨
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
}



