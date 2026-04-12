'use client';
import Link from 'next/link';
import { FileText, GitFork, Mail, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  const links = {
    'Sản phẩm': [
      { href: '/templates', label: 'Mẫu CV' },
      { href: '/pricing', label: 'Bảng giá' },
      { href: '/auth', label: 'Tạo CV miễn phí' },
    ],
    'Hỗ trợ': [
      { href: '#faq', label: 'Câu hỏi thường gặp' },
      { href: '#guide', label: 'Hướng dẫn sử dụng' },
      { href: 'mailto:support@cvflow.vn', label: 'Liên hệ' },
    ],
    'Pháp lý': [
      { href: '#privacy', label: 'Chính sách bảo mật' },
      { href: '#terms', label: 'Điều khoản sử dụng' },
      { href: '#cookies', label: 'Cookie Policy' },
    ],
  };

  return (
    <footer style={{
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      backdropFilter: 'blur(20px)',
    }}>
      <div className="container">
        {/* Top */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '40px',
          padding: '56px 0 40px',
        }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '16px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={20} color="white" />
              </div>
              <span style={{
                fontWeight: 800, fontSize: '1.2rem',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>CVFlow</span>
            </Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '220px' }}>
              Nền tảng tạo CV online hiện đại, giúp bạn sẵn sàng chinh phục nhà tuyển dụng.
            </p>
            {/* Social Links */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {[
                { icon: GitFork, href: 'https://github.com', label: 'GitHub' },
                { icon: ExternalLink, href: 'https://linkedin.com', label: 'LinkedIn' },
                { icon: Mail, href: 'mailto:hi@cvflow.vn', label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                    transition: 'var(--transition)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--primary)';
                    (e.currentTarget as HTMLElement).style.color = 'white';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '16px' }}>
                {category}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      style={{
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '0.88rem',
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
            © {year} CVFlow. Bảo lưu mọi quyền.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Made with <Heart size={14} color="#ec4899" fill="#ec4899" /> for people who dream big
          </p>
        </div>
      </div>
    </footer>
  );
}
