import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import League from './League';
import User from './User';

class Team extends Model {}

Team.init(
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
    leagueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: League,
        key: 'id',
      },
    },
    captainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    balance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    goalsFor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    goalsAgainst: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    victories: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    defeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    draws: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    matchesPlayed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'team',
    tableName: 'teams', // Asegúrate de que coincida con el nombre de la tabla
  }
);

Team.belongsTo(User, { as: 'captain', foreignKey: 'captainId' });
Team.belongsTo(League, {
  foreignKey: "leagueId",
  as: "league", // Alias para usar en las consultas
});


export default Team;
