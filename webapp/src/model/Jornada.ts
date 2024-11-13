// src/models/Jornada.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Match from './Match'; // Asegúrate de que esta importación esté bien configurada

interface JornadaAttributes {
  id: number;
  name: string;
  date: Date;
  leagueId: number;
}

interface JornadaCreationAttributes extends Optional<JornadaAttributes, 'id'> {}

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
      references: {
        model: 'leagues',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'jornada',
    tableName: 'jornadas',
  }
);

// Verifica que `Match` esté correctamente definido como modelo antes de asociarlo
if (typeof Match === 'function' && Match.prototype instanceof Model) {
  Jornada.hasMany(Match, { foreignKey: 'jornadaId', as: 'matches' });
  Match.belongsTo(Jornada, { foreignKey: 'jornadaId', as: 'jornada' });
} else {
  console.error("Error: `Match` no es un modelo de Sequelize. Verifica su definición en `Match.ts`.");
}

export default Jornada;
