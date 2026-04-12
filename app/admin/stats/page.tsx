'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';

import AdminShell from '@/components/admin/AdminShell';
import { db } from '@/lib/firebase';
import type { CV, Template, User } from '@/lib/types';

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    Promise.all([getDocs(collection(db, 'users')), getDocs(collection(db, 'cvs')), getDocs(collection(db, 'templates'))]).then(([u, c, t]) => {
      setUsers(u.docs.map(d => d.data() as User));
      setCvs(c.docs.map(d => ({ ...d.data(), cvId: d.id } as CV)));
      setTemplates(t.docs.map(d => d.data() as Template));
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const totalViews = cvs.reduce((sum, cv) => sum + (cv.viewCount || 0), 0);
    const totalDownloads = cvs.reduce((sum, cv) => sum + (cv.downloadCount || 0), 0);
    const publicCvs = cvs.filter(cv => cv.isPublic).length;
    const premiumUsers = users.filter(u => u.plan === 'premium').length;

    const categoryMap = templates.reduce<Record<string, number>>((acc, t) => {
      const key = t.category || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const templateCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

    const templateUsageMap = cvs.reduce<Record<string, number>>((acc, cv) => {
      const key = cv.templateId || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const templateUsage = Object.entries(templateUsageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([templateId, count]) => ({
        templateId,
        name: templates.find(t => t.templateId === templateId)?.nameVi || templateId,
        count,
      }));

    return {
      totalUsers: users.length,
      premiumUsers,
      totalCvs: cvs.length,
      publicCvs,
      totalViews,
      totalDownloads,
      templateCategories,
      templateUsage,
      premiumRate: Math.round((premiumUsers / Math.max(users.length, 1)) * 100),
      publicRate: Math.round((publicCvs / Math.max(cvs.length, 1)) * 100),
      downloadPerView: totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) : '0',
    };
  }, [users, cvs, templates]);

  return (
    <AdminShell title="Detailed Stats" subtitle="KPI hệ thống và phân tích sử dụng">
      {loading ? (
        <div className="skeleton" style={{ height: '220px', borderRadius: '14px' }} />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            <Metric label="Users" value={stats.totalUsers} />
            <Metric label="Premium rate" value={`${stats.premiumRate}%`} />
            <Metric label="CVs" value={stats.totalCvs} />
            <Metric label="Public CV rate" value={`${stats.publicRate}%`} />
            <Metric label="Views" value={stats.totalViews} />
            <Metric label="Downloads" value={stats.totalDownloads} />
            <Metric label="DL/View" value={`${stats.downloadPerView}%`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <ChartCard title="Template Usage (Top 10)">
              {stats.templateUsage.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.84rem' }}>No usage data.</p>
              ) : (
                stats.templateUsage.map(row => (
                  <BarRow key={row.templateId} label={row.name} value={row.count} max={stats.templateUsage[0].count} />
                ))
              )}
            </ChartCard>

            <ChartCard title="Template Categories">
              {stats.templateCategories.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.84rem' }}>No category data.</p>
              ) : (
                stats.templateCategories.map(([category, count]) => (
                  <BarRow key={category} label={category} value={count} max={stats.templateCategories[0][1]} />
                ))
              )}
            </ChartCard>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '12px' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.73rem', marginBottom: '6px' }}>{label}</p>
      <p style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
        <h3 style={{ color: 'white', fontWeight: 700, fontSize: '0.92rem' }}>{title}</h3>
      </div>
      <div style={{ padding: '12px' }}>{children}</div>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
        <p style={{ color: '#93c5fd', fontSize: '0.8rem', fontWeight: 700 }}>{value}</p>
      </div>
      <div style={{ height: '8px', borderRadius: '9999px', background: 'rgba(148,163,184,0.25)', overflow: 'hidden' }}>
        <div style={{ width: `${width}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#06b6d4)' }} />
      </div>
    </div>
  );
}

