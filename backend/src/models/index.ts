import { Sequelize } from 'sequelize';
import env from '../config/env';
// Import models
import initUser from './User';
import initComplaint from './Complaint';
import initComplaintHistory from './ComplaintHistory';
import initNotice from './Notice';
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: env.dbPath,
  logging: false,
});

const User = initUser(sequelize);
const Complaint = initComplaint(sequelize);
const ComplaintHistory = initComplaintHistory(sequelize);
const Notice = initNotice(sequelize);

// Associations
User.hasMany(Complaint, { foreignKey: 'residentId', as: 'complaints' });
Complaint.belongsTo(User, { foreignKey: 'residentId', as: 'resident' });

Complaint.hasMany(ComplaintHistory, { foreignKey: 'complaintId', as: 'history' });
ComplaintHistory.belongsTo(Complaint, { foreignKey: 'complaintId' });

User.hasMany(ComplaintHistory, { foreignKey: 'actorId', as: 'actions' });
ComplaintHistory.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

User.hasMany(Notice, { foreignKey: 'adminId', as: 'notices' });
Notice.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

export { sequelize, User, Complaint, ComplaintHistory, Notice };
