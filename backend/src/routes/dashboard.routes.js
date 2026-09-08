import express from "express";
import { getDashboardKPIs } from "../controllers/dashboard.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.get("/kpis", getDashboardKPIs);

export default router;
