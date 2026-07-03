import { Model, DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";
import type { User } from "./User";

class Complaint extends Model {
  declare id: number;
  declare title: string;
  declare description: string;
  declare category:
    | "Plumbing"
    | "Electrical"
    | "Structural"
    | "Cleaning"
    | "Security"
    | "Lift"
    | "Parking"
    | "Other";
  declare status: "Open" | "In Progress" | "Resolved" | "Closed";
  declare priority: "Low" | "Medium" | "High";
  declare photoPath?: string;
  declare isOverdue: boolean;
  declare resolvedAt?: Date;
  declare closedAt?: Date;
  declare residentId: number;
  declare resident?: User;
}

export default (sequelize: Sequelize) => {
  Complaint.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      category: {
        type: DataTypes.ENUM(
          "Plumbing",
          "Electrical",
          "Structural",
          "Cleaning",
          "Security",
          "Lift",
          "Parking",
          "Other"
        ),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("Open", "In Progress", "Resolved", "Closed"),
        defaultValue: "Open",
      },
      closedAt: { type: DataTypes.DATE },
      priority: {
        type: DataTypes.ENUM("Low", "Medium", "High"),
        defaultValue: "Low",
      },
      photoPath: { type: DataTypes.STRING },
      isOverdue: { type: DataTypes.BOOLEAN, defaultValue: false },
      resolvedAt: { type: DataTypes.DATE },
      residentId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
    }
  );

  return Complaint;
};
