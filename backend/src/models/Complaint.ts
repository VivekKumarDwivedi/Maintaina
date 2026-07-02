import { Model, DataTypes } from 'sequelize';

class Complaint extends Model {
  public id!: number;
  public title!: string;
  public description!: string;
  public category!: 'Plumbing' | 'Electrical' | 'Structural' | 'Cleaning' | 'Security' | 'Lift' | 'Parking' | 'Other';
  public status!: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  public priority!: 'Low' | 'Medium' | 'High';
  public photoPath?: string;
  public isOverdue!: boolean;
  public resolvedAt?: Date;
  public closedAt?: Date;
  public residentId!: number;
  public resident?: any;
}

export default (sequelize: any) => {
  Complaint.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: {
      type: DataTypes.ENUM('Plumbing', 'Electrical', 'Structural', 'Cleaning', 'Security', 'Lift', 'Parking', 'Other'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Open', 'In Progress', 'Resolved', 'Closed'),
      defaultValue: 'Open',
    },
    closedAt: { type: DataTypes.DATE },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      defaultValue: 'Low',
    },
    photoPath: { type: DataTypes.STRING },
    isOverdue: { type: DataTypes.BOOLEAN, defaultValue: false },
    resolvedAt: { type: DataTypes.DATE },
    residentId: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    sequelize,
  });

  return Complaint;
};
