import { Notice, User } from '../models';
import { sendImportantNotice } from '../services/emailService';
import { AuthRequest } from '../types';
import { Response } from 'express';

const getNotices = async (req: AuthRequest, res: Response) => {
  try {
    const notices = await Notice.findAll({
      include: [{ model: User, as: 'admin', attributes: ['id', 'name'] }],
      order: [['isImportant', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json(notices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const createNotice = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, isImportant } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

    const notice = await Notice.create({ title, content, isImportant: !!isImportant, adminId: req.user!.id });

    if (isImportant) {
      const residents = await User.findAll({ where: { role: 'resident' } });
      await sendImportantNotice(residents, notice);
    }

    const result = await Notice.findByPk(notice.id, {
      include: [{ model: User, as: 'admin', attributes: ['id', 'name'] }],
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const deleteNotice = async (req: AuthRequest, res: Response) => {
  try {
    const notice = await Notice.findByPk(req.params.id as string);
    if (!notice) return res.status(404).json({ error: 'Notice not found' });
    await notice.destroy();
    res.json({ message: 'Notice deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export { getNotices, createNotice, deleteNotice };
