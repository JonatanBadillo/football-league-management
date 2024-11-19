import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Team from "./Team";
import Jornada from "./Jornada";
import League from "./League";

interface MatchAttributes {
  id: number;
  date: Date;
  time: string;
  scoreHome: number;
  scoreAway: number;
  homeTeamId: number;
  awayTeamId: number;
  leagueId: number;
  jornadaId: number;
}

interface MatchCreationAttributes extends Optional<MatchAttributes, "id"> {}

class Match extends Model<MatchAttributes, MatchCreationAttributes> {
  declare id: number;
  declare date: Date;
  declare time: string;
  declare scoreHome: number;
  declare scoreAway: number;
  declare homeTeamId: number;
  declare awayTeamId: number;
  declare leagueId: number;
  declare jornadaId: number;
}

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
    homeTeamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    awayTeamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    leagueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    jornadaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "match",
    tableName: "matches",
  }
);

Match.belongsTo(Team, { as: "homeTeam", foreignKey: "homeTeamId" });
Match.belongsTo(Team, { as: "awayTeam", foreignKey: "awayTeamId" });
Match.belongsTo(Jornada, { foreignKey: "jornadaId", as: "jornada" });

export default Match;
