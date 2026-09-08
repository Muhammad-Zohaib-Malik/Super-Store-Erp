import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import EmptyState from "./EmptyState";
import { SkeletonTable } from "./SkeletonLoader";

export default function DataTable({
  columns,
  data,
  loading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  pageSize = 10,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRowClick,
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor
          ? typeof col.accessor === "function"
            ? col.accessor(row)
            : row[col.accessor]
          : "";
        return String(val).toLowerCase().includes(q);
      }),
    );
  }, [data, search, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.accessor) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal =
        typeof col.accessor === "function" ? col.accessor(a) : a[col.accessor];
      const bVal =
        typeof col.accessor === "function" ? col.accessor(b) : b[col.accessor];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
      });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir, columns]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const pagedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (loading) return <SkeletonTable rows={5} cols={columns.length} />;

  return (
    <div className="bg-surface border border-divider rounded-lg overflow-hidden">
      {searchable && (
        <div className="px-4 py-3 border-b border-divider">
          <div className="relative max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-divider rounded-lg bg-base focus:bg-surface focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {pagedData.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-divider bg-base/50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-left text-xs font-medium text-content-muted uppercase tracking-wider whitespace-nowrap ${col.sortable !== false ? "cursor-pointer select-none hover:text-content" : ""} ${col.align === "right" ? "text-right" : ""}`}
                      onClick={() =>
                        col.sortable !== false && handleSort(col.key)
                      }
                    >
                      <div
                        className={`flex items-center gap-1 ${col.align === "right" ? "justify-end" : ""}`}
                      >
                        {col.header}
                        {sortKey === col.key &&
                          (sortDir === "asc" ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedData.map((row, i) => (
                  <tr
                    key={row._id || row.id || i}
                    className={`hover:bg-surface-hover/50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 whitespace-nowrap ${col.align === "right" ? "text-right" : ""}`}
                      >
                        {col.render
                          ? col.render(row)
                          : typeof col.accessor === "function"
                            ? col.accessor(row)
                            : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-divider bg-base/50">
              <span className="text-xs text-content-muted">
                Showing {page * pageSize + 1}–
                {Math.min((page + 1) * pageSize, sortedData.length)} of{" "}
                {sortedData.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-md text-content-muted hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (page < 3) {
                    pageNum = i;
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 text-xs rounded-md font-medium ${page === pageNum ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-200"}`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-md text-content-muted hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
