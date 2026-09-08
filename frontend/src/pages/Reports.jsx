import { useState, useEffect } from "react";
import { reportApi } from "../api/report.api";
import { useToast } from "../components/ui/Toast";
import PageHeader from "../components/ui/PageHeader";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Activity,
  Calendar,
} from "lucide-react";

const Reports = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(
    firstDay.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const fetchReport = async () => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      const res = await reportApi.getSalesReport(startDate, endDate);
      setReportData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleGenerate = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#6366f1"];

  const formatCurrency = (value) => {
    return `PKR ${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (!reportData && loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const paymentData = reportData
    ? [
        { name: "Cash", value: reportData.payments.cash?.amount || 0 },
        { name: "Card", value: reportData.payments.card?.amount || 0 },
        {
          name: "Bank Transfer",
          value: reportData.payments.bank_transfer?.amount || 0,
        },
        { name: "Credit", value: reportData.payments.credit?.amount || 0 },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Sales & Profit Reports"
        description="Analyze your revenue, costs, and profit margins over time."
      />

      {/* Date Filter Form */}
      <form
        onSubmit={handleGenerate}
        className="bg-surface p-4 border border-divider rounded-xl flex flex-col sm:flex-row gap-4 items-end shadow-sm"
      >
        <div className="flex-1 w-full space-y-1.5">
          <label className="text-sm font-medium text-content flex items-center gap-2">
            <Calendar size={16} className="text-content-subtle" />
            Start Date
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-base border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="flex-1 w-full space-y-1.5">
          <label className="text-sm font-medium text-content flex items-center gap-2">
            <Calendar size={16} className="text-content-subtle" />
            End Date
          </label>
          <input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-base border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Activity size={18} />
          )}
          Generate Report
        </button>
      </form>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 bg-surface border border-divider rounded-xl shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-content-muted">
                  Total Revenue
                </p>
                <h3 className="text-2xl font-bold text-content mt-1">
                  {formatCurrency(reportData.summary.totalRevenue)}
                </h3>
              </div>
            </div>
            <div className="p-5 bg-surface border border-divider rounded-xl shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp size={24} className="rotate-180" />
              </div>
              <div>
                <p className="text-sm font-medium text-content-muted">
                  Total Cost
                </p>
                <h3 className="text-2xl font-bold text-content mt-1">
                  {formatCurrency(reportData.summary.totalCost)}
                </h3>
              </div>
            </div>
            <div className="p-5 bg-surface border border-divider rounded-xl shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-content-muted">
                  Net Profit
                </p>
                <div className="flex items-end gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-content">
                    {formatCurrency(reportData.summary.totalProfit)}
                  </h3>
                  <span className="text-sm font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md mb-1">
                    {reportData.summary.profitMargin}% Margin
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 bg-surface border border-divider rounded-xl shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingCart size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-content-muted">
                  Total Orders
                </p>
                <h3 className="text-2xl font-bold text-content mt-1">
                  {reportData.summary.totalOrders}
                </h3>
              </div>
            </div>
            <div className="p-5 bg-surface border border-divider rounded-xl shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-content-muted">
                  Items Sold
                </p>
                <h3 className="text-2xl font-bold text-content mt-1">
                  {reportData.summary.totalItemsSold}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Sales Line Chart */}
            <div className="lg:col-span-2 p-5 bg-surface border border-divider rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-content mb-4">
                Daily Revenue & Profit
              </h3>
              <div className="h-80 w-full text-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.dailySales}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `PKR ${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: "8px", border: "none" }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: "20px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Summary Pie Chart */}
            <div className="p-5 bg-surface border border-divider rounded-xl shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-content mb-4">
                Payment Distribution
              </h3>
              <div className="h-64 w-full flex-1 relative">
                {paymentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-content-muted">
                    <p>No payment data</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-surface border border-divider rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-divider">
              <h3 className="text-lg font-bold text-content">Top Products</h3>
              <p className="text-sm text-content-muted">
                Best performing products by quantity sold
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-base border-b border-divider text-xs uppercase tracking-wider text-content-muted">
                    <th className="p-4 font-medium">Product</th>
                    <th className="p-4 font-medium text-right">Qty Sold</th>
                    <th className="p-4 font-medium text-right">Revenue</th>
                    <th className="p-4 font-medium text-right">Cost</th>
                    <th className="p-4 font-medium text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider text-sm">
                  {reportData.topProducts.map((p, index) => (
                    <tr
                      key={p._id}
                      className="hover:bg-surface-hover transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-content-muted text-xs">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-content">
                              {p.name}
                            </p>
                            <p className="text-xs text-content-subtle">
                              SKU: {p.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {p.quantitySold}
                      </td>
                      <td className="p-4 text-right">
                        {formatCurrency(p.revenue)}
                      </td>
                      <td className="p-4 text-right text-content-muted">
                        {formatCurrency(p.cost)}
                      </td>
                      <td className="p-4 text-right font-semibold text-emerald-600">
                        {formatCurrency(p.profit)}
                      </td>
                    </tr>
                  ))}
                  {reportData.topProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-content-muted"
                      >
                        No products sold in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
