'use client';

import { useRef, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import toast from 'react-hot-toast';
import { Calendar, GitBranch, Globe, Link2, Mail, MapPin, Phone, User, UserCircle } from 'lucide-react';

import { uploadAvatar } from '@/lib/storage';
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

  const pickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    // Allow selecting the same file again.
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh (JPG/PNG/WebP)');
      return;
    }
    if (!uid || !cvId) {
      toast.error('Thiếu thông tin người dùng hoặc CV để upload ảnh');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Ảnh quá lớn (tối đa 20MB)');
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadAvatar({ uid, cvId, file });
      update('avatarUrl', url);
      toast.success('Đã tải ảnh lên');
    } catch (err) {
      console.error(err);
      if (err instanceof FirebaseError) {
        if (err.code === 'storage/unauthorized') {
          toast.error('Bạn không có quyền upload ảnh. Cần cập nhật Firebase Storage Rules.');
        } else if (err.code === 'storage/canceled') {
          toast.error('Đã hủy tải ảnh');
        } else {
          toast.error(`Tải ảnh thất bại (${err.code})`);
        }
      } else {
        toast.error('Tải ảnh thất bại');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          background: 'rgba(99,102,241,0.04)',
          borderRadius: '12px',
          border: '1px dashed var(--border)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--bg-base)',
            border: '2px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <UserCircle size={28} color="var(--text-muted)" />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>Ảnh đại diện</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Ảnh chuyên nghiệp, nền sáng</p>

          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              className="input"
              placeholder="Dán link ảnh tại đây... hoặc tải ảnh lên"
              value={data.avatarUrl || ''}
              onChange={e => update('avatarUrl', e.target.value)}
              style={{ fontSize: '0.82rem', padding: '8px 12px', flex: 1 }}
              disabled={uploading}
            />
            <button type="button" onClick={pickFile} className="btn btn-outline btn-sm" disabled={uploading} title="Tải ảnh lên Firebase Storage">
              {uploading ? 'Đang tải...' : 'Tải lên'}
            </button>
            {data.avatarUrl && (
              <button type="button" onClick={() => update('avatarUrl', '')} className="btn btn-ghost btn-sm" disabled={uploading} title="Xóa ảnh">
                Xóa
              </button>
            )}
          </div>

          <p style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Gợi ý: dùng ảnh vuông, rõ mặt, nền đơn sắc. Hỗ trợ tối đa 20MB (sẽ tự nén khi cần).
          </p>
        </div>
      </div>

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
    </div>
  );
}

