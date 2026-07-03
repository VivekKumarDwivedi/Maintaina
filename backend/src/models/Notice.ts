import { Model, DataTypes } from "sequelize";
import type { Sequelize } from "sequelize";

class Notice extends Model {
  declare id: number;
  declare title: string;
  declare content: string;
  declare isImportant: boolean;
  declare adminId: number;
}

export default (sequelize: Sequelize) => {
  Notice.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING, allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      isImportant: { type: DataTypes.BOOLEAN, defaultValue: false },
      adminId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
    }
  );

  return Notice;
};
