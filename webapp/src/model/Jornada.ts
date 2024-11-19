import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Match from "./Match";

interface JornadaAttributes {
  id: number;
  name: string;
  date: Date;
  leagueId: number;
}

interface JornadaCreationAttributes extends Optional<JornadaAttributes, "id"> {}

class Jornada extends Model<JornadaAttributes, JornadaCreationAttributes> {
  declare id: number;
  declare name: string;
  declare date: Date;
  declare leagueId: number;
}

Jornada.init(
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
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    leagueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "jornada",
    tableName: "jornadas",
  }
);

export default Jornada;
