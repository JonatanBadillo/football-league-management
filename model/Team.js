"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const League_1 = __importDefault(require("./League"));
const User_1 = __importDefault(require("./User"));
class Team extends sequelize_1.Model {
}
Team.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    leagueId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: League_1.default,
            key: 'id',
        },
    },
    captainId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User_1.default,
            key: 'id',
        },
    },
    balance: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
    logo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    goalsFor: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    goalsAgainst: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    victories: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    defeats: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    draws: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    points: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    matchesPlayed: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize: database_1.default,
    modelName: 'team',
    tableName: 'teams', // Asegúrate de que coincida con el nombre de la tabla
});
Team.belongsTo(User_1.default, { as: 'captain', foreignKey: 'captainId' });
Team.belongsTo(League_1.default, {
    foreignKey: "leagueId",
    as: "league", // Alias para usar en las consultas
});
exports.default = Team;
