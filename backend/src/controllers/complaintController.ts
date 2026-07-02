import { Op, QueryTypes } from 'sequelize';
import { Complaint, ComplaintHistory, User, sequelize} from '../models';
import { sendComplaintStatusUpdate } from '../services/emailService';
import { AuthRequest } from '../types';
import { Response } from 'express';

// Resident: create complaint
const createComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
    const complaint = await Complaint.create({
      title, description, category, photoPath,
      residentId: req.user!.id,
      status: 'Open', priority: 'Low',
    });
    await ComplaintHistory.create({
      complaintId: complaint.id,
      actorId: req.user!.id,
      toStatus: 'Open',
      action: 'created',
      note: 'Complaint submitted',
    });
    res.status(201).json(complaint);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Resident: get own complaints
const getMyComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const complaints = await Complaint.findAll({
      where: { residentId: req.user!.id },
      include: [{ model: ComplaintHistory, as: 'history', include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'role'] }] }],
      order: [['createdAt', 'DESC'], [{ model: ComplaintHistory, as: 'history' }, 'createdAt', 'ASC']],
    });
    res.json(complaints);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: get all complaints with filters
const getAllComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const { category, status, priority, isOverdue, from, to, page = 1, limit = 20 } = req.query;
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (isOverdue === 'true') where.isOverdue = true;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from as string);
      if (to) where.createdAt[Op.lte] = new Date(to as string);
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        { model: User, as: 'resident', attributes: ['id', 'name', 'email', 'flatNumber'] },
        { model: ComplaintHistory, as: 'history', include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'role'] }] },
      ],
      order: [['isOverdue', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit as string),
      offset,
    });
    res.json({ total: count, page: parseInt(page as string), pages: Math.ceil(count / parseInt(limit as string)), complaints: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: update status
const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const validStatuses = ['Open', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const complaint = await Complaint.findByPk(id as string, { include: [{ model: User, as: 'resident' }] });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (complaint.status === 'Closed') return res.status(400).json({ error: 'Closed complaints cannot be updated' });

    const fromStatus = complaint.status;
    complaint.status = status;
    if (status === 'Resolved' && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date();
      complaint.closedAt = new Date();
      complaint.status = 'Closed';
    }
    await complaint.save();

    await ComplaintHistory.create({
      complaintId: complaint.id,
      actorId: req.user!.id,
      fromStatus,
      toStatus: complaint.status,
      action: 'status_changed',
      note: note || null,
    });

    // Email resident
    await sendComplaintStatusUpdate(complaint.resident, complaint, complaint.status, note);

    res.json(complaint);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: update priority
const updatePriority = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { priority, note } = req.body;
    const validPriorities = ['Low', 'Medium', 'High'];
    if (!validPriorities.includes(priority)) return res.status(400).json({ error: 'Invalid priority' });

    const complaint = await Complaint.findByPk(id as string);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const fromPriority = complaint.priority;
    complaint.priority = priority;
    await complaint.save();

    await ComplaintHistory.create({
      complaintId: complaint.id,
      actorId: req.user!.id,
      fromPriority,
      toPriority: priority,
      action: 'priority_changed',
      note: note || null,
    });

    res.json(complaint);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: flag overdue
const flagOverdue = async (req: AuthRequest, res: Response) => {
  try {
    const thresholdDays = parseInt(process.env.OVERDUE_THRESHOLD_DAYS!) || 7;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - thresholdDays);

    const complaints = await Complaint.findAll({
      where: {
        status: { [Op.in]: ['Open', 'In Progress'] },
        isOverdue: false,
        createdAt: { [Op.lte]: cutoff },
      },
    });

    for (const c of complaints) {
      c.isOverdue = true;
      await c.save();
      await ComplaintHistory.create({
        complaintId: c.id,
        actorId: req.user!.id,
        action: 'flagged_overdue',
        note: `Automatically flagged overdue after ${thresholdDays} days`,
      });
    }

    res.json({ flagged: complaints.length, message: `${complaints.length} complaint(s) flagged as overdue` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: dashboard
const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
        const byStatus = await sequelize.query(
      `SELECT status, COUNT(*) as count FROM Complaints GROUP BY status`, { type: QueryTypes.SELECT }
    );
    const byCategory = await sequelize.query(
      `SELECT category, COUNT(*) as count FROM Complaints GROUP BY category`, { type: QueryTypes.SELECT }
    );
    const overdueCount = await Complaint.count({ where: { isOverdue: true } });
    const total = await Complaint.count();

    res.json({ total, byStatus, byCategory, overdueCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export { createComplaint, getMyComplaints, getAllComplaints, updateStatus, updatePriority, flagOverdue, getDashboard };
