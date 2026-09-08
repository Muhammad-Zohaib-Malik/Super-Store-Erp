import React from "react";

export function SkeletonLine({
  width = "100%",
  height = "16px",
  className = "",
}) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-surface border border-divider rounded-lg p-5">
      <SkeletonLine width="40%" height="12px" className="mb-3" />
      <SkeletonLine width="60%" height="28px" className="mb-4" />
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={`${60 + Math.random() * 30}%`}
          height="12px"
          className="mb-2"
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-surface border border-divider rounded-lg overflow-hidden">
      <div className="border-b border-divider px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width={`${100 / cols}%`} height="12px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="border-b border-divider-light px-4 py-3 flex gap-4"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={`${100 / cols}%`} height="14px" />
          ))}
        </div>
      ))}
    </div>
  );
}
