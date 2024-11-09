// src/models/Match.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Team from './Team';
import User from './User';
import League from './League';

class Match extends Model {}

Match.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY, // Solo la fecha
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME, // Solo la hora
      allowNull: false,
    },
    scoreHome: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    scoreAway: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  { sequelize, modelName: 'match' }
);

// Asociaciones
Match.belongsTo(Team, { as: 'homeTeam', foreignKey: 'homeTeamId' });
Match.belongsTo(Team, { as: 'awayTeam', foreignKey: 'awayTeamId' });
Match.belongsTo(User, { as: 'referee', foreignKey: 'refereeId' });
Match.belongsTo(League, { foreignKey: 'leagueId' });

export default Match;
