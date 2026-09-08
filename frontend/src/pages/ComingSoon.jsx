import React from "react";
import { Construction } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function ComingSoon() {
  const location = useLocation();
  const pageName = location.pathname.replace("/", "").replace(/-/g, " ");

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <Construction size={28} className="text-content-subtle" />
      </div>
      <h2 className="text-lg font-semibold text-content capitalize mb-1">
        {pageName || "Page"}
      </h2>
      <p className="text-sm text-content-muted max-w-sm">
        This module is under development. It will be available in a future
        update.
      </p>
    </div>
  );
}
