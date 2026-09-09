import React from "react";
import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data found",
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon size={24} className="text-content-subtle" />
      </div>
      <h3 className="text-sm font-semibold text-content mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-content-muted max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        React.isValidElement(action) ? (
          action
        ) : typeof action === "object" && action.label ? (
          <button
            onClick={action.onClick}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 shadow-elevated transition-colors"
          >
            {action.label}
          </button>
        ) : null
      )}
    </div>
  );
}
