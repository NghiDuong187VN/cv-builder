'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Play } from 'lucide-react';

const wordList = ['Ấn Tượng', 'Chuyên Nghiệp', 'Cá Nhân Hóa', 'Nổi Bật', 'Khác Biệt'];

export default function HeroSection() {
  return (
    <section
      className="hero-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '120px 24px 80px',
      }}
    >
      {/* Blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '10%', left: '10%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'rgba(236,72,153,0.15)',
          filter: 'blur(80px)',
        }} />
      </div>

      <div style={{ maxWidth: '900px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '9999px',
            backdropFilter: 'blur(8px)',
            marginBottom: '32px',
          }}
        >
          <Sparkles size={14} color="white" />
          <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>
            🎉 Miễn phí 100% – Không cần thẻ tín dụng
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.1,
            marginBottom: '24px',
            textShadow: '0 2px 20px rgba(0,0,0,0.2)',
          }}
        >
          Tạo CV{' '}
          <span style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #fde68a, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Đẹp
          </span>
          ,<br />
          Sẵn Sàng{' '}
          <span style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #bfdbfe, #93c5fd, #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Chinh Phục
          </span>
          <br />
          Nhà Tuyển Dụng
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: 'rgba(255,255,255,0.85)',
            maxWidth: '640px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}
        >
          Nền tảng tạo CV & Profile online <strong style={{ color: 'white' }}>cá nhân hóa mạnh nhất</strong> cho học sinh, sinh viên và người đi làm.
          Tạo trong <strong style={{ color: '#fde68a' }}>5 phút</strong>, chia sẻ ngay.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <Link
            href="/cv/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 40px',
              background: 'white',
              color: '#6366f1',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '1rem',
              textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
            }}
          >
            <Sparkles size={18} />
            Tạo CV Ngay – Miễn Phí
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/templates"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 32px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <Play size={18} fill="white" />
            Khám Phá Mẫu CV
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            display: 'flex',
            gap: '48px',
            justifyContent: 'center',
            marginTop: '56px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { value: '10,000+', label: 'CV đã tạo' },
            { value: '50+', label: 'Mẫu CV đẹp' },
            { value: '4.9⭐', label: 'Đánh giá' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '1.6rem', color: 'white' }}>{value}</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CV Mockup Cards */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 20 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="float"
        style={{
          position: 'absolute',
          bottom: '-40px',
          right: '5%',
          display: 'flex',
          gap: '16px',
          pointerEvents: 'none',
        }}
      >
        {[
          { bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', rotate: '-6deg' },
          { bg: 'linear-gradient(135deg, #06b6d4, #6366f1)', rotate: '0deg' },
          { bg: 'linear-gradient(135deg, #ec4899, #f59e0b)', rotate: '5deg' },
        ].map(({ bg, rotate }, i) => (
          <div
            key={i}
            style={{
              width: '120px',
              height: '160px',
              borderRadius: '12px',
              background: bg,
              opacity: 0.7 + i * 0.1,
              transform: `rotate(${rotate})`,
              boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px',
              gap: '8px',
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
            {[80, 60, 90, 50, 70].map((w, j) => (
              <div key={j} style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.3)', width: `${w}%` }} />
            ))}
          </div>
        ))}
      </motion.div>
    </section>
  );
}
