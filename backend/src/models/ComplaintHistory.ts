import { Model, DataTypes } from 'sequelize';

class ComplaintHistory extends Model {
  public id!: number;
  public complaintId!: number;
  public actorId!: number;
  public fromStatus?: string;
  public toStatus?: string;
  public fromPriority?: string;
  public toPriority?: string;
  public note?: string;
  public action!: 'created' | 'status_changed' | 'priority_changed' | 'flagged_overdue';
}

export default (sequelize: any) => {
  ComplaintHistory.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    complaintId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: false },
    fromStatus: { type: DataTypes.STRING },
    toStatus: { type: DataTypes.STRING },
    fromPriority: { type: DataTypes.STRING },
    toPriority: { type: DataTypes.STRING },
    note: { type: DataTypes.TEXT },
    action: {
      type: DataTypes.ENUM('created', 'status_changed', 'priority_changed', 'flagged_overdue'),
      allowNull: false,
    },
  }, {
    sequelize,
  });

  return ComplaintHistory;
};
