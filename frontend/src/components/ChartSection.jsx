import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#a78bfa', '#38bdf8', '#34d399', '#f472b6', '#fbbf24', '#f87171', '#818cf8'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong border-[var(--color-border)] rounded-xl p-4 shadow-xl text-sm min-w-[150px]">
      <p className="font-semibold text-white mb-2 pb-2 border-b border-[var(--color-border-light)]">{payload[0]?.payload?.fullName || label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
              <span className="w-2 h-2 rounded-full" style={{ background: entry.color }}></span>
              {entry.name}
            </span>
            <span className="font-semibold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChartSection({ data }) {
  // Bar chart: Company vs Selected
  const barData = useMemo(() => {
    return data
      .filter(d => d.company)
      .sort((a, b) => b.selected - a.selected)
      .slice(0, 10)
      .map(d => ({
        name: d.company.length > 12 ? d.company.slice(0, 12) + '…' : d.company,
        fullName: d.company,
        selected: d.selected,
        appeared: d.appeared,
      }));
  }, [data]);

  // Line chart: Monthly trend
  const lineData = useMemo(() => {
    const monthMap = {};
    data.forEach(d => {
      if (!d.date) return;
      const parsed = new Date(d.date);
      if (isNaN(parsed)) return;
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
      const label = parsed.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { month: label, selected: 0, appeared: 0, key };
      monthMap[key].selected += d.selected;
      monthMap[key].appeared += d.appeared;
    });
    return Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key));
  }, [data]);

  // Pie chart: Package distribution
  const pieData = useMemo(() => {
    const ranges = [
      { label: '< 5 LPA', min: 0, max: 5 },
      { label: '5–10 LPA', min: 5, max: 10 },
      { label: '10–15 LPA', min: 10, max: 15 },
      { label: '15–25 LPA', min: 15, max: 25 },
      { label: '25+ LPA', min: 25, max: Infinity },
    ];
    return ranges
      .map(r => ({
        name: r.label,
        value: data.filter(d => d.package >= r.min && d.package < r.max).length,
      }))
      .filter(r => r.value > 0);
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart: Appeared vs Selected */}
      <div className="gradient-border rounded-xl p-6">
        <h3 className="text-[15px] tracking-tight font-semibold text-[var(--color-text)] mb-6 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>
          Top Companies Activity
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} width={35} dx={-10} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="appeared" fill="rgba(99, 102, 241, 0.2)" radius={[4, 4, 0, 0]} name="Appeared" />
            <Bar dataKey="selected" fill="url(#colorSelected)" radius={[4, 4, 0, 0]} name="Selected" />
            <defs>
              <linearGradient id="colorSelected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={1}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.8}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart: Monthly Trend */}
      <div className="gradient-border rounded-xl p-6">
        <h3 className="text-[15px] tracking-tight font-semibold text-[var(--color-text)] mb-6 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-3)" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Placement Trends
        </h3>
        {lineData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} width={35} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="selected" stroke="url(#lineGradient)" strokeWidth={3} dot={{ r: 4, fill: '#16161f', stroke: '#a78bfa', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#a78bfa', stroke: 'white', strokeWidth: 2 }} name="Selected" />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-[13px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg)] rounded-lg border border-[var(--color-border-light)] border-dashed">
            Add dates in your sheet to visualize trends
          </div>
        )}
      </div>

      {/* Pie Chart: Package Distribution */}
      {pieData.length > 0 && (
        <div className="gradient-border rounded-xl p-6 lg:col-span-2 relative overflow-hidden">
          <h3 className="text-[15px] tracking-tight font-semibold text-[var(--color-text)] mb-2 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="2.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
            Salary Package Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingLeft: '40px' }}
                formatter={(value) => <span className="text-[13px] font-medium text-[var(--color-text-secondary)] ml-1">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
