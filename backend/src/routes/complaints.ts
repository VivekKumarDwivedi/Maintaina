import express from 'express';
import { authenticate, requireAdmin, requireResident } from '../middleware/auth';
import upload from '../middleware/upload';
import checkOverdue from '../middleware/overdue';
import {
  createComplaint, getMyComplaints, getAllComplaints,
  updateStatus, updatePriority, flagOverdue, getDashboard,
} from '../controllers/complaintController';

const router = express.Router();

// Resident routes
router.post('/', authenticate, requireResident, upload.single('photo'), checkOverdue, createComplaint);
router.get('/my', authenticate, requireResident, checkOverdue, getMyComplaints);

// Admin routes
router.get('/', authenticate, requireAdmin, checkOverdue, getAllComplaints);
router.get('/dashboard', authenticate, requireAdmin, checkOverdue, getDashboard);
router.post('/flag-overdue', authenticate, requireAdmin, checkOverdue, flagOverdue);
router.patch('/:id/status', authenticate, requireAdmin, checkOverdue, updateStatus);
router.patch('/:id/priority', authenticate, requireAdmin, checkOverdue, updatePriority);

export default router;
