'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { FileText, Mail, MessageSquare } from 'lucide-react';
import { LIVE_CHAT_CONFIG, SUPPORT_INFO } from '@/lib/creator';

export default function Footer() {
  const year = new Date().getFullYear();

  const links = {
    'Sản phẩm': [
      { href: '/templates', label: 'Mẫu CV' },
      { href: '/pricing', label: 'Bảng giá' },
      { href: '/auth', label: 'Tạo CV miễn phí' },
    ],
    'Hỗ trợ': [
      { href: '/support', label: 'Trung tâm hỗ trợ' },
      { href: `mailto:${SUPPORT_INFO.email}`, label: 'Email hỗ trợ' },
    ],
    'Pháp lý': [
      { href: '#privacy', label: 'Chính sách bảo mật' },
      { href: '#terms', label: 'Điều khoản sử dụng' },
      { href: '#cookies', label: 'Cookie Policy' },
    ],
  };

  const quickActions = [
    {
      icon: Mail,
      href: `mailto:${SUPPORT_INFO.email}`,
      label: 'Email hỗ trợ',
      external: false,
    },
    ...(LIVE_CHAT_CONFIG.enabled
      ? [
          {
            icon: MessageSquare,
            href: '/support',
            label: 'Live chat',
            external: false,
          },
        ]
      : []),
  ];

  return (
    <footer
      style={{
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '40px',
            padding: '56px 0 40px',
          }}
        >
          <div style={{ gridColumn: 'span 1' }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={20} color="white" />
              </div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                CVFlow
              </span>
            </Link>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
                lineHeight: 1.7,
                maxWidth: '260px',
              }}
            >
              Nền tảng tạo CV online hiện đại, giúp bạn sẵn sàng chinh phục nhà tuyển dụng với hồ sơ rõ ràng và chuyên nghiệp.
            </p>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                lineHeight: 1.7,
                maxWidth: '320px',
                marginTop: '10px',
              }}
            >
              {SUPPORT_INFO.teamName} ({SUPPORT_INFO.role})
              <br />
              Email: {SUPPORT_INFO.email}
              <br />
              Giờ hỗ trợ: {SUPPORT_INFO.supportHours}
              {LIVE_CHAT_CONFIG.enabled && (
                <>
                  <br />
                  Live chat đã được bật trên website.
                </>
              )}
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {quickActions.map(({ icon: Icon, href, label, external }) =>
                external ? (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    style={iconButtonStyle}
                    onMouseEnter={e => applyHoverState(e.currentTarget, true)}
                    onMouseLeave={e => applyHoverState(e.currentTarget, false)}
                  >
                    <Icon size={16} />
                  </a>
                ) : href.startsWith('mailto:') ? (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    style={iconButtonStyle}
                    onMouseEnter={e => applyHoverState(e.currentTarget, true)}
                    onMouseLeave={e => applyHoverState(e.currentTarget, false)}
                  >
                    <Icon size={16} />
                  </a>
                ) : (
                  <Link
                    key={label}
                    href={href}
                    aria-label={label}
                    style={iconButtonStyle}
                    onMouseEnter={e => applyHoverState(e.currentTarget, true)}
                    onMouseLeave={e => applyHoverState(e.currentTarget, false)}
                  >
                    <Icon size={16} />
                  </Link>
                )
              )}
            </div>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4
                style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  marginBottom: '16px',
                }}
              >
                {category}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map(({ href, label }) => (
                  <li key={label}>
                    {href.startsWith('mailto:') ? (
                      <a
                        href={href}
                        style={textLinkStyle}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        style={textLinkStyle}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '20px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
            © {year} CVFlow. Bảo lưu mọi quyền.
          </p>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.83rem',
            }}
          >
            Được xây dựng để giúp người Việt tạo CV chuyên nghiệp hơn.
          </p>
          <a href={`mailto:${SUPPORT_INFO.email}`} className="btn btn-primary btn-sm">
            Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </footer>
  );
}

const iconButtonStyle: CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  background: 'rgba(99,102,241,0.08)',
  border: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-muted)',
  transition: 'var(--transition)',
  textDecoration: 'none',
};

const textLinkStyle: CSSProperties = {
  color: 'var(--text-muted)',
  textDecoration: 'none',
  fontSize: '0.88rem',
  transition: 'var(--transition)',
};

function applyHoverState(target: HTMLElement, isHovering: boolean) {
  target.style.background = isHovering ? 'var(--primary)' : 'rgba(99,102,241,0.08)';
  target.style.color = isHovering ? 'white' : 'var(--text-muted)';
  target.style.borderColor = isHovering ? 'var(--primary)' : 'var(--border)';
}
