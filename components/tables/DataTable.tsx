'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface DataTableProps<T> {
  columns: { header: string; accessor: keyof T | ((row: T) => React.ReactNode); className?: string }[];
  data: T[];
  loading?: boolean;
  onSearch?: (term: string) => void;
  pagination?: {
    page: number;
    pages: number;
    onPageChange: (page: number) => void;
  };
  actions?: React.ReactNode;
}

export default function DataTable<T>({ columns, data, loading, onSearch, pagination, actions }: DataTableProps<T>) {
  return (
    <div className="card w-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between">
        <div className="flex-1 w-full sm:w-auto flex items-center gap-4">
          {onSearch && (
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                className="input pl-10 h-10"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {actions}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={col.className}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                 <tr key={i}>
                   {columns.map((_, j) => (
                     <td key={j}><div className="h-5 w-full skeleton" /></td>
                   ))}
                 </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-slate-500">
                  No data found
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  {columns.map((col, j) => (
                    <td key={j} className={col.className}>
                      {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-400">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-1">
            <button
              className="pagination-btn"
              disabled={pagination.page === 1 || loading}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="pagination-btn"
              disabled={pagination.page === pagination.pages || loading}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
