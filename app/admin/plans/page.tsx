'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { Crown, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import AdminShell from '@/components/admin/AdminShell';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

export default function AdminPlansPage() {
  const [loading, setLoading] = useState(true);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => d.data() as User));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      if (filter !== 'all' && u.plan !== filter) return false;
      if (!q) return true;
      return (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });
  }, [users, search, filter]);

  const summary = useMemo(
    () => ({
      total: users.length,
      premium: users.filter(u => u.plan === 'premium').length,
      free: users.filter(u => u.plan === 'free').length,
    }),
    [users]
  );

  const setPlan = async (uid: string, plan: 'free' | 'premium') => {
    setSavingUid(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { plan });
      setUsers(prev => prev.map(u => (u.uid === uid ? { ...u, plan } : u)));
      toast.success(`Đã cập nhật plan: ${plan}`);
    } catch (error) {
      console.error(error);
      toast.error('Cập nhật plan thất bại');
    } finally {
      setSavingUid(null);
    }
  };

  return (
    <AdminShell title="Plan Management" subtitle="Quản lý user free/premium">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <SummaryCard label="Total users" value={summary.total} />
        <SummaryCard label="Free users" value={summary.free} />
        <SummaryCard label="Premium users" value={summary.premium} />
        <SummaryCard label="Premium rate" value={`${Math.round((summary.premium / Math.max(summary.total, 1)) * 100)}%`} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '9px 12px' }}>
          <Search size={15} color="rgba(255,255,255,0.45)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm user..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontFamily: 'inherit', fontSize: '0.88rem', width: '220px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'free', 'premium'] as const).map(x => (
            <button
              key={x}
              onClick={() => setFilter(x)}
              className="btn btn-ghost btn-sm"
              style={{ border: '1px solid rgba(148,163,184,0.35)', background: filter === x ? 'rgba(99,102,241,0.22)' : 'transparent', color: filter === x ? '#c7d2fe' : 'rgba(255,255,255,0.7)' }}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['User', 'Email', 'Current plan', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: '18px 12px', color: 'rgba(255,255,255,0.55)' }}>
                  Loading users...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '18px 12px', color: 'rgba(255,255,255,0.45)' }}>
                  Không có dữ liệu phù hợp.
                </td>
              </tr>
            ) : (
              filtered.map(u => (
                <tr key={u.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 12px', color: 'white', fontWeight: 600, fontSize: '0.86rem' }}>{u.displayName || 'Unnamed'}</td>
                  <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>{u.email}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', background: u.plan === 'premium' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.1)', color: u.plan === 'premium' ? '#f59e0b' : 'rgba(255,255,255,0.68)' }}>
                      {u.plan === 'premium' ? <Crown size={10} /> : null}
                      {u.plan}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        disabled={savingUid === u.uid || u.plan === 'free'}
                        onClick={() => setPlan(u.uid, 'free')}
                        className="btn btn-ghost btn-sm"
                        style={{ border: '1px solid rgba(148,163,184,0.35)' }}
                      >
                        Set free
                      </button>
                      <button
                        disabled={savingUid === u.uid || u.plan === 'premium'}
                        onClick={() => setPlan(u.uid, 'premium')}
                        className="btn btn-ghost btn-sm"
                        style={{ border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b' }}
                      >
                        Set premium
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '14px' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.76rem', marginBottom: '6px' }}>{label}</p>
      <p style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>{value}</p>
    </div>
  );
}

