import User from './User';
import Team from './Team';
import Player from './Player';
import Match from './Match';
import League from './League';

// Relaciones adicionales
Team.hasMany(Player, { foreignKey: 'teamId' });
League.hasMany(Team, { foreignKey: 'leagueId' });
League.hasMany(Player, { foreignKey: 'leagueId' });
League.hasMany(Match, { foreignKey: 'leagueId' });

export { User, Team, Player, Match, League };
