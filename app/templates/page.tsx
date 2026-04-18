'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import TemplateCard from '@/components/templates/TemplateCard';
import TemplateRecommendationSection from '@/components/templates/TemplateRecommendationSection';
import TemplatePreviewModal from '@/components/templates/TemplatePreviewModal';
import TemplatesEmptyState from '@/components/templates/TemplatesEmptyState';
import TemplatesFilters from '@/components/templates/TemplatesFilters';
import TemplatesFooter from '@/components/templates/TemplatesFooter';
import TemplatesHero from '@/components/templates/TemplatesHero';
import styles from '@/components/templates/TemplatesPage.module.css';
import {
  buildTemplateLibrary,
  getDefaultLibrary,
  getFallbackLibrary,
  getTemplateStats,
  type TemplateAccessFilter,
  type TemplateIndustryFilter,
  type TemplateLibraryItem,
  type TemplateSort,
  type TemplateStyleFilter,
} from '@/components/templates/templateCatalog';
import { getTemplates } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isPremiumUser = user?.plan === 'premium';

  const [templates, setTemplates] = useState<TemplateLibraryItem[]>(getDefaultLibrary());
  const [previewTemplate, setPreviewTemplate] = useState<TemplateLibraryItem | null>(null);
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState<TemplateStyleFilter>('all');
  const [industryFilter, setIndustryFilter] = useState<TemplateIndustryFilter>('all');
  const [accessFilter, setAccessFilter] = useState<TemplateAccessFilter>('all');
  const [sortBy, setSortBy] = useState<TemplateSort>('popular');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTemplates() {
      setLoading(true);

      try {
        const list = await getTemplates();
        if (!isMounted) return;

        if (list.length > 0) {
          setTemplates(buildTemplateLibrary(list));
          setLoadFailed(false);
        } else {
          setTemplates(getFallbackLibrary());
          setLoadFailed(false);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
        if (!isMounted) return;
        setTemplates(getFallbackLibrary());
        setLoadFailed(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const next = templates.filter(template => {
      const matchesSearch =
        !normalizedSearch ||
        template.name.toLowerCase().includes(normalizedSearch) ||
        template.description.toLowerCase().includes(normalizedSearch) ||
        template.tags.some(tag => tag.toLowerCase().includes(normalizedSearch));

      const matchesStyle =
        styleFilter === 'all' || template.style.includes(styleFilter);

      const matchesIndustry =
        industryFilter === 'all' || template.industries.includes(industryFilter);

      const matchesAccess =
        accessFilter === 'all' ||
        (accessFilter === 'premium' ? template.isPremium : !template.isPremium);

      return matchesSearch && matchesStyle && matchesIndustry && matchesAccess;
    });

    return [...next].sort((left, right) => {
      if (sortBy === 'newest') {
        return Number(right.isNew) - Number(left.isNew) || right.popularity - left.popularity;
      }

      if (sortBy === 'easy') {
        return right.easeScore - left.easeScore || right.popularity - left.popularity;
      }

      return right.popularity - left.popularity;
    });
  }, [accessFilter, industryFilter, search, sortBy, styleFilter, templates]);

  const stats = getTemplateStats(templates);
  const hasTemplates = templates.length > 0;
  const hasFilteredResults = filteredTemplates.length > 0;

  const featuredTemplates = useMemo(
    () => [...templates].sort((left, right) => right.popularity - left.popularity).slice(0, 8),
    [templates]
  );

  const resetFilters = () => {
    setSearch('');
    setStyleFilter('all');
    setIndustryFilter('all');
    setAccessFilter('all');
    setSortBy('popular');
  };

  const handleUseTemplate = (template: TemplateLibraryItem) => {
    if (template.isPremium && !isPremiumUser) {
      router.push('/pricing');
      return;
    }

    router.push(`/cv/new?template=${template.templateId}`);
  };

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <TemplatesHero
          featuredTemplates={featuredTemplates}
          freeCount={stats.freeCount}
          premiumCount={stats.premiumCount}
          industryCount={stats.industryCount}
        />

        <TemplatesFilters
          search={search}
          onSearchChange={setSearch}
          styleFilter={styleFilter}
          onStyleChange={setStyleFilter}
          industryFilter={industryFilter}
          onIndustryChange={setIndustryFilter}
          accessFilter={accessFilter}
          onAccessChange={setAccessFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Thư viện mẫu CV</h2>
                <p className={styles.sectionDesc}>
                  Mỗi mẫu đều thể hiện rõ quyền truy cập, phong cách và nhóm người dùng phù hợp.
                </p>
              </div>
            </div>

            <div className={styles.resultsMeta}>
              <p className={styles.resultsCount}>
                {loading ? 'Đang tải thư viện...' : `${filteredTemplates.length} mẫu đang hiển thị`}
              </p>
              <div className={styles.resultsActions}>
                {(search || styleFilter !== 'all' || industryFilter !== 'all' || accessFilter !== 'all') ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilters}>
                    Xóa bộ lọc
                  </button>
                ) : null}
                {loadFailed ? (
                  <span className={styles.tag}>Đang dùng dữ liệu fallback</span>
                ) : null}
              </div>
            </div>

            {loading ? (
              <div className={styles.skeletonGrid}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className={`skeleton ${styles.skeletonCard}`} />
                ))}
              </div>
            ) : !hasTemplates ? (
              <TemplatesEmptyState type="library" />
            ) : !hasFilteredResults ? (
              <TemplatesEmptyState type="filtered" onReset={resetFilters} />
            ) : (
              <motion.div
                className={styles.grid}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24 }}
              >
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isPremiumUser={Boolean(isPremiumUser)}
                    onPreview={setPreviewTemplate}
                    onUse={handleUseTemplate}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </section>

        <TemplateRecommendationSection
          templates={templates}
          onSelect={template => setPreviewTemplate(template)}
        />

        <TemplatesFooter />
      </main>

      <TemplatePreviewModal
        template={previewTemplate}
        isPremiumUser={Boolean(isPremiumUser)}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleUseTemplate}
      />
    </>
  );
}
