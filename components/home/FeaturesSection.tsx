'use client';
import { motion } from 'framer-motion';
import { Zap, Palette, Share2, Star, Lock, Globe } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Tạo CV trong 5 phút',
    desc: 'Điền thông tin, chọn mẫu, tải xuống. Đơn giản, nhanh chóng và không cần kỹ năng thiết kế.',
    gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)',
    bg: 'rgba(245,158,11,0.08)',
  },
  {
    icon: Palette,
    title: 'Tùy chỉnh không giới hạn',
    desc: 'Chọn màu sắc, font chữ, layout. Biến CV của bạn thành tác phẩm độc đáo, cá nhân hóa mạnh mẽ.',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    bg: 'rgba(139,92,246,0.08)',
  },
  {
    icon: Share2,
    title: 'Chia sẻ profile online',
    desc: 'Mỗi CV có link riêng. Chia sẻ trực tiếp với nhà tuyển dụng hoặc đăng lên mạng xã hội.',
    gradient: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    bg: 'rgba(6,182,212,0.08)',
  },
  {
    icon: Star,
    title: 'Kho Mẫu Đa Dạng Chuẩn Chuyên Nghiệp',
    desc: 'Từ thiết kế tối giản đến sáng tạo, dễ dàng lựa chọn miễn phí và nâng cấp Premium khi cần thiết.',
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    bg: 'rgba(236,72,153,0.08)',
  },
  {
    icon: Globe,
    title: 'Hỗ trợ song ngữ Việt / Anh',
    desc: 'Tạo CV bằng tiếng Việt hoặc tiếng Anh. Phù hợp xin việc trong và ngoài nước.',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    bg: 'rgba(16,185,129,0.08)',
  },
  {
    icon: Lock,
    title: 'Bảo mật & riêng tư',
    desc: 'Đăng nhập bằng Google. Dữ liệu của bạn được bảo vệ, chỉ bạn mới có thể chỉnh sửa.',
    gradient: 'linear-gradient(135deg, #6366f1, #10b981)',
    bg: 'rgba(99,102,241,0.08)',
  },
];

export default function FeaturesSection() {
  return (
    <section className="section" id="features">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '56px' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '9999px',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            marginBottom: '16px',
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
              ✨ Tại sao chọn CVFlow?
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '16px' }}>
            Tất cả những gì bạn cần
            <br />
            <span className="gradient-text">trong một nền tảng</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto', fontSize: '1.05rem' }}>
            CVFlow không chỉ là công cụ tạo CV. Đây là nơi bạn xây dựng thương hiệu cá nhân và trình bày bản thân với thế giới.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="card"
              style={{ padding: '28px 24px' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xl)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '14px',
                background: f.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: `0 4px 16px ${f.bg.replace('0.08', '0.4')}`,
              }}>
                <f.icon size={24} color="white" />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1.08rem', marginBottom: '10px', color: 'var(--text-primary)' }}>
                {f.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
