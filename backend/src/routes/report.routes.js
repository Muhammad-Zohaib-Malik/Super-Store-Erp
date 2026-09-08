import express from "express";
import { getSalesReport } from "../controllers/report.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/sales", protect, authorize("report:read"), getSalesReport);

export default router;
