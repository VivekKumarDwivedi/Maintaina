import { NextFunction, Response } from 'express';
import { Op } from 'sequelize';
import { Complaint, ComplaintHistory } from '../models';
import { AuthRequest } from '../types';

const getOverdueThresholdDays = (): number => {
  const days = parseInt(process.env.OVERDUE_THRESHOLD_DAYS || '7', 10);
  return Number.isNaN(days) ? 7 : days;
};

const markOverdueComplaints = async (actorId: number): Promise<void> => {
  const thresholdDays = getOverdueThresholdDays();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

  const complaints = await Complaint.findAll({
    where: {
      status: { [Op.in]: ['Open', 'In Progress'] },
      isOverdue: false,
      createdAt: { [Op.lte]: cutoffDate },
    },
  });

  for (const complaint of complaints) {
    complaint.isOverdue = true;
    await complaint.save();
    await ComplaintHistory.create({
      complaintId: complaint.id,
      actorId,
      action: 'flagged_overdue',
      note: `Automatically flagged overdue after ${thresholdDays} days`,
    });
  }
};

const checkOverdue = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await markOverdueComplaints(req.user.id);
    }
  } catch (err: any) {
    console.error('Overdue middleware error:', err.message || err);
  }

  next();
};

export default checkOverdue;
