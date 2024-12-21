"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/League.ts
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class League extends sequelize_1.Model {
    get id() {
        return this.getDataValue('id');
    }
    get name() {
        return this.getDataValue('name');
    }
    get totalGoalsFor() {
        return this.getDataValue('totalGoalsFor');
    }
    get matchesPlayed() {
        return this.getDataValue('matchesPlayed');
    }
}
League.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    totalGoalsFor: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    matchesPlayed: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    modelName: 'league',
});
exports.default = League;
