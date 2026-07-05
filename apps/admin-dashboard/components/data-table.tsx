'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { EmptyState } from './empty-state';
import { TableSkeleton } from './skeleton';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  filterType?: 'text' | 'select' | 'none';
  filterOptions?: { label: string; value: string }[];
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  searchPlaceholder?: string;
  pageSize?: number;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  loading = false,
  onRowClick,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  searchPlaceholder = 'Search...',
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let result = [...data];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        columns.some((col) => {
          const val = item[col.key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }

    Object.entries(filters).forEach(([key, val]) => {
      if (val) {
        result = result.filter((item) => String(item[key]) === val);
      }
    });

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null || bVal == null) return 0;
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, filters, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
          />
        </div>

        {columns
          .filter((c) => c.filterType === 'select' && c.filterOptions)
          .map((col) => (
            <div key={col.key} className="relative">
              <select
                value={filters[col.key] || ''}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, [col.key]: e.target.value }));
                  setPage(0);
                }}
                className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/30 outline-none cursor-pointer"
              >
                <option value="">All {col.label}</option>
                {col.filterOptions?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          ))}

        {activeFilters > 0 && (
          <button
            onClick={() => { setFilters({}); setSearch(''); setPage(0); }}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-500 transition px-3 py-2"
          >
            <X className="h-3.5 w-3.5" />
            Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
          </button>
        )}

        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} of {data.length} records
        </span>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <TableSkeleton rows={5} cols={columns.length} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider ${
                        col.sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''
                      }`}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <span className="flex items-center gap-1.5">
                        {col.label}
                        {col.sortable && (
                          sortKey === col.key ? (
                            sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                          )
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    onClick={() => onRowClick?.(item)}
                    className={`${onRowClick ? 'cursor-pointer' : ''} hover:bg-slate-50/70 transition-colors`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {col.render ? col.render(item) : String(item[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/30">
              <span className="text-xs text-slate-400">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 disabled:opacity-30 hover:bg-slate-100 transition disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 disabled:opacity-30 hover:bg-slate-100 transition disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
