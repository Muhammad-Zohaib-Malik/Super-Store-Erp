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
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
