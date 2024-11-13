// src/models/League.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LeagueAttributes {
  id: number;
  name: string;
  totalGoalsFor: number;  // Acumulación de goles a favor de todos los equipos en la liga
  matchesPlayed: number;  // Número de partidos jugados en la liga
}

interface LeagueCreationAttributes extends Optional<LeagueAttributes, 'id'> {}

class League extends Model<LeagueAttributes, LeagueCreationAttributes> {
  get id(): number {
    return this.getDataValue('id');
  }

  get name(): string {
    return this.getDataValue('name');
  }

  get totalGoalsFor(): number {
    return this.getDataValue('totalGoalsFor');
  }

  get matchesPlayed(): number {
    return this.getDataValue('matchesPlayed');
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
    totalGoalsFor: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    matchesPlayed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'league',
  }
);

export default League;
