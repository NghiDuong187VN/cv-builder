import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PricingSection from '@/components/home/PricingSection';
import FeatureComparison from '@/components/home/FeatureComparison';
import BeforeAfterShowcase from '@/components/home/BeforeAfterShowcase';

export const metadata = {
  title: 'Bang Gia | CVFlow',
  description:
    'Chon goi phu hop. Bat dau mien phi, nang cap khi can. Premium mo khoa ATS Optimizer, cover letter AI va rewrite kinh nghiem bang Gemini.',
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '72px 24px 56px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 18px',
              borderRadius: '9999px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
              Bang gia minh bach
            </span>
          </div>
          <h1
            style={{
              fontWeight: 800,
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              marginBottom: '16px',
              lineHeight: 1.15,
            }}
          >
            Ban CV dep la buoc dau.
            <br />
            <span
              style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Ban kha nang qua vong moi la gia tri that.
            </span>
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '620px',
              margin: '0 auto',
              fontSize: '1.05rem',
              lineHeight: 1.7,
            }}
          >
            Goi Free giup user vao nhanh va thay gia tri ngay. Goi Premium mo khoa phan an tien nhat:
            AI rewrite kinh nghiem, ATS review theo JD va cover letter tao xong co the luu ngay vao tai khoan.
          </p>
        </div>

        <PricingSection />
        <BeforeAfterShowcase />
        <FeatureComparison />
        <FaqSection />
      </div>
      <Footer />
    </>
  );
}

function FaqSection() {
  const faqs = [
    {
      q: 'Goi mien phi co du de xin viec khong?',
      a: 'Du de bat dau. User co the tao CV dep, xuat PDF, chia se link va dung AI tao summary co ban 3 luot moi ngay. Premium danh cho giai doan user can toi uu CV theo tung vi tri cu the.',
    },
    {
      q: 'Premium dang tien o diem nao?',
      a: 'Premium dang tien khi user dang ung tuyen nghiem tuc: AI rewrite tung muc kinh nghiem, ATS score co keyword gap ro rang, va cover letter tao theo target job + job description. Day la nhung tinh nang tao chenh lech ro voi goi Free.',
    },
    {
      q: 'Tinh nang AI hoat dong nhu the nao?',
      a: 'Gemini chay o backend, khong lo API key tren client. AI dung du lieu that tu CV cua user nhu target job, target company va job description de sinh noi dung. Premium se dung duoc bo logic day du hon Free.',
    },
    {
      q: 'ATS Optimizer tra ve gi?',
      a: 'ATS Optimizer tra ve diem ATS, diem manh, khoang trong, keyword con thieu va danh sach recommendation. Muc tieu la de user biet phan nao can sua truoc khi gui CV.',
    },
    {
      q: 'Cover letter AI da luu duoc chua?',
      a: 'Da. Sau khi tao cover letter trong editor, user co the sua lai, sao chep hoac luu thang vao tai khoan Firestore de dung lai sau.',
    },
    {
      q: 'Co duoc dung thu truoc khi nang cap khong?',
      a: 'Co. Goi Free da mo summary AI 3 luot moi ngay. Day la cach de user thu gia tri cua AI truoc khi quyet dinh nang cap Premium.',
    },
  ];

  return (
    <section className="section" style={{ background: 'rgba(99,102,241,0.02)' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '12px' }}>
            Cau hoi thuong gap
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Copy va offer o day da duoc can lai theo dung tinh nang hien co trong san pham.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, index) => (
            <FaqItem key={index} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      <summary
        style={{
          padding: '18px 24px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.95rem',
          color: 'var(--text-primary)',
          listStyle: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          userSelect: 'none',
        }}
      >
        {q}
        <span style={{ fontSize: '1.2rem', color: 'var(--primary)', flexShrink: 0 }}>+</span>
      </summary>
      <div
        style={{
          padding: '0 24px 18px',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.75,
          borderTop: '1px solid var(--border)',
          paddingTop: '14px',
          marginTop: '-2px',
        }}
      >
        {a}
      </div>
    </details>
  );
}
