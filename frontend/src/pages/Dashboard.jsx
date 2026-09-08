import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { dashboardApi } from "../api/dashboard.api";
import { useToast } from "../components/ui/Toast";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function KPICard({
  label,
  value,
  change,
  trend,
  comparison,
  icon: Icon,
  iconBg,
  iconColor,
}) {
  return (
    <div className="bg-surface border border-divider rounded-lg p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-content-muted uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-content tabular-nums">
            {value}
          </p>
          {change && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center text-xs font-medium ${trend === "up" && label !== "Low Stock Items" ? "text-emerald-600" : "text-red-600"}`}
              >
                {trend === "up" ? (
                  <ArrowUpRight size={14} />
                ) : trend === "down" ? (
                  <ArrowDownRight size={14} />
                ) : null}
                {change}
              </span>
              <span className="text-xs text-content-subtle">{comparison}</span>
            </div>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}
        >
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30D");
  const [data, setData] = useState({
    totalSalesAmount: 0,
    grossSalesAmount: 0,
    totalRefundAmount: 0,
    todaySalesAmount: 0,
    totalOrders: 0,
    totalReturnsCount: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    recentActivity: [],
    salesOverview: [],
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        const res = await dashboardApi.getKPIs(period);
        setData(res.data.data);
      } catch (err) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, [toast, period]);

  const kpiData = [
    {
      label: "Net Sales",
      value: `PKR ${data.totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Total Refunded",
      value: `PKR ${data.totalRefundAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: RotateCcw,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "Today's Net Sales",
      value: `PKR ${data.todaySalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Orders",
      value: data.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Total Returns",
      value: data.totalReturnsCount.toLocaleString(),
      icon: RotateCcw,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "Total Customers",
      value: data.totalCustomers.toLocaleString(),
      icon: Users,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Total Products",
      value: data.totalProducts.toLocaleString(),
      icon: Package,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      label: "Low Stock Items",
      value: data.lowStockCount.toLocaleString(),
      icon: AlertTriangle,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-content">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface border border-divider rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-content">
              Sales Overview
            </h2>
            <div className="flex gap-1">
              {["7D", "30D", "3M", "12M"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    period === p
                      ? "bg-primary-600 text-white"
                      : "text-content-muted hover:bg-surface-hover"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72 mt-2 w-full">
            {data.salesOverview && data.salesOverview.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.salesOverview}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-divider/30" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "currentColor", fontSize: 12 }}
                    className="text-content-muted"
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "currentColor", fontSize: 12 }}
                    className="text-content-muted"
                    tickFormatter={(value) => `PKR ${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface)",
                      borderColor: "var(--color-divider)",
                      borderRadius: "0.75rem",
                      boxShadow: "var(--shadow-elevated)",
                      color: "var(--color-content)",
                    }}
                    itemStyle={{ color: "var(--color-content)" }}
                    formatter={(value) => [`PKR ${value}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#4f46e5" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-content-subtle border border-dashed border-divider rounded-xl">
                No sales data available for the selected period
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-divider rounded-lg p-5">
          <h2 className="text-sm font-semibold text-content mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {data.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.color || "bg-primary-500"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-content">{item.text}</p>
                    <p className="text-xs text-content-subtle">
                      {new Date(item.time).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-content-subtle text-center py-4">
                No recent activity found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
