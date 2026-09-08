import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(authorize("user:read"), getUsers)
  .post(authorize("user:create"), createUser);

router
  .route("/:id")
  .put(authorize("user:update"), updateUser)
  .delete(authorize("user:delete"), deleteUser);

export default router;
