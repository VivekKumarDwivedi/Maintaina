import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = (req.headers as any).authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireResident = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'resident') {
    return res.status(403).json({ error: 'Resident access required' });
  }
  next();
};

export { authenticate, requireAdmin, requireResident };
