
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class League extends Model {}

League.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'league',
  }
);

export default League;
