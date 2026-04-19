'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { Eye, FileText, Grid3X3, Star, Users } from 'lucide-react';

import AdminShell from '@/components/admin/AdminShell';
import { db } from '@/lib/firebase';
import type { CV, Template, User } from '@/lib/types';

type DashboardState = {
  users: User[];
  cvs: CV[];
  templates: Template[];
};

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

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<DashboardState>({ users: [], cvs: [], templates: [] });

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'cvs')),
      getDocs(collection(db, 'templates')),
    ]).then(([usersSnap, cvsSnap, templatesSnap]) => {
      setState({
        users: usersSnap.docs.map(d => d.data() as User),
        cvs: cvsSnap.docs.map(d => ({ ...d.data(), cvId: d.id } as CV)),
        templates: templatesSnap.docs.map(d => d.data() as Template),
      });
      setLoading(false);
    });
  }, []);

  const metrics = useMemo(() => {
    const premiumUsers = state.users.filter(u => u.plan === 'premium').length;
    const activeUsers = state.users.filter(u => u.isActive !== false).length;
    const totalViews = state.cvs.reduce((sum, cv) => sum + (cv.viewCount || 0), 0);
    const totalDownloads = state.cvs.reduce((sum, cv) => sum + (cv.downloadCount || 0), 0);

    const templateUsageMap = state.cvs.reduce<Record<string, number>>((acc, cv) => {
      const key = cv.templateId || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const topTemplates = Object.entries(templateUsageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([templateId, count]) => {
        const meta = state.templates.find(t => t.templateId === templateId);
        return { templateId, name: meta?.nameVi || meta?.name || templateId, count };
      });

    const recentUsers = [...state.users]
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
      .slice(0, 8);

    return { premiumUsers, activeUsers, totalViews, totalDownloads, topTemplates, recentUsers };
  }, [state]);

  return (
    <AdminShell title="Admin Dashboard" subtitle="Hệ thống vận hành CVFlow">
      {loading ? (
        <div className="skeleton" style={{ height: '240px', borderRadius: '16px' }} />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <StatCard title="Total Users" value={state.users.length} hint={`${metrics.activeUsers} active`} icon={<Users size={18} color="white" />} gradient="linear-gradient(135deg, #6366f1, #8b5cf6)" />
            <StatCard title="Total CVs" value={state.cvs.length} hint="Documents created" icon={<FileText size={18} color="white" />} gradient="linear-gradient(135deg, #06b6d4, #3b82f6)" />
            <StatCard title="Premium Users" value={metrics.premiumUsers} hint={`${Math.round((metrics.premiumUsers / Math.max(state.users.length, 1)) * 100)}% conversion`} icon={<Star size={18} color="white" />} gradient="linear-gradient(135deg, #f59e0b, #ef4444)" />
            <StatCard title="Total Views" value={metrics.totalViews} hint={`${metrics.totalDownloads} downloads`} icon={<Eye size={18} color="white" />} gradient="linear-gradient(135deg, #10b981, #14b8a6)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(99,102,241,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '0.96rem' }}>Users mới nhất</h3>
                <Link href="/admin/users" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '0.8rem' }}>
                  Quản lý users
                </Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Tên', 'Email', 'Plan', 'Trạng thái', 'Ngày tạo'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.73rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentUsers.map(u => (
                      <tr key={u.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 12px', color: 'white', fontSize: '0.86rem' }}>{u.displayName || 'N/A'}</td>
                        <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>{u.email}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px', background: u.plan === 'premium' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)', color: u.plan === 'premium' ? '#f59e0b' : 'rgba(255,255,255,0.65)', fontWeight: 700 }}>
                            {u.plan}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: u.isActive !== false ? '#34d399' : '#f87171', fontSize: '0.8rem', fontWeight: 600 }}>
                          {u.isActive !== false ? 'Active' : 'Locked'}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{toMillis(u.createdAt) ? new Date(toMillis(u.createdAt)).toLocaleDateString('vi-VN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '0.96rem' }}>Top templates</h3>
              </div>
              <div style={{ padding: '12px' }}>
                {metrics.topTemplates.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.83rem' }}>Chưa có dữ liệu sử dụng template.</p>
                ) : (
                  metrics.topTemplates.map((item, index) => (
                    <div key={item.templateId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', borderBottom: index < metrics.topTemplates.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 700 }}>
                          {index + 1}
                        </div>
                        <p style={{ color: 'white', fontSize: '0.84rem' }}>{item.name}</p>
                      </div>
                      <p style={{ color: '#93c5fd', fontWeight: 700, fontSize: '0.84rem' }}>{item.count}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {[
              { href: '/admin/users', title: 'Users', desc: 'Khoá/mở khoá, cấp quyền, đổi plan', icon: Users },
              { href: '/admin/templates', title: 'Templates', desc: 'Bật/tắt template, seed template', icon: Grid3X3 },
              { href: '/admin/plans', title: 'Plans', desc: 'Quản trị gói dịch vụ user', icon: Star },
              { href: '/admin/stats', title: 'Detailed Stats', desc: 'Báo cáo tăng trưởng hệ thống', icon: BarChartIcon },
              { href: '/admin/marketplace', title: 'Duyệt Templates', desc: 'Marketplace template pending review', icon: Grid3X3 },
              { href: '/admin/sellers', title: 'Duyệt Sellers', desc: 'Seller applications pending review', icon: Users },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ display: 'block', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)', textDecoration: 'none' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                  <item.icon size={16} color="#a5b4fc" />
                </div>
                <p style={{ color: 'white', fontWeight: 700, marginBottom: '4px', fontSize: '0.9rem' }}>{item.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{item.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </AdminShell>
  );
}

function StatCard({ title, value, hint, icon, gradient }: { title: string; value: number; hint: string; icon: React.ReactNode; gradient: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={{ color: 'rgba(255,255,255,0.48)', fontSize: '0.75rem' }}>{hint}</span>
      </div>
      <p style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.1 }}>{value.toLocaleString()}</p>
      <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '4px', fontSize: '0.82rem' }}>{title}</p>
    </div>
  );
}

function BarChartIcon({ size = 18, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20V11M10 20V4M16 20V8M22 20V13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

