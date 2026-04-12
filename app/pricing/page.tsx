import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PricingSection from '@/components/home/PricingSection';
import FeatureComparison from '@/components/home/FeatureComparison';
import BeforeAfterShowcase from '@/components/home/BeforeAfterShowcase';

export const metadata = {
  title: 'Bảng Giá | CVFlow',
  description:
    'Chọn gói phù hợp. Bắt đầu miễn phí, nâng cấp khi cần. Premium giúp CV của bạn chuyên nghiệp hơn và tăng cơ hội ứng tuyển thành công.',
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        {/* Hero */}
        <div
          style={{
            textAlign: 'center',
            padding: '72px 24px 56px',
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)',
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
              💰 Bảng giá minh bạch
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
            Đầu tư vào CV của bạn
            <br />
            <span
              style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              là đầu tư vào sự nghiệp
            </span>
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '500px',
              margin: '0 auto',
              fontSize: '1.05rem',
              lineHeight: 1.7,
            }}
          >
            Bắt đầu hoàn toàn miễn phí. Nâng cấp bất cứ lúc nào để có CV chuyên nghiệp hơn,
            được tối ưu cho nhà tuyển dụng và vượt qua vòng lọc ATS.
          </p>
        </div>

        {/* Pricing cards – 3 tiers */}
        <PricingSection />

        {/* AI Before/After Demo */}
        <BeforeAfterShowcase />

        {/* Full feature comparison table */}
        <FeatureComparison />

        {/* FAQ */}
        <FaqSection />
      </div>
      <Footer />
    </>
  );
}

function FaqSection() {
  const faqs = [
    {
      q: 'Gói miễn phí có đủ để xin việc không?',
      a: 'Hoàn toàn đủ! Bạn có thể tạo CV đẹp, xuất PDF và chia sẻ link với nhà tuyển dụng. Premium và Pro giúp bạn làm nhanh hơn, đẹp hơn và tối ưu hóa nội dung để tăng khả năng được gọi phỏng vấn.',
    },
    {
      q: 'Tôi có thể hủy gói Premium bất cứ lúc nào không?',
      a: 'Có. Bạn có thể hủy bất cứ lúc nào, không cần lý do. Tài khoản sẽ về Free vào cuối tháng hiện tại, dữ liệu CV vẫn được giữ nguyên.',
    },
    {
      q: 'Tính năng AI hoạt động như thế nào?',
      a: 'AI phân tích nội dung bạn nhập, bổ sung từ khóa phù hợp ngành nghề, thêm số liệu cụ thể và viết lại theo đúng ngôn ngữ mà nhà tuyển dụng và hệ thống ATS kỳ vọng.',
    },
    {
      q: 'ATS Optimizer là gì và tại sao lại quan trọng?',
      a: 'ATS (Applicant Tracking System) là hệ thống tự động lọc CV của nhiều công ty lớn. Nếu CV không đúng định dạng hoặc thiếu từ khóa, CV sẽ bị loại trước khi có người đọc. ATS Optimizer giúp CV của bạn vượt qua bước này.',
    },
    {
      q: 'Gói Pro phù hợp với ai?',
      a: 'Pro phù hợp với freelancer, người đi làm ứng tuyển nhiều vị trí cùng lúc, hoặc người muốn có trang portfolio cá nhân đẹp để chia sẻ với khách hàng và nhà tuyển dụng.',
    },
    {
      q: 'Có được dùng thử miễn phí không?',
      a: 'Tất nhiên! Bạn không cần thẻ tín dụng để bắt đầu. Gói Free đã có đầy đủ tính năng cơ bản. Đặc biệt, bạn có thể dùng thử 1 lần tính năng AI viết lại với tài khoản mới.',
    },
  ];

  return (
    <section
      className="section"
      style={{ background: 'rgba(99,102,241,0.02)' }}
    >
      <div className="container" style={{ maxWidth: '760px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '12px' }}>
            Câu hỏi thường gặp
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Không tìm thấy câu trả lời? Liên hệ chúng tôi qua Zalo hoặc Email.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
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
