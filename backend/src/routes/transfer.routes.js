import express from "express";
import {
  createTransfer,
  getTransfers,
} from "../controllers/transfer.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Allow any authorized inventory worker to transfer stock
router
  .route("/")
  .get(authorize("transfer:read"), getTransfers)
  .post(authorize("transfer:create"), createTransfer);

export default router;
