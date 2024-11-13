// src/models/index.ts
import User from './User';
import Team from './Team';
import Player from './Player';
import Match from './Match';
import League from './League';
import Jornada from './Jornada';

// Asegúrate de que todos los modelos estén correctamente inicializados y relacionados aquí
League.hasMany(Team, { foreignKey: 'leagueId' });
League.hasMany(Player, { foreignKey: 'leagueId' });
League.hasMany(Match, { foreignKey: 'leagueId' });
League.hasMany(Jornada, { foreignKey: 'leagueId', as: 'jornadas' });

Jornada.hasMany(Match, { foreignKey: 'jornadaId', as: 'matches' });
Match.belongsTo(Jornada, { foreignKey: 'jornadaId', as: 'jornada' });

Team.belongsTo(User, { as: 'captain', foreignKey: 'captainId' });
Team.hasMany(Player, { foreignKey: 'teamId' });

export { User, Team, Player, Match, League, Jornada };
