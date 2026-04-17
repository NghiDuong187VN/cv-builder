import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PricingSection from '@/components/home/PricingSection';
import FeatureComparison from '@/components/home/FeatureComparison';
import BeforeAfterShowcase from '@/components/home/BeforeAfterShowcase';

export const metadata = {
  title: 'Bảng giá | CVFlow',
  description:
    'Chọn gói phù hợp giữa Free Forever, mua lượt tạo CV Premium và Premium theo tháng. CVFlow giúp bạn tạo CV chuyên nghiệp, tối ưu ATS và cover letter bằng AI.',
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
            background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 72%)',
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
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
              Bảng giá dịch vụ
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
            Bắt đầu miễn phí,
            <br />
            <span
              style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              nâng cấp khi bạn thật sự cần.
            </span>
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '760px',
              margin: '0 auto',
              fontSize: '1.05rem',
              lineHeight: 1.75,
            }}
          >
            CVFlow chia pricing thành 3 hướng rất rõ: <strong>Free Forever</strong> để bắt đầu,{' '}
            <strong>Mua lượt tạo CV Premium</strong> khi chỉ cần 1-2 CV cao cấp, và <strong>Premium</strong> khi bạn muốn tối ưu nhiều hồ sơ, ATS review và cover letter trong suốt quá trình ứng tuyển.
          </p>
        </div>

        <PricingSection />
        <FeatureComparison />
        <BeforeAfterShowcase />
        <FaqSection />
      </div>
      <Footer />
    </>
  );
}

function FaqSection() {
  const faqs = [
    {
      q: 'Free có đủ để bắt đầu xin việc không?',
      a: 'Có. Gói Free phù hợp để bạn tạo và lưu tối đa 3 CV, dùng mẫu cơ bản, xuất PDF cơ bản, chia sẻ link CV và thử AI tạo phần tóm tắt cơ bản 3 lượt mỗi ngày.',
    },
    {
      q: 'Mua lượt tạo CV Premium phù hợp khi nào?',
      a: 'Khi bạn chỉ cần tạo hoặc xuất 1-2 CV Premium hoàn chỉnh mà chưa muốn đăng ký gói Premium theo tháng. Quy đổi rất rõ: 1.000đ = 1 lượt.',
    },
    {
      q: 'Premium khác gì so với Free?',
      a: 'Premium mở khóa toàn bộ mẫu CV cao cấp, không giới hạn số CV, AI viết lại kinh nghiệm theo vị trí, ATS Review theo JD, tạo cover letter theo target job/company/JD và lưu cover letter vào tài khoản.',
    },
    {
      q: 'Nếu chưa có cổng thanh toán tự động thì sao?',
      a: 'Khi bạn bấm mua gói hoặc mua lượt, CVFlow sẽ mở modal thanh toán thủ công. Modal sẽ hiển thị tên gói, số tiền, nội dung chuyển khoản gợi ý và hướng dẫn gửi ảnh xác nhận qua email hỗ trợ.',
    },
    {
      q: 'Tôi chưa đăng nhập thì có mua được không?',
      a: 'Chưa. Nếu bạn chưa đăng nhập, nút CTA sẽ đưa bạn về trang đăng nhập trước để đảm bảo gói hoặc lượt được gắn đúng vào tài khoản.',
    },
    {
      q: 'Nên chọn gói Premium nào là hợp lý nhất?',
      a: 'Nếu bạn đang tìm việc tích cực, gói 3 tháng là lựa chọn cân bằng nhất. Nếu muốn tiết kiệm lâu dài, gói 1 năm có chi phí trung bình theo tháng thấp nhất.',
    },
  ];

  return (
    <section className="section" style={{ background: 'rgba(99,102,241,0.02)' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '12px' }}>
            Câu hỏi thường gặp
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7 }}>
            Những điều quan trọng nhất để bạn chọn đúng gói và hiểu rõ cách thanh toán hiện tại của CVFlow.
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
