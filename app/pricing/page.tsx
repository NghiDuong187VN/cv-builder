import Navbar from '@/components/layout/Navbar';
import AiBeforeAfter from '@/components/pricing/AiBeforeAfter';
import ComparisonTable from '@/components/pricing/ComparisonTable';
import PricingExperience from '@/components/pricing/PricingExperience';
import PricingFAQ from '@/components/pricing/PricingFAQ';
import PricingFooter from '@/components/pricing/PricingFooter';
import PricingHero from '@/components/pricing/PricingHero';
import PricingPlanAdvisor from '@/components/pricing/PricingPlanAdvisor';

export const metadata = {
  title: 'Bảng giá | CVFlow',
  description:
    'Bắt đầu miễn phí, nâng cấp Premium để tối ưu CV bằng AI, hoặc nạp credits khi chỉ cần dùng một vài tính năng trả phí.',
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <PricingHero />
        <PricingExperience />
        <ComparisonTable />
        <PricingPlanAdvisor />
        <AiBeforeAfter />
        <PricingFAQ />
        <PricingFooter />
      </main>
    </>
  );
}
