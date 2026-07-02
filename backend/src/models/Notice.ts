import { Model, DataTypes } from 'sequelize';

class Notice extends Model {
  public id!: number;
  public title!: string;
  public content!: string;
  public isImportant!: boolean;
  public adminId!: number;
}

export default (sequelize: any) => {
  Notice.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    isImportant: { type: DataTypes.BOOLEAN, defaultValue: false },
    adminId: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    sequelize,
  });

  return Notice;
};
