import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CVFlow – Tạo CV Đẹp, Cá Nhân Hóa Mạnh Mẽ',
  description:
    'Nền tảng tạo CV/Profile online hiện đại dành cho học sinh, sinh viên và người mới đi làm. Tạo CV đẹp, chia sẻ profile và sẵn sàng chinh phục nhà tuyển dụng.',
  keywords: 'tạo CV, CV online, CV đẹp, profile online, xin việc, sinh viên, CV tiếng Việt',
  authors: [{ name: 'CVFlow Team' }],
  openGraph: {
    title: 'CVFlow – Tạo CV Đẹp, Cá Nhân Hóa Mạnh Mẽ',
    description: 'Nền tảng tạo CV/Profile online hiện đại dành cho học sinh, sinh viên và người mới đi làm.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={plusJakarta.variable}>
        <AuthProvider>
          {children}
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
                fontFamily: 'var(--font-jakarta)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
