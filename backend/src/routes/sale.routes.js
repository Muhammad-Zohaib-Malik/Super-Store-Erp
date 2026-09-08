import express from "express";
import {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
} from "../controllers/sale.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect); // All sale routes require authentication

router
  .route("/")
  .post(authorize("sale:create"), createSale)
  .get(authorize("sale:read"), getSales);

router
  .route("/:id")
  .get(authorize("sale:read"), getSaleById)
  .put(authorize("sale:update"), updateSale)
  .delete(authorize("sale:delete"), deleteSale);

export default router;
