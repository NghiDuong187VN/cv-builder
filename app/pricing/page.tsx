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
              Bảng giá minh bạch
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
            Bản CV đẹp là bước đầu.
            <br />
            <span
              style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Bán khả năng qua vòng mới là giá trị thật.
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
            Gói Free giúp người dùng vào nhanh và thấy giá trị ngay. Gói Premium mở khóa phần ăn tiền nhất:
            AI viết lại kinh nghiệm, ATS review theo JD và cover letter tạo xong có thể lưu ngay vào tài khoản.
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
      a: 'Đủ để bắt đầu. Người dùng có thể tạo CV đẹp, xuất PDF, chia sẻ link và dùng AI tạo phần tóm tắt cơ bản 3 lượt mỗi ngày. Premium dành cho giai đoạn cần tối ưu CV theo từng vị trí cụ thể.',
    },
    {
      q: 'Premium đáng tiền ở điểm nào?',
      a: 'Premium đáng tiền khi bạn đang ứng tuyển nghiêm túc: AI viết lại từng mục kinh nghiệm, ATS score có khoảng trống từ khóa rõ ràng, và cover letter tạo theo target job cùng job description. Đây là những tính năng tạo chênh lệch rõ với gói Free.',
    },
    {
      q: 'Tính năng AI hoạt động như thế nào?',
      a: 'Gemini chạy ở backend nên không lộ API key trên client. AI dùng dữ liệu thật từ CV như target job, target company và job description để sinh nội dung. Premium sử dụng bộ logic đầy đủ hơn gói Free.',
    },
    {
      q: 'ATS Optimizer trả về gì?',
      a: 'ATS Optimizer trả về điểm ATS, điểm mạnh, khoảng trống, từ khóa còn thiếu và danh sách gợi ý cải thiện. Mục tiêu là giúp bạn biết phần nào cần sửa trước khi gửi CV.',
    },
    {
      q: 'Cover letter AI đã lưu được chưa?',
      a: 'Đã. Sau khi tạo cover letter trong editor, bạn có thể sửa lại, sao chép hoặc lưu thẳng vào tài khoản Firestore để dùng lại sau.',
    },
    {
      q: 'Có được dùng thử trước khi nâng cấp không?',
      a: 'Có. Gói Free đã mở phần tóm tắt AI 3 lượt mỗi ngày. Đây là cách để bạn thử giá trị của AI trước khi quyết định nâng cấp Premium.',
    },
  ];

  return (
    <section className="section" style={{ background: 'rgba(99,102,241,0.02)' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '12px' }}>
            Câu hỏi thường gặp
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Nội dung ở đây đã được cân lại theo đúng tính năng hiện có trong sản phẩm.
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
