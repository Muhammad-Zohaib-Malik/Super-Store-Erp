import React from "react";

export default function PageHeader({ title, description, children }) {
  return (
    <div className="mb-8 border-b border-divider/50 pb-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-content tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm sm:text-base text-content-muted">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
