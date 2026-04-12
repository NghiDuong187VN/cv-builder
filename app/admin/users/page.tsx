'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/lib/types';
import { Shield, Ban, CheckCircle, Search, Crown } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value) {
    const asSeconds = value as { seconds?: unknown };
    if (typeof asSeconds.seconds === 'number') return asSeconds.seconds * 1000;
    const asMillis = value as { toMillis?: () => number };
    if (typeof asMillis.toMillis === 'function') return asMillis.toMillis();
  }
  return 0;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { firebaseUser, loading, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { if (!loading && (!firebaseUser || !isAdmin)) router.push('/dashboard'); }, [loading, firebaseUser, isAdmin, router]);
  useEffect(() => {
    if (isAdmin) getDocs(collection(db, 'users')).then(snap => setUsers(snap.docs.map(d => d.data() as User)));
  }, [isAdmin]);

  const toggleActive = async (uid: string, current: boolean) => {
    await updateDoc(doc(db, 'users', uid), { isActive: !current });
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isActive: !current } : u));
    toast.success(!current ? 'Đã mở tài khoản' : 'Đã khóa tài khoản');
  };

  const filtered = users.filter(u =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#060613', padding: '32px', paddingLeft: '272px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.83rem', textDecoration: 'none' }}>← Dashboard</Link>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: '1.4rem', marginTop: '8px' }}>👥 Quản lý Users</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{users.length} tài khoản tổng cộng</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '10px 16px' }}>
          <Search size={16} color="rgba(255,255,255,0.4)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm user..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', width: '200px' }} />
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
              {['Người dùng', 'Email', 'Gói', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {user.photoURL
                      ? <img src={user.photoURL} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>{user.displayName?.charAt(0)}</div>
                    }
                    <div>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>{user.displayName}</p>
                      {user.isAdmin && <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700 }}>ADMIN</span>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{user.email}</td>
                <td style={{ padding: '14px 20px' }}>
                  {user.plan === 'premium'
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}><Crown size={11} /> Premium</span>
                    : <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>Free</span>
                  }
                </td>
                <td style={{ padding: '14px 20px' }}>
                  {user.isActive !== false
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}><CheckCircle size={11} /> Hoạt động</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}><Ban size={11} /> Đã khóa</span>
                  }
                </td>
                <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>
                  {toMillis(user.createdAt) ? new Date(toMillis(user.createdAt)).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <button
                    onClick={() => toggleActive(user.uid, user.isActive !== false)}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      background: user.isActive !== false ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                      color: user.isActive !== false ? '#f87171' : '#34d399',
                      fontWeight: 600, fontSize: '0.78rem', fontFamily: 'inherit',
                    }}
                  >
                    {user.isActive !== false ? 'Khóa' : 'Mở khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.3)' }}>Không tìm thấy user nào</div>
        )}
      </div>
    </div>
  );
}
