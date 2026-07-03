import { Model, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import type { Sequelize } from "sequelize";

class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role: "resident" | "admin";
  declare flatNumber?: string;
  declare phone?: string;
  declare resetPasswordToken?: string | null;
  declare resetPasswordExpires?: Date | null;

  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  public toJSON(): Partial<User> {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}

export { User };

export default (sequelize: Sequelize) => {
  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: { type: DataTypes.STRING, allowNull: false },
      role: {
        type: DataTypes.ENUM("resident", "admin"),
        defaultValue: "resident",
      },
      flatNumber: { type: DataTypes.STRING },
      phone: { type: DataTypes.STRING },
      resetPasswordToken: { type: DataTypes.STRING },
      resetPasswordExpires: { type: DataTypes.DATE },
    },
    {
      sequelize,
      hooks: {
        beforeCreate: async (user: User) => {
          const password = user.getDataValue("password");
          if (!password || typeof password !== "string") {
            throw new Error("User password must be provided before hashing");
          }
          user.setDataValue("password", await bcrypt.hash(password, 10));
        },
        beforeUpdate: async (user: User) => {
          if (user.changed("password")) {
            const password = user.getDataValue("password");
            if (!password || typeof password !== "string") {
              throw new Error("User password must be provided before hashing");
            }
            user.setDataValue("password", await bcrypt.hash(password, 10));
          }
        },
      },
    }
  );

  return User;
};
