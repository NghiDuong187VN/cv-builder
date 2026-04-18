import Link from 'next/link';
import styles from '@/components/templates/TemplatesPage.module.css';
import { SUPPORT_INFO } from '@/lib/creator';

export default function TemplatesFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            <h3>Sản phẩm</h3>
            <ul>
              <li><Link href="/templates">Mẫu CV</Link></li>
              <li><Link href="/pricing">Bảng giá</Link></li>
              <li><Link href="/cv/new">Tạo CV mới</Link></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h3>Hỗ trợ</h3>
            <ul>
              <li><Link href="/support">Trung tâm hỗ trợ</Link></li>
              <li><a href={`mailto:${SUPPORT_INFO.email}`}>Email hỗ trợ</a></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h3>Pháp lý</h3>
            <ul>
              <li><Link href="/privacy-policy">Chính sách bảo mật</Link></li>
              <li><Link href="/terms">Điều khoản sử dụng</Link></li>
              <li><Link href="/refund-policy">Chính sách hoàn tiền</Link></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h3>Liên hệ</h3>
            <ul>
              <li>{SUPPORT_INFO.teamName}</li>
              <li>{SUPPORT_INFO.email}</li>
              <li>{SUPPORT_INFO.supportHours}</li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>© {new Date().getFullYear()} CVFlow. Thư viện mẫu CV được cập nhật liên tục để phù hợp nhiều ngành nghề hơn.</div>
      </div>
    </footer>
  );
}
