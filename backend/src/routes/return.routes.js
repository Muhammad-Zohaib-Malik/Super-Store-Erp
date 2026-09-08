import express from "express";
import { createReturn, getReturns } from "../controllers/return.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(authorize("return:create"), createReturn)
  .get(authorize("return:read"), getReturns);

export default router;
