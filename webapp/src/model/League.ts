// src/models/League.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define una interfaz para los atributos de la liga
interface LeagueAttributes {
  id: number;
  name: string;
}

// Define una interfaz para los atributos opcionales en la creación
interface LeagueCreationAttributes extends Optional<LeagueAttributes, 'id'> {}

class League extends Model<LeagueAttributes, LeagueCreationAttributes> {
  // Define los métodos get y set para que TypeScript reconozca los atributos
  get id(): number {
    return this.getDataValue('id');
  }

  get name(): string {
    return this.getDataValue('name');
  }

  set name(value: string) {
    this.setDataValue('name', value);
  }
}

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
