"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/Player.ts
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const League_1 = __importDefault(require("./League"));
const Team_1 = __importDefault(require("./Team"));
class Player extends sequelize_1.Model {
}
Player.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    position: {
        type: sequelize_1.DataTypes.STRING,
    },
    goals: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    yellowCards: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    redCards: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    image: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true, // Permite que sea opcional
    },
    matchesPlayed: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
}, { sequelize: database_1.default, modelName: 'player' });
// Definir relaciones
Player.belongsTo(Team_1.default, { foreignKey: 'teamId', onDelete: 'CASCADE' });
Player.belongsTo(League_1.default, { foreignKey: 'leagueId', onDelete: 'CASCADE' });
exports.default = Player;
