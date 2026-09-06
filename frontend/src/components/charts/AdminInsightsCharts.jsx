import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../ChartCard';

const PIE_COLORS = ['#0f766e', '#0f5c8e', '#14b8a6', '#22c55e', '#f59e0b', '#e11d48', '#4f46e5'];

export default function AdminInsightsCharts({
  placementsByCompany,
  companyBarData,
  selectedCompanyFilter,
  setSelectedCompanyFilter,
}) {
  const hasPieData = Array.isArray(placementsByCompany) && placementsByCompany.length > 0;
  const hasBarData = Array.isArray(companyBarData) && companyBarData.length > 0;

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <ChartCard
        title='Company-wise Placements'
        subtitle='Click pie slices to filter dashboard'
        action={
          selectedCompanyFilter !== 'all' ? (
            <button
              className='rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700'
              onClick={() => setSelectedCompanyFilter('all')}
            >
              Active: {selectedCompanyFilter}
            </button>
          ) : null
        }
      >
        {hasPieData ? (
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={placementsByCompany}
                dataKey='value'
                nameKey='name'
                innerRadius={50}
                outerRadius={95}
                paddingAngle={4}
                onClick={(entry) => setSelectedCompanyFilter(entry.name)}
              >
                {placementsByCompany.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                    opacity={selectedCompanyFilter === 'all' || selectedCompanyFilter === entry.name ? 1 : 0.35}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className='flex h-full items-center justify-center text-sm text-slate-500'>No company placement data available.</div>
        )}
      </ChartCard>

      <ChartCard title='Company vs Selected Students' subtitle='Selection outcomes across drives'>
        {hasBarData ? (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={companyBarData}>
              <XAxis dataKey='name' tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey='selected' radius={[8, 8, 0, 0]} fill='#0f766e' />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className='flex h-full items-center justify-center text-sm text-slate-500'>No selected-student chart data available.</div>
        )}
      </ChartCard>
    </div>
  );
}
