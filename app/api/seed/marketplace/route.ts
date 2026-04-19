/**
 * POST /api/seed/marketplace
 * Seeds demo marketplace data for internal testing.
 * Only runs in non-production or when SEED_SECRET matches.
 * Creates: 2 seller profiles, 8 templates, 4 reviews.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const SEED_SECRET = process.env.SEED_SECRET ?? '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ALLOW_SEED_IN_PRODUCTION = process.env.ALLOW_SEED_IN_PRODUCTION === 'true';

// ─── Demo data ──────────────────────────────────────────────────────────────────

const SELLERS = [
  {
    uid: 'demo-seller-001',
    displayName: 'Studio Minimal',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=studio-minimal',
    bio: 'Chuyên thiết kế CV tối giản, ATS-friendly cho các vị trí tech và startup. Hơn 5 năm kinh nghiệm trong lĩnh vực UX/UI.',
    website: 'https://studiominimal.design',
    portfolio: 'https://behance.net/studiominimal',
    status: 'approved',
    totalSalesCount: 47,
    totalEarningsCredits: 670,
    pendingEarningsCredits: 120,
    availableEarningsCredits: 550,
    paidOutEarningsCredits: 0,
    averageRating: 4.8,
    reviewCount: 23,
  },
  {
    uid: 'demo-seller-002',
    displayName: 'Creative CV Lab',
    avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=creative-cv-lab',
    bio: 'Lab thiết kế chuyên CV sáng tạo dành cho designer, marketer và executive. Luôn cập nhật xu hướng thiết kế mới nhất.',
    website: 'https://creativecvlab.io',
    portfolio: 'https://dribbble.com/creativecvlab',
    status: 'approved',
    totalSalesCount: 31,
    totalEarningsCredits: 490,
    pendingEarningsCredits: 85,
    availableEarningsCredits: 405,
    paidOutEarningsCredits: 0,
    averageRating: 4.6,
    reviewCount: 18,
  },
];

const TEMPLATES = [
  {
    sellerId: 'demo-seller-001',
    sellerName: 'Studio Minimal',
    sellerAvatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=studio-minimal',
    slug: 'clean-tech-pro',
    name: 'Clean Tech Pro',
    shortDescription: 'Mẫu CV tối giản dành cho Software Engineer, vượt qua ATS dễ dàng.',
    fullDescription: 'Clean Tech Pro được thiết kế đặc biệt cho các vị trí Software Engineer và Developer. Bố cục 1 cột rõ ràng, typography sắc nét, dễ dàng vượt qua hệ thống ATS. Phù hợp ứng tuyển tại các công ty tech lớn như Google, Meta, Amazon hay startup Việt Nam.\n\nĐặc điểm nổi bật: Section Skills nổi bật, timeline dự án rõ ràng, education và certification được ưu tiên.',
    category: 'tech',
    style: 'single-column',
    targetRole: 'developer',
    tags: ['ats', 'minimal', 'developer', 'clean', 'tech'],
    layoutType: '1col',
    isAtsFriendly: true,
    isPremiumStyle: false,
    priceCredits: 10,
    thumbnailUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=533&fit=crop&crop=top',
    previewImageUrls: [
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=1067&fit=crop&crop=top',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=1067&fit=crop',
    ],
    status: 'approved',
    totalSalesCount: 18,
    favoritesCount: 34,
    averageRating: 4.9,
    reviewCount: 12,
  },
  {
    sellerId: 'demo-seller-001',
    sellerName: 'Studio Minimal',
    sellerAvatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=studio-minimal',
    slug: 'nordic-minimal',
    name: 'Nordic Minimal',
    shortDescription: 'Phong cách Bắc Âu tối giản, sang trọng cho mọi ngành nghề.',
    fullDescription: 'Nordic Minimal lấy cảm hứng từ thiết kế Scandinavian — tối giản nhưng đầy tính nghệ thuật. Bảng màu trắng-xám-navy tạo cảm giác chuyên nghiệp và hiện đại.\n\nPhù hợp cho vị trí: Accountant, Finance, Business Analyst, Operations Manager. Typography được chọn lọc cẩn thận từ Google Fonts, tương thích in ấn tốt.',
    category: 'minimal',
    style: 'single-column',
    targetRole: 'accountant',
    tags: ['nordic', 'minimal', 'elegant', 'finance', 'clean'],
    layoutType: '1col',
    isAtsFriendly: true,
    isPremiumStyle: false,
    priceCredits: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=533&fit=crop',
    previewImageUrls: [
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=1067&fit=crop',
    ],
    status: 'approved',
    totalSalesCount: 14,
    favoritesCount: 22,
    averageRating: 4.7,
    reviewCount: 8,
  },
  {
    sellerId: 'demo-seller-001',
    sellerName: 'Studio Minimal',
    sellerAvatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=studio-minimal',
    slug: 'executive-edge',
    name: 'Executive Edge',
    shortDescription: 'Dành cho C-level và Senior Manager, thể hiện sự lãnh đạo ngay từ trang đầu.',
    fullDescription: 'Executive Edge được xây dựng cho những người đang nhắm đến vị trí quản lý cấp cao. Bố cục 2 cột với sidebar nhỏ bên trái giúp thể hiện thành tích và leadership rõ ràng.\n\nSection đặc biệt: Executive Summary mạnh mẽ, Key Achievements với bullet points định lượng, Board Experience và Awards nổi bật.',
    category: 'executive',
    style: 'sidebar',
    targetRole: 'executive',
    tags: ['executive', 'leadership', 'premium', 'senior', 'manager'],
    layoutType: '2col',
    isAtsFriendly: false,
    isPremiumStyle: true,
    priceCredits: 30,
    thumbnailUrl: 'https://images.unsplash.com/photo-1554774853-719586f82d77?w=400&h=533&fit=crop',
    previewImageUrls: [
      'https://images.unsplash.com/photo-1554774853-719586f82d77?w=800&h=1067&fit=crop',
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=1067&fit=crop',
    ],
    status: 'approved',
    totalSalesCount: 7,
    favoritesCount: 15,
    averageRating: 4.8,
    reviewCount: 5,
  },
  {
    sellerId: 'demo-seller-002',
    sellerName: 'Creative CV Lab',
    sellerAvatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=creative-cv-lab',
    slug: 'gradient-designer',
    name: 'Gradient Designer',
    shortDescription: 'Thiết kế gradient hiện đại dành riêng cho UX/UI Designer và Creative Director.',
    fullDescription: 'Gradient Designer là template CV duy nhất trên CVFlow sử dụng màu sắc gradient tinh tế để làm nổi bật profile của bạn mà vẫn đảm bảo tính chuyên nghiệp.\n\nPhù hợp cho: UX Designer, Product Designer, Creative Director, Art Director. Có section Portfolio / Case Study riêng biệt, cùng với Skills bar trực quan.',
    category: 'creative',
    style: 'two-column',
    targetRole: 'designer',
    tags: ['gradient', 'designer', 'ux', 'creative', 'portfolio'],
    layoutType: '2col',
    isAtsFriendly: false,
    isPremiumStyle: true,
    priceCredits: 20,
    thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=533&fit=crop',
    previewImageUrls: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=1067&fit=crop',
      'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=1067&fit=crop',
    ],
    status: 'approved',
    totalSalesCount: 12,
    favoritesCount: 28,
    averageRating: 4.6,
    reviewCount: 9,
  },
  {
    sellerId: 'demo-seller-002',
    sellerName: 'Creative CV Lab',
    sellerAvatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=creative-cv-lab',
    slug: 'marketing-pro-vi',
    name: 'Marketing Pro',
    shortDescription: 'CV chuyên cho Digital Marketer, Growth Hacker và Content Creator.',
    fullDescription: 'Marketing Pro tập trung vào hiển thị số liệu và kết quả — điều mà nhà tuyển dụng marketing cần thấy nhất. Section Campaigns & Results nổi bật, Social Media Metrics được hiển thị trực quan.\n\nPhù hợp cho: Digital Marketing Manager, Performance Marketing, Social Media Manager, Content Strategist.',
    category: 'marketing',
    style: 'single-column',
    targetRole: 'marketing',
    tags: ['marketing', 'digital', 'growth', 'content', 'metrics'],
    layoutType: '1col',
    isAtsFriendly: true,
    isPremiumStyle: false,
    priceCredits: 12,
    thumbnailUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=533&fit=crop',
    previewImageUrls: [
      'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&h=1067&fit=crop',
    ],
    status: 'approved',
    totalSalesCount: 9,
    favoritesCount: 19,
    averageRating: 4.5,
    reviewCount: 6,
  },
  {
    sellerId: 'demo-seller-002',
    sellerName: 'Creative CV Lab',
    sellerAvatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=creative-cv-lab',
    slug: 'fresh-graduate',
    name: 'Fresh Graduate',
    shortDescription: 'Mẫu hoàn hảo cho sinh viên mới ra trường tìm công việc đầu tiên.',
    fullDescription: 'Fresh Graduate được thiết kế để giúp sinh viên mới tốt nghiệp cạnh tranh hiệu quả dù chưa có nhiều kinh nghiệm làm việc. Tập trung vào Education, Projects, Internship và Skills.\n\nSection đặc biệt: GPA & Award nổi bật, Extracurricular Activities, Relevant Coursework, và một vùng Projects lớn để showcase side project.',
    category: 'student',
    style: 'single-column',
    targetRole: 'student',
    tags: ['student', 'graduate', 'fresher', 'intern', 'entry-level'],
    layoutType: '1col',
    isAtsFriendly: true,
    isPremiumStyle: false,
    priceCredits: 5,
    thumbnailUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=533&fit=crop',
    previewImageUrls: [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=1067&fit=crop',
    ],
    status: 'approved',
    totalSalesCount: 21,
    favoritesCount: 45,
    averageRating: 4.4,
    reviewCount: 15,
  },
  {
    sellerId: 'demo-seller-001',
    sellerName: 'Studio Minimal',
    sellerAvatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=studio-minimal',
    slug: 'modern-professional',
    name: 'Modern Professional',
    shortDescription: 'Kết hợp hoàn hảo giữa hiện đại và chuyên nghiệp, phù hợp mọi ngành.',
    fullDescription: 'Modern Professional là template đa năng nhất trong bộ sưu tập — thiết kế cân bằng giữa sáng tạo và truyền thống, phù hợp cho đa dạng vị trí và ngành nghề.\n\nLayout 2 cột với header nổi bật, dễ tùy chỉnh màu sắc. ATS-friendly nhờ cấu trúc HTML rõ ràng. Phù hợp cho: Project Manager, Business Analyst, HR Manager, Consultant.',
    category: 'modern',
    style: 'two-column',
    targetRole: 'all',
    tags: ['modern', 'professional', 'versatile', 'business', 'two-column'],
    layoutType: '2col',
    isAtsFriendly: true,
    isPremiumStyle: false,
    priceCredits: 15,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=533&fit=crop',
    previewImageUrls: [
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=1067&fit=crop',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=1067&fit=crop',
    ],
    status: 'approved',
    totalSalesCount: 5,
    favoritesCount: 11,
    averageRating: 4.7,
    reviewCount: 4,
  },
  {
    sellerId: 'demo-seller-002',
    sellerName: 'Creative CV Lab',
    sellerAvatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=creative-cv-lab',
    slug: 'sales-champion',
    name: 'Sales Champion',
    shortDescription: 'Được tối ưu để thể hiện doanh số và thành tích bán hàng ấn tượng.',
    fullDescription: 'Sales Champion giúp bạn nói lên ngôn ngữ của nhà tuyển dụng sales: con số, phần trăm tăng trưởng, và thành tích vượt quota. Section Key Numbers nổi bật ở đầu CV.\n\nPhù hợp cho: Sales Manager, Account Executive, Business Development, Key Account Manager.',
    category: 'sales',
    style: 'single-column',
    targetRole: 'sales',
    tags: ['sales', 'business-development', 'bd', 'revenue', 'quota'],
    layoutType: '1col',
    isAtsFriendly: true,
    isPremiumStyle: false,
    priceCredits: 10,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=533&fit=crop',
    previewImageUrls: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1067&fit=crop',
    ],
    status: 'approved',
    totalSalesCount: 8,
    favoritesCount: 17,
    averageRating: 4.3,
    reviewCount: 6,
  },
];

// Demo reviews (linked to template slugs, resolved to IDs at seed time)
const REVIEWS = [
  { templateSlug: 'clean-tech-pro', rating: 5, comment: 'Template cực tốt! Tôi đã dùng nó để apply vào Shopee và được gọi phỏng vấn ngay tuần đầu. ATS-friendly thực sự hiệu quả.', userName: 'Minh Tuấn' },
  { templateSlug: 'clean-tech-pro', rating: 5, comment: 'Rất chuyên nghiệp, layout sạch sẽ và dễ điền. Đáng đồng tiền bát gạo!', userName: 'Hoàng Linh' },
  { templateSlug: 'gradient-designer', rating: 4, comment: 'Đẹp và độc đáo. Phù hợp với portfolio của designer như mình. Chỉ tiếc là không ATS-friendly nhưng mình làm creative nên không quan trọng.', userName: 'Phương Anh' },
  { templateSlug: 'fresh-graduate', rating: 5, comment: 'Mới ra trường mà template này giúp mình trông rất chuyên nghiệp. Highly recommend cho sinh viên!', userName: 'Thu Hằng' },
  { templateSlug: 'nordic-minimal', rating: 4, comment: 'Thiết kế tối giản và sang trọng. Màu sắc trung tính rất phù hợp cho ngành tài chính.', userName: 'Đức Anh' },
];

export async function POST(req: NextRequest) {
  try {
    // ── Production guard ────────────────────────────────────────────────────
    if (IS_PRODUCTION && !ALLOW_SEED_IN_PRODUCTION) {
      return NextResponse.json(
        { error: 'Seed API is disabled in production. Set ALLOW_SEED_IN_PRODUCTION=true to override.' },
        { status: 403 }
      );
    }
    if (!SEED_SECRET) {
      return NextResponse.json(
        { error: 'SEED_SECRET env var is not configured.' },
        { status: 403 }
      );
    }

    const { secret } = await req.json().catch(() => ({ secret: '' }));

    if (secret !== SEED_SECRET) {
      return NextResponse.json({ error: 'Forbidden — invalid seed secret' }, { status: 403 });
    }

    const adminDb = getAdminDb();
    const batch = adminDb.batch();
    const now = FieldValue.serverTimestamp();
    const approvedAt = new Date('2026-04-01T00:00:00Z');

    // ── Seed sellers ─────────────────────────────────────────────────────────
    for (const seller of SELLERS) {
      const ref = adminDb.collection('seller_profiles').doc(seller.uid);
      const existing = await ref.get();
      if (!existing.exists) {
        batch.set(ref, { ...seller, createdAt: now, updatedAt: now, approvedAt });
      }
    }

    // ── Seed templates + collect slug→id mapping for reviews ─────────────────
    const slugToId: Record<string, string> = {};

    for (const tmpl of TEMPLATES) {
      // Check if slug already exists
      const q = await adminDb
        .collection('marketplace_templates')
        .where('slug', '==', tmpl.slug)
        .limit(1)
        .get();

      let docId: string;
      if (q.empty) {
        const ref = adminDb.collection('marketplace_templates').doc();
        docId = ref.id;
        batch.set(ref, {
          ...tmpl,
          id: docId,
          rejectionReason: null,
          templateConfigId: '',
          createdAt: now,
          updatedAt: now,
          approvedAt,
        });
      } else {
        docId = q.docs[0].id;
      }
      slugToId[tmpl.slug] = docId;
    }

    await batch.commit();

    // ── Seed reviews (separate batch after templates committed) ─────────────
    const reviewBatch = adminDb.batch();
    for (const r of REVIEWS) {
      const templateId = slugToId[r.templateSlug];
      if (!templateId) continue;

      // Check duplicate
      const existing = await adminDb
        .collection('template_reviews')
        .where('templateId', '==', templateId)
        .where('userName', '==', r.userName)
        .limit(1)
        .get();

      if (existing.empty) {
        const ref = adminDb.collection('template_reviews').doc();
        reviewBatch.set(ref, {
          id: ref.id,
          templateId,
          userId: `demo-user-${r.userName.replace(/\s/g, '-').toLowerCase()}`,
          userName: r.userName,
          userAvatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.userName}`,
          rating: r.rating,
          comment: r.comment,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }
    await reviewBatch.commit();

    return NextResponse.json({
      success: true,
      seeded: {
        sellers: SELLERS.length,
        templates: TEMPLATES.length,
        reviews: REVIEWS.length,
      },
    });
  } catch (err) {
    console.error('[seed/marketplace] error:', err);
    return NextResponse.json({ error: 'Seed failed', detail: String(err) }, { status: 500 });
  }
}
