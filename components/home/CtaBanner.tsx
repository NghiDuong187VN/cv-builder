'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CtaBanner() {
  return (
    <section className="section-sm">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="hero-bg"
          style={{
            borderRadius: '32px',
            padding: 'clamp(48px, 6vw, 80px) clamp(24px, 4vw, 64px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Blobs */}
          <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20%', right: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 20px', borderRadius: '9999px',
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
              marginBottom: '24px',
            }}>
              <Sparkles size={14} color="white" />
              <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>Bắt đầu ngay hôm nay</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(1.8rem, 5vw, 3.2rem)',
              fontWeight: 800,
              color: 'white',
              marginBottom: '16px',
              lineHeight: 1.2,
              textShadow: '0 2px 20px rgba(0,0,0,0.2)',
            }}>
              Sẵn sàng tạo CV của bạn?
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '1.1rem',
              maxWidth: '500px',
              margin: '0 auto 36px',
            }}>
              Tham gia cùng <strong style={{ color: 'white' }}>10,000+</strong> người dùng đang xây dựng sự nghiệp với CVFlow.
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/cv/new"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: '16px 40px',
                  background: 'white', color: '#6366f1',
                  borderRadius: '16px', fontWeight: 800,
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
                <Sparkles size={18} /> Tạo CV Ngay – Miễn Phí <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
