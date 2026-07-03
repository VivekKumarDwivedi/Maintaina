import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import {
  getNotices,
  createNotice,
  deleteNotice,
} from "../controllers/noticeController";

const router = express.Router();

router.get("/", authenticate, getNotices);
router.post("/", authenticate, requireAdmin, createNotice);
router.delete("/:id", authenticate, requireAdmin, deleteNotice);

export default router;
