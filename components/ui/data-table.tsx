'use client';

import * as React from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Inbox } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T | string;
  filterComponent?: React.ReactNode;
  actions?: React.ReactNode;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchKey,
  filterComponent,
  actions,
  isLoading = false,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters to find what you are looking for.',
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  // Filtering
  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data;
    const lower = search.toLowerCase();

    return data.filter(row => {
      if (searchKey) {
        const val = row[searchKey as keyof T];
        return String(val ?? '').toLowerCase().includes(lower);
      }
      return Object.values(row).some(v =>
        typeof v === 'string' || typeof v === 'number'
          ? String(v).toLowerCase().includes(lower)
          : false
      );
    });
  }, [data, search, searchKey]);

  // Sorting
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>
          {filterComponent}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-950/50">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={cn(
                      'px-4 py-3 font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 whitespace-nowrap',
                      col.className
                    )}
                  >
                    {col.sortable && col.accessorKey ? (
                      <button
                        onClick={() => handleSort(String(col.accessorKey))}
                        className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                      >
                        <span>{col.header}</span>
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={cIdx} className="px-4 py-3.5">
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
                        <Inbox className="h-6 w-6 text-zinc-400" />
                      </div>
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">{emptyTitle}</p>
                      <p className="text-zinc-500 text-xs max-w-sm">{emptyDescription}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className={cn('px-4 py-3 text-zinc-800 dark:text-zinc-200', col.className)}>
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? String(row[col.accessorKey as keyof T] ?? '-')
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && sortedData.length > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <div>
              Showing <span className="font-medium text-zinc-800 dark:text-zinc-200">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {Math.min(currentPage * pageSize, sortedData.length)}
              </span>{' '}
              of <span className="font-medium text-zinc-800 dark:text-zinc-200">{sortedData.length}</span> results
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="h-7 w-7"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
