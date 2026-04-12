'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Transformation {
  category: string;
  before: string;
  after: string;
  tip: string;
}

const TRANSFORMATIONS: Transformation[] = [
  {
    category: 'Mô tả kinh nghiệm',
    before: 'Bán hàng part-time, tư vấn khách hàng về sản phẩm.',
    after: 'Tư vấn và hỗ trợ khách hàng lựa chọn sản phẩm phù hợp nhu cầu, góp phần nâng cao trải nghiệm mua sắm và tăng tỷ lệ hài lòng tại cửa hàng.',
    tip: 'AI tự động bổ sung kết quả & từ khóa tuyển dụng',
  },
  {
    category: 'Mục tiêu nghề nghiệp',
    before: 'Tìm việc làm IT, muốn học hỏi và phát triển bản thân.',
    after: 'Kỹ sư phần mềm với 1 năm kinh nghiệm phát triển ứng dụng web, tìm kiếm cơ hội tại môi trường công nghệ năng động để đóng góp vào các dự án thực tiễn và phát triển chuyên môn trong lĩnh vực frontend/full-stack.',
    tip: 'AI biến câu chung chung thành nội dung cụ thể, đúng ngành',
  },
  {
    category: 'Mô tả dự án',
    before: 'Làm app quản lý sinh viên bằng React, có database.',
    after: 'Phát triển ứng dụng quản lý sinh viên toàn diện sử dụng React.js và Node.js, tích hợp cơ sở dữ liệu MySQL. Hệ thống hỗ trợ quản lý 500+ hồ sơ sinh viên, giảm 40% thời gian xử lý thủ công so với phương pháp cũ.',
    tip: 'AI thêm số liệu cụ thể và từ khóa kỹ thuật phù hợp',
  },
  {
    category: 'Kỹ năng & Thành tích',
    before: 'Giỏi teamwork, chăm chỉ, học nhanh.',
    after: 'Kỹ năng làm việc nhóm hiệu quả trong môi trường Agile/Scrum. Nhanh tiếp thu công nghệ mới, hoàn thành 3 dự án cá nhân trong 6 tháng và tham gia 2 hackathon với kết quả Top 10.',
    tip: 'AI chuyển kỹ năng mềm thành thành tích có thể đo lường',
  },
];

export default function BeforeAfterShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showAfter, setShowAfter] = useState(false);
  const active = TRANSFORMATIONS[activeIdx];

  const handleNext = () => {
    setShowAfter(false);
    setTimeout(() => setActiveIdx(i => (i + 1) % TRANSFORMATIONS.length), 200);
  };

  return (
    <section className="section" style={{ background: 'rgba(99,102,241,0.03)' }}>
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
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
            marginBottom: '16px',
          }}>
            <Sparkles size={14} color="#8b5cf6" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#7c3aed' }}>AI Content Optimizer</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '1px 8px', borderRadius: '9999px', background: 'linear-gradient(135deg, #f59e0b, #ec4899)', color: 'white' }}>PREMIUM</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginBottom: '16px' }}>
            CV của bạn trước và sau khi
            <br />
            <span className="gradient-text">được AI cải thiện</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.7 }}>
            AI phân tích nội dung, bổ sung từ khóa tuyển dụng, thêm số liệu cụ thể và viết lại theo đúng ngôn ngữ mà nhà tuyển dụng muốn thấy.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px', alignItems: 'start' }}>
          {/* Left: category selector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Chọn nội dung muốn xem thử
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
              {TRANSFORMATIONS.map((t, i) => (
                <button
                  key={t.category}
                  onClick={() => { setActiveIdx(i); setShowAfter(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                    background: i === activeIdx ? 'rgba(139,92,246,0.1)' : 'var(--bg-card)',
                    border: `1px solid ${i === activeIdx ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
                    transition: 'all 0.2s', fontFamily: 'inherit',
                    color: i === activeIdx ? '#7c3aed' : 'var(--text-secondary)',
                    fontWeight: i === activeIdx ? 700 : 500,
                  }}
                >
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: i === activeIdx ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'var(--border)',
                    transition: 'all 0.2s',
                  }} />
                  <span style={{ fontSize: '0.88rem' }}>{t.category}</span>
                  {i === activeIdx && <ArrowRight size={14} style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>

            {/* Tip box */}
            <div style={{
              padding: '16px', borderRadius: '12px',
              background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Sparkles size={16} color="#8b5cf6" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#7c3aed', marginBottom: '4px' }}>Tại sao lại khác biệt?</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{active.tip}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Before/After card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Before */}
                <div style={{
                  borderRadius: '16px', overflow: 'hidden',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)', marginBottom: '12px',
                  boxShadow: 'var(--shadow-md)',
                }}>
                  <div style={{
                    padding: '10px 16px', background: 'rgba(239,68,68,0.08)',
                    borderBottom: '1px solid rgba(239,68,68,0.15)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626' }}>TRƯỚC – Bản gốc của bạn</span>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
                      "{active.before}"
                    </p>
                  </div>
                </div>

                {/* AI Transform button */}
                <div style={{ textAlign: 'center', margin: '0 0 12px' }}>
                  <button
                    onClick={() => setShowAfter(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '10px 24px', borderRadius: '12px', cursor: 'pointer',
                      background: showAfter
                        ? 'rgba(16,185,129,0.1)'
                        : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      color: showAfter ? '#10b981' : 'white',
                      border: showAfter ? '1px solid rgba(16,185,129,0.3)' : 'none',
                      fontFamily: 'inherit', fontWeight: 700, fontSize: '0.88rem',
                      transition: 'all 0.3s',
                      boxShadow: showAfter ? 'none' : '0 4px 16px rgba(139,92,246,0.4)',
                    }}
                    disabled={showAfter}
                  >
                    {showAfter ? (
                      <><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Đã tối ưu xong!</>
                    ) : (
                      <><Sparkles size={16} /> Xem AI cải thiện →</>
                    )}
                  </button>
                </div>

                {/* After */}
                <AnimatePresence>
                  {showAfter && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        borderRadius: '16px', overflow: 'hidden',
                        border: '1px solid rgba(16,185,129,0.3)',
                        background: 'var(--bg-card)',
                        boxShadow: '0 8px 32px rgba(16,185,129,0.15)',
                      }}
                    >
                      <div style={{
                        padding: '10px 16px', background: 'rgba(16,185,129,0.08)',
                        borderBottom: '1px solid rgba(16,185,129,0.15)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                        <Sparkles size={12} color="#10b981" />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>SAU – AI đã tối ưu</span>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.75, fontWeight: 500 }}>
                          "{active.after}"
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation & CTA */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleNext}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      fontFamily: 'inherit', fontWeight: 600, fontSize: '0.82rem',
                      color: 'var(--text-secondary)', transition: 'all 0.2s',
                    }}
                  >
                    <RefreshCw size={13} /> Xem ví dụ tiếp theo
                  </button>
                  <Link
                    href="/pricing"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '10px 20px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                      color: 'white', fontWeight: 700, fontSize: '0.88rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
                    }}
                  >
                    <Crown size={14} /> Mở khóa AI – 79.000đ/tháng
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
