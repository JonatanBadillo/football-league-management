// src/model/User.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define los atributos de la interfaz UserAttributes
interface UserAttributes {
  id: number;
  username: string;
  role: string;
  password: string;
}

// Define los atributos opcionales para la creación de User
interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes> {
  declare id: number;
  declare username: string;
  declare role: string;
  declare password: string;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'user',
  }
);

export default User;
