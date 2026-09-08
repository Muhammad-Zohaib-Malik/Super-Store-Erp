import Sale from "../models/sale.model.js";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import Inventory from "../models/inventory.model.js";
import Return from "../models/return.model.js";

export const getDashboardKPIs = async (req, res) => {
  try {
    // 1. Total Sales & Orders & Returns
    const sales = await Sale.find();
    const returns = await Return.find();

    const totalOrders = sales.filter((s) => !s.isReturned).length;
    const grossSalesAmount = sales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0,
    );
    const totalRefundAmount = returns.reduce(
      (sum, ret) => sum + (ret.totalRefundAmount || 0),
      0,
    );

    const totalSalesAmount = grossSalesAmount - totalRefundAmount; // Net Sales
    const totalReturnsCount = returns.length;

    // 2. Today's Sales
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaysSales = sales.filter(
      (s) => new Date(s.createdAt) >= startOfToday,
    );
    const todaysReturns = returns.filter(
      (r) => new Date(r.createdAt) >= startOfToday,
    );

    const todayGrossSalesAmount = todaysSales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0,
    );
    const todayRefundAmount = todaysReturns.reduce(
      (sum, ret) => sum + (ret.totalRefundAmount || 0),
      0,
    );
    const todaySalesAmount = todayGrossSalesAmount - todayRefundAmount;

    // 3. Customers
    const totalCustomers = await Customer.countDocuments();

    // 4. Products
    const totalProducts = await Product.countDocuments();

    // 5. Low Stock Items
    // Count inventory where quantity <= minStockLevel
    const lowStockItems = await Inventory.aggregate([
      {
        $match: {
          $expr: {
            $lte: ["$quantity", "$minStockLevel"],
          },
        },
      },
    ]);
    const lowStockCount = lowStockItems.length;

    // 6. Recent Activity (Latest 5 Sales)
    const recentSales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customerId", "name")
      .populate("items.productId", "name");

    const activityFeed = recentSales.map((sale) => ({
      text: `Sale completed for ${sale.customerId?.name || "Unknown"}`,
      time: sale.createdAt,
      color: "bg-emerald-500",
    }));

    // 7. Sales Overview (Dynamic Period)
    const period = req.query.period || "30D";
    const salesOverview = [];
    const now = new Date();

    if (period === "12M") {
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const agg = await Sale.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]);

      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const found = agg.find((s) => s._id === key);
        salesOverview.push({
          date: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          revenue: found ? found.revenue : 0,
        });
      }
    } else {
      let days = period === "7D" ? 7 : period === "3M" ? 90 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
      startDate.setHours(0, 0, 0, 0);

      const agg = await Sale.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]);

      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split("T")[0];
        const found = agg.find((s) => s._id === key);

        let dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (period === "7D") {
          dateLabel = d.toLocaleDateString("en-US", { weekday: "short" });
        }
        salesOverview.push({
          date: dateLabel,
          revenue: found ? found.revenue : 0,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalSalesAmount, // Net revenue
        grossSalesAmount,
        totalRefundAmount,
        todaySalesAmount, // Net today
        totalOrders,
        totalReturnsCount,
        totalCustomers,
        totalProducts,
        lowStockCount,
        recentActivity: activityFeed,
        salesOverview,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
