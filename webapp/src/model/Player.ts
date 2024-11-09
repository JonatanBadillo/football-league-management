// src/models/Player.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import League from './League';
import Team from './Team';

class Player extends Model {}

Player.init(
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
    position: {
      type: DataTypes.STRING,
    },
    goals: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    yellowCards: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    redCards: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,  // Permite que sea opcional
    },
    matchesPlayed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  { sequelize, modelName: 'player' }
);

// Definir relaciones
Player.belongsTo(Team, { foreignKey: 'teamId', onDelete: 'CASCADE' });
Player.belongsTo(League, { foreignKey: 'leagueId', onDelete: 'CASCADE' });

export default Player;
