import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PricingSection from '@/components/home/PricingSection';
import FeatureComparison from '@/components/home/FeatureComparison';
import BeforeAfterShowcase from '@/components/home/BeforeAfterShowcase';

export const metadata = {
  title: 'Bảng Giá | CVFlow',
  description:
    'Chọn gói phù hợp. Bắt đầu miễn phí, nâng cấp khi cần. Premium mở khóa ATS Optimizer, cover letter AI và viết lại kinh nghiệm bằng Gemini.',
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
              Bảng Giá Dịch Vụ
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
            Bản CV ấn tượng là bước đầu tiên
            <br />
            <span
              style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              để chinh phục nhà tuyển dụng.
            </span>
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '700px',
              margin: '0 auto',
              fontSize: '1.05rem',
              lineHeight: 1.7,
            }}
          >
            Bắt đầu với Gói Miễn Phí để trải nghiệm ứng dụng ngay hôm nay. Nâng cấp Premium để mở khoá sức mạnh AI: tự động cải thiện nội dung, phân tích chuẩn ATS theo JD và tạo Cover Letter chuyên nghiệp.
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
      q: 'Gói miễn phí có đủ để xin việc không?',
      a: 'Hoàn toàn đủ. Bạn có quyền truy cập các mẫu CV miễn phí, xuất file PDF chất lượng cao, chia sẻ link trực tuyến và sử dụng AI hỗ trợ viết tóm tắt cơ bản (3 lần/ngày). Gói Premium dành cho giai đoạn bạn cần tối ưu chuyên sâu hơn.',
    },
    {
      q: 'Tính năng Premium giúp ích gì cho tôi?',
      a: 'Premium mang lại lợi thế cạnh tranh lớn: AI tư vấn viết lại từng mục kinh nghiệm, chấm điểm ATS so với mô tả công việc (JD), gợi ý từ khoá và tính năng tự động tạo Cover Letter cá nhân hoá cho từng công ty.',
    },
    {
      q: 'Tính năng AI hoạt động như thế nào?',
      a: 'Hệ thống tích hợp Gemini AI từ Google. Dựa vào mục tiêu nghề nghiệp, kỹ năng và JD bạn cung cấp, AI sẽ phân tích và đề xuất cách hành văn chuyên nghiệp nhất để làm nổi bật trình độ của bạn.',
    },
    {
      q: 'Trình tối ưu ATS (ATS Optimizer) trả về kết quả gì?',
      a: 'Bạn sẽ nhận được điểm tương thích ATS (%), phân tích điểm mạnh, điểm yếu, các từ khoá còn thiếu so với JD, và các gợi ý cải thiện cụ thể để đảm bảo CV vượt qua vòng lọc tự động của nhà tuyển dụng.',
    },
    {
      q: 'Tôi có thể lưu lại Cover Letter không?',
      a: 'Có. Mọi Cover Letter bạn tạo và chỉnh sửa đều được lưu trữ an toàn trong tài khoản của bạn để dễ dàng tái sử dụng cho các lần ứng tuyển tiếp theo.',
    },
    {
      q: 'Tôi có thể dùng thử trước khi mua không?',
      a: 'Gói Free hiện đang mở tính năng AI cho phần tóm tắt (3 lượt/ngày). Bạn hãy trải nghiệm thử độ thông minh của AI trước khi quyết định nâng cấp Premium nhé.',
    },
  ];

  return (
    <section className="section" style={{ background: 'rgba(99,102,241,0.02)' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '12px' }}>
            Câu hỏi thường gặp (FAQ)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Giải đáp mọi thắc mắc của bạn về sản phẩm và lộ trình nâng cấp gói cước.
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
