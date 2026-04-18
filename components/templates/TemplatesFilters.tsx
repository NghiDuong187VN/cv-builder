import { Search } from 'lucide-react';
import styles from '@/components/templates/TemplatesPage.module.css';
import {
  ACCESS_FILTERS,
  INDUSTRY_FILTERS,
  SORT_OPTIONS,
  STYLE_FILTERS,
  type TemplateAccessFilter,
  type TemplateIndustryFilter,
  type TemplateSort,
  type TemplateStyleFilter,
} from '@/components/templates/templateCatalog';

type FiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  styleFilter: TemplateStyleFilter;
  onStyleChange: (value: TemplateStyleFilter) => void;
  industryFilter: TemplateIndustryFilter;
  onIndustryChange: (value: TemplateIndustryFilter) => void;
  accessFilter: TemplateAccessFilter;
  onAccessChange: (value: TemplateAccessFilter) => void;
  sortBy: TemplateSort;
  onSortChange: (value: TemplateSort) => void;
};

export default function TemplatesFilters(props: FiltersProps) {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.toolbar}>
          <div className={styles.toolbarTop}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                value={props.search}
                onChange={event => props.onSearchChange(event.target.value)}
                placeholder="Tìm theo tên mẫu..."
                className={styles.searchInput}
              />
            </div>

            <select
              className={styles.sortSelect}
              value={props.sortBy}
              onChange={event => props.onSortChange(event.target.value as TemplateSort)}
              aria-label="Sắp xếp mẫu"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroupWrap}>
            <div>
              <p className={styles.filterGroupTitle}>Theo phong cách</p>
              <div className={styles.filterChips}>
                {STYLE_FILTERS.map(filter => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`${styles.chip} ${props.styleFilter === filter.key ? styles.chipActive : ''}`}
                    onClick={() => props.onStyleChange(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={styles.filterGroupTitle}>Theo ngành / mục đích</p>
              <div className={styles.filterChips}>
                {INDUSTRY_FILTERS.map(filter => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`${styles.chip} ${props.industryFilter === filter.key ? styles.chipActive : ''}`}
                    onClick={() => props.onIndustryChange(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={styles.filterGroupTitle}>Theo quyền truy cập</p>
              <div className={styles.filterChips}>
                {ACCESS_FILTERS.map(filter => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`${styles.chip} ${props.accessFilter === filter.key ? styles.chipActive : ''}`}
                    onClick={() => props.onAccessChange(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
