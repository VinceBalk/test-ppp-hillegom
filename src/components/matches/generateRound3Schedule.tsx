export type PlayerStats = {
  playerId: string;
  name: string;
  totalGames: number;
  totalSpecials: number;
};

export type Match = {
  matchNumber: number;
  team1: PlayerStats[];
  team2: PlayerStats[];
};

export function generateRound3Schedule(players: PlayerStats[]): Match[] {
  const sorted = [...players].sort((a, b) => {
    if (b.totalGames !== a.totalGames) {
      return b.totalGames - a.totalGames;
    }
    if (b.totalSpecials !== a.totalSpecials) {
      return b.totalSpecials - a.totalSpecials;
    }
    return 0; // volledig gelijk – organisator beslist
  });

  const matches: Match[] = [];
  let matchNumber = 1;

  for (let i = 0; i < sorted.length; i += 4) {
    const group = sorted.slice(i, i + 4);
    if (group.length === 4) {
      matches.push({
        matchNumber: matchNumber++,
        team1: [group[0], group[3]], // hoogste + laagste
        team2: [group[1], group[2]], // middenmoot
      });
    }
  }

  return matches;
}
