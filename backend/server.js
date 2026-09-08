import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/auth.routes.js";
import roleRoutes from "./src/routes/role.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import supplierRoutes from "./src/routes/supplier.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import warehouseRoutes from "./src/routes/warehouse.routes.js";
import inventoryRoutes from "./src/routes/inventory.routes.js";
import customerRoutes from "./src/routes/customer.routes.js";
import saleRoutes from "./src/routes/sale.routes.js";
import returnRoutes from "./src/routes/return.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import transferRoutes from "./src/routes/transfer.routes.js";
import purchaseRoutes from "./src/routes/purchase.routes.js";
import reportRoutes from "./src/routes/report.routes.js";
import expenseRoutes from "./src/routes/expense.routes.js";
import db from "./src/config/db.js";

const app = express();
app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({ origin: "https://super-store-erp.netlify.app", credentials: true }),
);
app.use(helmet());

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/warehouses", warehouseRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/sales", saleRoutes);
app.use("/api/v1/returns", returnRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/transfers", transferRoutes);
app.use("/api/v1/purchases", purchaseRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/expenses", expenseRoutes);

// Basic route for testing
app.get("/api/v1/health", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "ERP System Backend is running." });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async (err) => {
  if (err) {
    console.error("Failed to start server:", err);
    return;
  }
  await db.connect();
  console.log("Server listening on port No " + PORT);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("SIGINT signal received. Shutting down gracefully...");
  server.close(() => {
    console.log("HTTP server closed.");
  });
  await db.disconnect();
  process.exit(0);
});
