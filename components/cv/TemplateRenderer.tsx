import { CV } from '@/lib/types';
import MinimalTemplate from './templates/MinimalTemplate';
import ModernTemplate from './templates/ModernTemplate';
import HarvardTemplate from './templates/HarvardTemplate';
import CreativeTemplate from './templates/CreativeTemplate';

export default function TemplateRenderer({ cv }: { cv: CV }) {
  switch (cv.templateId) {
    case 'minimal-01':
    case 'professional-01':
      return <MinimalTemplate cv={cv} />;

    case 'harvard-01':
      return <HarvardTemplate cv={cv} />;

    case 'creative-01':
    case 'marketing-01':
    case 'student-01':
      return <CreativeTemplate cv={cv} />;

    case 'modern-01':
    case 'tech-01':
    default:
      return <ModernTemplate cv={cv} />;
  }
}
