"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Team_1 = __importDefault(require("./Team"));
const Jornada_1 = __importDefault(require("./Jornada"));
class Match extends sequelize_1.Model {
}
Match.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    time: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: false,
    },
    scoreHome: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    scoreAway: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    homeTeamId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    awayTeamId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    leagueId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    jornadaId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: "match",
    tableName: "matches",
});
Match.belongsTo(Team_1.default, { as: "homeTeam", foreignKey: "homeTeamId", onDelete: "CASCADE" });
Match.belongsTo(Team_1.default, { as: "awayTeam", foreignKey: "awayTeamId", onDelete: "CASCADE" });
Match.belongsTo(Jornada_1.default, { foreignKey: "jornadaId", as: "jornada" });
exports.default = Match;
