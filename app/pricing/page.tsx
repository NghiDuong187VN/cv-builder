import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PricingSection from '@/components/home/PricingSection';
import FeatureComparison from '@/components/home/FeatureComparison';
import BeforeAfterShowcase from '@/components/home/BeforeAfterShowcase';

export const metadata = {
  title: 'Bảng giá | CVFlow',
  description:
    'Bắt đầu miễn phí, nâng cấp Premium để tối ưu CV bằng AI, hoặc nạp credits khi chỉ cần dùng một vài tính năng trả phí. CVFlow giúp bạn tạo CV chuyên nghiệp, vượt ATS và tạo cover letter bằng AI.',
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
              Bảng giá CVFlow
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
            Chọn cách dùng
            <br />
            <span
              style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              phù hợp với bạn.
            </span>
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '680px',
              margin: '0 auto',
              fontSize: '1.05rem',
              lineHeight: 1.75,
            }}
          >
            Bắt đầu miễn phí, nâng cấp <strong>Premium</strong> để tối ưu CV bằng AI,
            hoặc nạp <strong>Credits</strong> khi chỉ cần dùng một vài tính năng trả phí.
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
      q: 'Free có đủ để bắt đầu không?',
      a: 'Có. Gói Free cho phép tạo và lưu tối đa 3 CV, dùng mẫu cơ bản, xuất PDF, chia sẻ link CV công khai và thử AI tóm tắt tối đa 3 lần mỗi ngày. Đủ để bạn có hồ sơ hoàn chỉnh và bắt đầu ứng tuyển ngay mà không cần trả phí.',
    },
    {
      q: 'Premium khác gì so với Credits?',
      a: 'Premium là gói theo thời gian (1, 3, 6 hoặc 12 tháng) — cho phép dùng tất cả tính năng AI không giới hạn trong suốt gói, bao gồm AI Rewrite, ATS Review, Cover Letter, template cao cấp và PDF không watermark. Credits là hình thức nạp theo nhu cầu, trả theo lượt — phù hợp khi bạn chỉ cần dùng một vài tính năng cụ thể mà không muốn đăng ký gói tháng.',
    },
    {
      q: 'Credits có hết hạn không?',
      a: 'Credits hiện không hết hạn. Số credits bạn nạp sẽ được giữ nguyên cho đến khi sử dụng hết, không bị xóa theo thời gian. Bạn có thể nạp khi cần và dùng dần theo nhịp của mình.',
    },
    {
      q: 'Khi đã có Premium, credits có bị trừ không?',
      a: 'Không. Khi gói Premium còn hạn, tất cả tính năng nằm trong gói đều được dùng tự do mà không tiêu credits. Credits chỉ bị trừ khi Premium hết hạn, hoặc khi bạn dùng tính năng nằm ngoài phạm vi gói hiện tại.',
    },
    {
      q: 'Tôi có thể nâng cấp bất kỳ lúc nào không?',
      a: 'Có. Bạn có thể mua gói Premium hoặc nạp credits bất kỳ lúc nào sau khi đăng nhập. Không cần chờ đến cuối kỳ hay hủy gói cũ — mua xong là kích hoạt ngay sau khi đội ngũ xác nhận thanh toán.',
    },
    {
      q: 'AI Rewrite, ATS Review và Cover Letter hoạt động thế nào?',
      a: 'Cả ba tính năng đều dùng AI phân tích nội dung CV của bạn kết hợp với mô tả công việc (JD) bạn nhập vào. AI Rewrite viết lại phần kinh nghiệm cho phù hợp từng vị trí. ATS Review đánh giá mức độ tương thích với JD và gợi ý cải thiện. Cover Letter tạo thư xin việc cá nhân hóa theo công ty và vị trí mục tiêu.',
    },
    {
      q: 'Thanh toán hoạt động như thế nào?',
      a: 'CVFlow hiện hỗ trợ thanh toán thủ công qua chuyển khoản ngân hàng. Khi bạn bấm mua gói hoặc nạp credits, hệ thống hiển thị thông tin chuyển khoản và nội dung gợi ý. Sau khi thanh toán, bạn gửi ảnh xác nhận qua email hỗ trợ để được kích hoạt.',
    },
    {
      q: 'Nên chọn gói Premium nào?',
      a: 'Nếu bạn đang tìm việc tích cực, gói 3 tháng là lựa chọn cân bằng nhất — tiết kiệm 48.000đ so với mua tháng lẻ. Nếu muốn tối ưu chi phí lâu dài, gói 1 năm chỉ khoảng 25.000đ/tháng và tiết kiệm nhiều nhất.',
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
