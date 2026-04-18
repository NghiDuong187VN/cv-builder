import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import SupportChatWidget from '@/components/layout/SupportChatWidget';

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CVFlow – Tạo CV Online Miễn Phí Đẹp Nhất 2024 | CVFlow.vn',
  description:
    'Tạo CV đẹp, chuyên nghiệp miễn phí trong 5 phút. Nền tảng cá nhân hóa mạnh nhất cho sinh viên, học sinh và người đi làm Việt Nam. AI hỗ trợ, template đẹp, ATS-friendly.',
  keywords: 'tạo CV, CV online, CV đẹp miễn phí, profile online, xin việc, CV tiếng Việt, CV sinh viên, CV AI',
  authors: [{ name: 'CVFlow Team', url: 'https://cvflow.vn' }],
  openGraph: {
    title: 'CVFlow – Tạo CV Online Miễn Phí Đẹp Nhất 2024',
    description: 'Tạo CV đẹp, cá nhân hóa AI. Dành cho sinh viên, học sinh và người đi làm Việt Nam.',
    type: 'website',
    url: 'https://cvflow.vn',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CVFlow - Tạo CV đẹp miễn phí',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CVFlow – Tạo CV Online Miễn Phí Đẹp Nhất 2024',
    description: 'Tạo CV đẹp trong 5 phút với AI. Miễn phí 100%.',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnam.variable} ${plusJakarta.variable} ${beVietnam.className}`}>
        <AuthProvider>
          {children}
          <SupportChatWidget />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                backdropFilter: 'blur(12px)',
                boxShadow: 'var(--shadow-lg)',
                fontFamily: 'var(--font-body), var(--font-heading), system-ui, sans-serif',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
