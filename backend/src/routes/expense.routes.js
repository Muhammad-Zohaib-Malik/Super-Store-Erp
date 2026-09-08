import express from "express";
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} from "../controllers/expense.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect); // All routes require authentication

router
  .route("/")
  .get(authorize("expense:read"), getExpenses)
  .post(authorize("expense:create"), createExpense);

router
  .route("/:id")
  .put(authorize("expense:update"), updateExpense)
  .delete(authorize("expense:delete"), deleteExpense);

export default router;
