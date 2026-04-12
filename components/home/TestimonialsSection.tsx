'use client';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Nguyễn Thành Đạt',
    role: 'Sinh viên CNTT, Đại học Bách Khoa',
    avatar: 'ND',
    content: 'CVFlow giúp mình tạo CV trong 15 phút, đăng ký thực tập ngay hôm sau và được nhận. Template đẹp, chuyên nghiệp hơn nhiều so với mình tự làm Word.',
    rating: 5,
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  {
    name: 'Trần Thị Mai Anh',
    role: 'Fresher Marketing, 22 tuổi',
    avatar: 'MA',
    content: 'Mình thích nhất là tính năng chia sẻ link CV trực tiếp với nhà tuyển dụng. Không cần gửi file đính kèm nữa! Rất tiện và chuyên nghiệp.',
    rating: 5,
    gradient: 'linear-gradient(135deg, #ec4899, #f59e0b)',
  },
  {
    name: 'Lê Minh Quân',
    role: 'Frontend Developer, 2 năm kinh nghiệm',
    avatar: 'MQ',
    content: 'Template "Dark Tech" cực kỳ hợp với dân IT. CV của mình nhìn rất khác biệt và ấn tượng. Đã nhận được 3 offer chỉ sau 2 tuần dùng CVFlow.',
    rating: 5,
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
  },
  {
    name: 'Phạm Ngọc Linh',
    role: 'Sinh viên Thiết kế, năm 3',
    avatar: 'NL',
    content: 'Là dân design nên mình khá khó tính về thẩm mỹ. CVFlow vượt kỳ vọng! Tùy chỉnh màu sắc linh hoạt, kết quả xuất ra rất đẹp.',
    rating: 5,
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="section" id="testimonials">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '56px' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '9999px',
            background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)',
            marginBottom: '16px',
          }}>
            <Star size={14} color="#ec4899" fill="#ec4899" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#db2777' }}>Người dùng nói gì?</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '16px' }}>
            Hàng nghìn người đã{' '}
            <span className="gradient-text">thành công</span>
            <br />nhờ CVFlow
          </h2>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card"
              style={{ padding: '28px 24px' }}
            >
              <Quote size={32} style={{
                background: t.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '16px',
                opacity: 0.6,
              }} />
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.93rem',
                lineHeight: 1.7,
                marginBottom: '20px',
                fontStyle: 'italic',
              }}>
                &ldquo;{t.content}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: t.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  color: 'white', fontWeight: 800, fontSize: '0.85rem',
                }}>
                  {t.avatar}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{t.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{t.role}</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} color="#f59e0b" fill="#f59e0b" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
