'use client';

import { useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Calendar, GitBranch, Globe, Link2, Mail, MapPin, Phone, Upload, User, UserCircle, X, Image as ImageIcon } from 'lucide-react';

import type { PersonalInfo } from '@/lib/types';

interface Props {
  uid: string;
  cvId: string;
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

const TIPS: Record<keyof PersonalInfo, string | null> = {
  fullName: 'Ghi đúng họ tên đầy đủ theo CMND/CCCD',
  jobTitle: 'Vị trí bạn muốn ứng tuyển, VD: Frontend Developer',
  email: 'Email chuyên nghiệp, tránh dùng tên ngộ nghĩnh',
  phone: 'Số điện thoại đang hoạt động',
  address: 'Chỉ cần ghi Quận/Huyện, Tỉnh/Thành phố',
  dateOfBirth: 'Không bắt buộc ở một số vị trí',
  gender: null,
  linkedin: 'Profile LinkedIn giúp tăng thuyết phục NTD',
  github: 'Bắt buộc với vị trí kỹ thuật',
  website: 'Portfolio website nếu có',
  avatarUrl: 'Ảnh chuyên nghiệp, nền trắng hoặc xám nhạt',
};

/** Resize + compress image to base64. Max dimension 400x400. Target < 200KB. */
async function processImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('File ảnh không hợp lệ'));
      img.onload = () => {
        const MAX = 400;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas không hoạt động'));
        ctx.drawImage(img, 0, 0, width, height);

        // Try qualities from 0.85 down to get < 200KB
        const qualities = [0.85, 0.75, 0.65, 0.55];
        for (const q of qualities) {
          const dataUrl = canvas.toDataURL('image/jpeg', q);
          const bytes = Math.round((dataUrl.length * 3) / 4);
          if (bytes <= 200 * 1024 || q === qualities[qualities.length - 1]) {
            return resolve(dataUrl);
          }
        }
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function Field({
  label,
  icon,
  tip,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  tip?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: 'var(--primary)' }}>{icon}</span>
        <label style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{label}</label>
        {tip && (
          <span
            title={tip}
            style={{
              cursor: 'help',
              color: 'var(--text-muted)',
              fontSize: '0.7rem',
              background: 'var(--bg-base)',
              padding: '1px 6px',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
            }}
          >
            ?
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function PersonalInfoForm({ uid, cvId, data, onChange }: Props) {
  const update = (field: keyof PersonalInfo, value: string) => onChange({ ...data, [field]: value });

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [linkMode, setLinkMode] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh (JPG/PNG/WebP/GIF)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Ảnh quá lớn (tối đa 20MB)');
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await processImageToBase64(file);
      update('avatarUrl', dataUrl);
      toast.success('Đã tải ảnh lên thành công! 🎉');
    } catch (err) {
      console.error('[upload avatar]', err);
      toast.error('Không thể xử lý ảnh. Thử định dạng khác (JPG/PNG).');
    } finally {
      setUploading(false);
    }
  }, [data, onChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    e.target.value = '';
    if (!file) return;
    await processFile(file);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const isDataUrl = data.avatarUrl?.startsWith('data:');
  const hasAvatar = !!data.avatarUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Avatar upload area */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

        {/* Preview circle */}
        <div
          style={{
            width: '80px', height: '80px',
            borderRadius: '50%',
            background: hasAvatar ? 'transparent' : 'var(--bg-base)',
            border: dragOver ? '2px solid var(--primary)' : '2px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            boxShadow: hasAvatar ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
          }}
          onClick={() => fileRef.current?.click()}
          title="Click để chọn ảnh"
        >
          {hasAvatar ? (
            <img src={data.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <UserCircle size={32} color="var(--text-muted)" />
          )}
        </div>

        {/* Controls */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Ảnh đại diện</p>
            <button
              type="button"
              onClick={() => setLinkMode(!linkMode)}
              style={{
                fontSize: '0.7rem', padding: '2px 8px', borderRadius: '9999px', cursor: 'pointer',
                background: linkMode ? 'rgba(99,102,241,0.1)' : 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontFamily: 'inherit', transition: 'all 0.2s',
              }}
            >
              {linkMode ? '📁 Chọn file' : '🔗 Dán link'}
            </button>
          </div>

          {linkMode ? (
            /* Link input mode */
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                className="input"
                placeholder="https://... — Dán link ảnh vào đây"
                value={(!isDataUrl && data.avatarUrl) ? data.avatarUrl : ''}
                onChange={e => update('avatarUrl', e.target.value)}
                style={{ fontSize: '0.82rem', padding: '8px 12px', flex: 1 }}
              />
            </div>
          ) : (
            /* Drag & Drop upload zone */
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !uploading && fileRef.current?.click()}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                background: dragOver ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.02)',
                cursor: uploading ? 'wait' : 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: '3px solid rgba(99,102,241,0.2)',
                    borderTop: '3px solid var(--primary)',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Đang xử lý ảnh...</p>
                </div>
              ) : (
                <>
                  <Upload size={20} color="var(--primary)" style={{ margin: '0 auto 6px', display: 'block' }} />
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {dragOver ? 'Thả ảnh vào đây!' : 'Kéo thả ảnh vào đây'}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    hoặc click để chọn file · JPG, PNG, WebP · Tối đa 20MB
                  </p>
                </>
              )}
            </div>
          )}

          {hasAvatar && (
            <button
              type="button"
              onClick={() => update('avatarUrl', '')}
              style={{
                marginTop: '6px',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', padding: '2px 0',
              }}
            >
              <X size={12} /> Xóa ảnh
            </button>
          )}

          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Tip for non-link mode */}
      {!linkMode && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(99,102,241,0.04)', padding: '8px 12px', borderRadius: '8px' }}>
          💡 Ảnh sẽ được nén tự động và lưu trực tiếp vào CV. Dùng ảnh vuông, rõ mặt, nền sáng để trông chuyên nghiệp hơn.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Họ và tên *" icon={<User size={14} />} tip={TIPS.fullName}>
          <input className="input" placeholder="Nguyễn Văn A" value={data.fullName} onChange={e => update('fullName', e.target.value)} />
        </Field>
        <Field label="Vị trí ứng tuyển *" icon={<UserCircle size={14} />} tip={TIPS.jobTitle}>
          <input className="input" placeholder="Frontend Developer" value={data.jobTitle} onChange={e => update('jobTitle', e.target.value)} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Email *" icon={<Mail size={14} />} tip={TIPS.email}>
          <input className="input" type="email" placeholder="email@example.com" value={data.email} onChange={e => update('email', e.target.value)} />
        </Field>
        <Field label="Số điện thoại *" icon={<Phone size={14} />} tip={TIPS.phone}>
          <input className="input" placeholder="0912 345 678" value={data.phone} onChange={e => update('phone', e.target.value)} />
        </Field>
      </div>

      <Field label="Địa chỉ" icon={<MapPin size={14} />} tip={TIPS.address}>
        <input className="input" placeholder="Quận 1, Hồ Chí Minh" value={data.address} onChange={e => update('address', e.target.value)} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Ngày sinh" icon={<Calendar size={14} />} tip={TIPS.dateOfBirth}>
          <input className="input" type="date" value={data.dateOfBirth || ''} onChange={e => update('dateOfBirth', e.target.value)} />
        </Field>
        <Field label="Giới tính" icon={<User size={14} />} tip={null}>
          <select className="input" value={data.gender || ''} onChange={e => update('gender', e.target.value)}>
            <option value="">-- Chọn --</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </Field>
      </div>

      <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
        <p
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
          }}
        >
          Liên kết mạng xã hội
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field label="LinkedIn" icon={<Link2 size={14} />} tip={TIPS.linkedin}>
            <input className="input" placeholder="linkedin.com/in/username" value={data.linkedin || ''} onChange={e => update('linkedin', e.target.value)} />
          </Field>
          <Field label="GitHub" icon={<GitBranch size={14} />} tip={TIPS.github}>
            <input className="input" placeholder="github.com/username" value={data.github || ''} onChange={e => update('github', e.target.value)} />
          </Field>
          <Field label="Website / Portfolio" icon={<Globe size={14} />} tip={TIPS.website}>
            <input className="input" placeholder="https://yourwebsite.com" value={data.website || ''} onChange={e => update('website', e.target.value)} />
          </Field>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
