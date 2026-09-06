import { cn } from '../lib/utils';

export default function DataTable({ columns, rows, emptyText = 'No rows found', className, onRowClick }) {
  return (
    <div className={cn('overflow-hidden rounded-[24px] border border-[var(--pf-border)] bg-[var(--pf-surface)] shadow-[var(--pf-shadow)]', className)}>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-slate-200/70 text-sm dark:divide-white/10'>
          <thead className='bg-white/55 dark:bg-white/[0.035]'>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--pf-muted)]'
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-200/70 dark:divide-white/10'>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors hover:bg-sky-50/80 dark:hover:bg-teal-300/[0.055]',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((column) => (
                    <td key={`${row.id}_${column.key}`} className='px-4 py-3 text-[var(--pf-text)]'>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className='px-4 py-8 text-center text-sm text-[var(--pf-muted)]' colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
