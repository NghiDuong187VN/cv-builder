'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, Shield, Zap } from 'lucide-react';
import { signInWithGoogle } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && firebaseUser) {
      router.push('/dashboard');
    }
  }, [firebaseUser, loading, router]);

  const handleGoogleLogin = async () => {
    const toastId = toast.loading('Đang đăng nhập...');
    try {
      const user = await signInWithGoogle();
      if (user) {
        toast.success(`Chào mừng, ${user.displayName?.split(' ')[0]}! 🎉`, { id: toastId });
        router.push('/dashboard');
      } else {
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.', { id: toastId });
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.', { id: toastId });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Left — Decorative */}
      <div
        className="hero-bg"
        style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '440px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <FileText size={26} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.8rem', color: 'white' }}>CVFlow</span>
          </div>

          <h2 style={{ fontWeight: 800, fontSize: '2rem', color: 'white', marginBottom: '16px', lineHeight: 1.3 }}>
            Tạo CV đẹp,<br />cá nhân hóa mạnh mẽ
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '1rem' }}>
            Đăng nhập để bắt đầu xây dựng thương hiệu cá nhân và chinh phục nhà tuyển dụng.
          </p>

          {/* Features */}
          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: Zap, text: 'Tạo CV trong 5 phút' },
              { icon: Shield, text: 'Bảo mật, không chia sẻ dữ liệu' },
              { icon: ArrowRight, text: 'Chia sẻ link CV trực tiếp' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={16} color="white" />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* CV Cards decoration */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
            {[
              { bg: 'rgba(255,255,255,0.15)' },
              { bg: 'rgba(255,255,255,0.2)' },
              { bg: 'rgba(255,255,255,0.12)' },
            ].map((s, i) => (
              <div key={i} style={{
                width: '80px', height: '110px',
                background: s.bg,
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
                transform: i === 1 ? 'scale(1.1) translateY(-8px)' : i === 0 ? 'rotate(-5deg)' : 'rotate(4deg)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right — Auth Form */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        background: 'var(--bg)',
        position: 'relative',
      }}>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: '360px' }}
        >
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: '8px' }}>
              Chào mừng! 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Đăng nhập hoặc đăng ký tài khoản mới để bắt đầu.
            </p>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              padding: '16px 24px',
              borderRadius: '14px',
              background: 'var(--bg-card)',
              border: '2px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'var(--transition)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            {/* Google Logo SVG */}
            <svg width="22" height="22" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Tiếp tục với Google
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            margin: '24px 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>hoặc</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Info */}
          <div style={{
            padding: '16px',
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '12px',
            marginBottom: '24px',
          }}>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              🔐 <strong>Bảo mật 100%</strong> — Chúng tôi không lưu mật khẩu của bạn. Xác thực qua Google đảm bảo tài khoản an toàn tuyệt đối.
            </p>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <a href="#terms" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Điều khoản sử dụng</a>{' '}
            và{' '}
            <a href="#privacy" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Chính sách bảo mật</a>{' '}
            của CVFlow.
          </p>
        </motion.div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div:first-child > div:first-child {
            display: none;
          }
          div:first-child > div:last-child {
            max-width: 100%;
            padding: 40px 24px;
          }
        }
      `}</style>
    </div>
  );
}
