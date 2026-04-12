'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { Ban, CheckCircle, Crown, Search, Shield, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

import AdminShell from '@/components/admin/AdminShell';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value) {
    const v = value as { seconds?: number; toMillis?: () => number };
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (typeof v.seconds === 'number') return v.seconds * 1000;
  }
  return 0;
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => d.data() as User));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      u => (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const runUpdate = async (uid: string, patch: Partial<User>, successText: string) => {
    setSavingUid(uid);
    try {
      await updateDoc(doc(db, 'users', uid), patch as Record<string, unknown>);
      setUsers(prev => prev.map(u => (u.uid === uid ? { ...u, ...patch } : u)));
      toast.success(successText);
    } catch (error) {
      console.error(error);
      toast.error('Cập nhật thất bại');
    } finally {
      setSavingUid(null);
    }
  };

  return (
    <AdminShell title="User Management" subtitle="Khóa/mở khoá, cấp quyền admin, đổi plan">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>
          {users.length} users • {users.filter(u => u.isAdmin).length} admin • {users.filter(u => u.plan === 'premium').length} premium
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '9px 12px' }}>
          <Search size={15} color="rgba(255,255,255,0.45)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm user..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', width: '220px' }}
          />
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '980px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['User', 'Email', 'Plan', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '18px 12px', color: 'rgba(255,255,255,0.55)' }}>
                  Loading users...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '18px 12px', color: 'rgba(255,255,255,0.45)' }}>
                  Không có dữ liệu phù hợp.
                </td>
              </tr>
            ) : (
              filtered
                .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
                .map(u => {
                  const busy = savingUid === u.uid;
                  return (
                    <tr key={u.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" style={{ width: '30px', height: '30px', borderRadius: '9999px' }} />
                          ) : (
                            <div style={{ width: '30px', height: '30px', borderRadius: '9999px', background: 'rgba(99,102,241,0.3)', color: '#c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}>
                              {(u.displayName || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p style={{ color: 'white', fontSize: '0.86rem', fontWeight: 600 }}>{u.displayName || 'Unnamed'}</p>
                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.74rem' }}>@{u.username || 'no-username'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.62)', fontSize: '0.82rem' }}>{u.email}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', background: u.plan === 'premium' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.1)', color: u.plan === 'premium' ? '#f59e0b' : 'rgba(255,255,255,0.68)' }}>
                          {u.plan === 'premium' ? <Crown size={10} /> : null}
                          {u.plan}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', background: u.isAdmin ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)', color: u.isAdmin ? '#93c5fd' : 'rgba(255,255,255,0.65)' }}>
                          {u.isAdmin ? 'admin' : 'user'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: u.isActive !== false ? '#34d399' : '#f87171', fontSize: '0.8rem', fontWeight: 600 }}>
                        {u.isActive !== false ? 'Active' : 'Locked'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.52)', fontSize: '0.8rem' }}>{toMillis(u.createdAt) ? new Date(toMillis(u.createdAt)).toLocaleDateString('vi-VN') : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            disabled={busy}
                            onClick={() => runUpdate(u.uid, { isActive: u.isActive === false }, u.isActive === false ? 'Đã mở khoá user' : 'Đã khoá user')}
                            className="btn btn-ghost btn-sm"
                            style={{ color: u.isActive === false ? '#34d399' : '#f87171', border: `1px solid ${u.isActive === false ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}` }}
                          >
                            {u.isActive === false ? <CheckCircle size={13} /> : <Ban size={13} />}
                            {u.isActive === false ? 'Mở khoá' : 'Khoá'}
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => runUpdate(u.uid, { isAdmin: !u.isAdmin }, !u.isAdmin ? 'Đã cấp quyền admin' : 'Đã gỡ quyền admin')}
                            className="btn btn-ghost btn-sm"
                            style={{ color: u.isAdmin ? '#fbbf24' : '#93c5fd', border: `1px solid ${u.isAdmin ? 'rgba(251,191,36,0.35)' : 'rgba(147,197,253,0.35)'}` }}
                          >
                            {u.isAdmin ? <ShieldOff size={13} /> : <Shield size={13} />}
                            {u.isAdmin ? 'Gỡ admin' : 'Cấp admin'}
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => runUpdate(u.uid, { plan: u.plan === 'premium' ? 'free' : 'premium' }, u.plan === 'premium' ? 'Đã hạ xuống free' : 'Đã nâng lên premium')}
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' }}
                          >
                            <Crown size={13} />
                            {u.plan === 'premium' ? 'Set free' : 'Set premium'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

