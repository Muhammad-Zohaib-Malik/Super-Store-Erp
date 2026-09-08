import mongoose from "mongoose";
import Sale from "../models/sale.model.js";

export const getSalesAndProfitReport = async (startDate, endDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // The user requested Sale.status = "completed"
  // Let's check if the Sale model has a 'status' field.
  // Actually, wait, let me use the exact schema fields.
  // For now I'll assume they meant 'isReturned: false' or 'paymentStatus' since 'status' doesn't exist on Sale schema.
  // I will just use `isReturned: false`
  const baseMatch = {
    createdAt: { $gte: start, $lte: end },
    isReturned: false,
  };

  // 1. Summary Metrics & Payment Summary
  const summaryPipeline = [
    { $match: baseMatch },
    {
      $facet: {
        totals: [
          { $unwind: "$items" },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$items.subtotal" },
              totalCost: {
                $sum: { $multiply: ["$items.quantity", "$items.unitCost"] },
              },
              totalItemsSold: { $sum: "$items.quantity" },
            },
          },
        ],
        orders: [
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
            },
          },
        ],
        payments: [
          {
            $group: {
              _id: "$paymentMethod",
              amount: { $sum: "$paidAmount" },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ];

  // 2. Top Products Pipeline
  const topProductsPipeline = [
    { $match: baseMatch },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        quantitySold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.subtotal" },
        cost: {
          $sum: { $multiply: ["$items.quantity", "$items.unitCost"] },
        },
      },
    },
    { $sort: { quantitySold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: 1,
        name: "$product.name",
        sku: "$product.sku",
        quantitySold: 1,
        revenue: 1,
        cost: 1,
        profit: { $subtract: ["$revenue", "$cost"] },
      },
    },
  ];

  // 3. Daily Sales Pipeline
  const dailySalesPipeline = [
    { $match: baseMatch },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          saleId: "$_id", 
        },
        revenue: { $sum: "$items.subtotal" },
        cost: { $sum: { $multiply: ["$items.quantity", "$items.unitCost"] } },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        revenue: { $sum: "$revenue" },
        cost: { $sum: "$cost" },
        orders: { $sum: 1 }, 
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        revenue: 1,
        profit: { $subtract: ["$revenue", "$cost"] },
        orders: 1,
      },
    },
    { $sort: { date: 1 } },
  ];

  const [summaryResult, topProducts, dailySales] = await Promise.all([
    Sale.aggregate(summaryPipeline),
    Sale.aggregate(topProductsPipeline),
    Sale.aggregate(dailySalesPipeline),
  ]);

  const totals = summaryResult[0]?.totals[0] || {
    totalRevenue: 0,
    totalCost: 0,
    totalItemsSold: 0,
  };
  const ordersCount = summaryResult[0]?.orders[0] || { totalOrders: 0 };
  const paymentsRaw = summaryResult[0]?.payments || [];

  const totalRevenue = totals.totalRevenue;
  const totalCost = totals.totalCost;
  const totalProfit = totalRevenue - totalCost;
  const profitMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Format payments
  const payments = {
    cash: { amount: 0, count: 0 },
    card: { amount: 0, count: 0 },
    bank_transfer: { amount: 0, count: 0 },
    credit: { amount: 0, count: 0 },
  };

  paymentsRaw.forEach((p) => {
    if (payments[p._id]) {
      payments[p._id] = { amount: p.amount, count: p.count };
    }
  });

  return {
    period: {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    },
    summary: {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin: Number(profitMargin.toFixed(2)),
      totalOrders: ordersCount.totalOrders,
      totalItemsSold: totals.totalItemsSold,
    },
    payments,
    topProducts,
    dailySales,
  };
};
