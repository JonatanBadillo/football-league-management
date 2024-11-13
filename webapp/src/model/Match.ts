// src/models/Match.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Team from './Team';
import User from './User';
import League from './League';
import Jornada from './Jornada'; // Importa Jornada para asociarlo

class Match extends Model {}

Match.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME,
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

Match.belongsTo(Team, { as: 'homeTeam', foreignKey: 'homeTeamId' });
Match.belongsTo(Team, { as: 'awayTeam', foreignKey: 'awayTeamId' });
Match.belongsTo(User, { as: 'referee', foreignKey: 'refereeId' });
Match.belongsTo(League, { foreignKey: 'leagueId' });
Match.belongsTo(Jornada, { foreignKey: 'jornadaId', as: 'jornada' }); // Relación con Jornada

export default Match;
