import { LayoutTemplate, RefreshCcw, SearchX } from 'lucide-react';
import styles from '@/components/templates/TemplatesPage.module.css';

export default function TemplatesEmptyState({
  type,
  onReset,
}: {
  type: 'library' | 'filtered';
  onReset?: () => void;
}) {
  const isFiltered = type === 'filtered';

  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        {isFiltered ? <SearchX size={30} /> : <LayoutTemplate size={30} />}
      </div>
      <h3 className={styles.emptyTitle}>
        {isFiltered ? 'Chưa có mẫu phù hợp với bộ lọc bạn chọn' : 'Thư viện mẫu đang được cập nhật'}
      </h3>
      <p className={styles.emptyDesc}>
        {isFiltered
          ? 'Hãy thử đổi bộ lọc, tìm kiếm theo tên khác hoặc quay về toàn bộ thư viện để xem thêm mẫu phù hợp.'
          : 'Trong lúc chờ thư viện đầy đủ hơn, bạn vẫn có thể bắt đầu ngay với mẫu mặc định và hoàn thiện CV sau.'}
      </p>

      <div className={styles.emptyActions}>
        {isFiltered ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={onReset}>
              <RefreshCcw size={16} />
              Xóa bộ lọc
            </button>
            <button type="button" className="btn btn-primary" onClick={onReset}>
              Xem tất cả mẫu
            </button>
          </>
        ) : (
          <a href="/cv/new" className="btn btn-primary">
            Tạo CV từ mẫu mặc định
          </a>
        )}
      </div>
    </div>
  );
}
