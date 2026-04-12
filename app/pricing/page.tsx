import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PricingSection from '@/components/home/PricingSection';

export const metadata = {
  title: 'Bảng Giá | CVFlow',
  description: 'Chọn gói phù hợp với bạn. Bắt đầu miễn phí, nâng cấp khi cần.',
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '60px 24px 0' }}>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '12px' }}>
            💰 Bảng Giá
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: '1.05rem' }}>
            Bắt đầu hoàn toàn miễn phí. Nâng cấp bất cứ lúc nào để mở khóa toàn bộ tính năng.
          </p>
        </div>
        <PricingSection />
      </div>
      <Footer />
    </>
  );
}
