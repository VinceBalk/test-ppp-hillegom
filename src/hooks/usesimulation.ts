import { useState, useCallback, useMemo } from 'react';
import { Match } from '@/hooks/useMatches';

interface SimulatedScore {
  matchId: string;
  team1Score: number;
  team2Score: number;
}

interface SimulatedSpecial {
  matchId: string;
  playerId: string;
  playerName: string;
  count: number;
}

interface SimulatedMatch extends Match {
  simulated_team1_score?: number | null;
  simulated_team2_score?: number | null;
  simulated_specials?: SimulatedSpecial[];
  simulated_status?: 'scheduled' | 'completed';
}

interface Round3Group {
  groupName: string;
  courtId: string;
  courtName: string;
  players: {
    playerId: string;
    playerName: string;
    gamesWon: number;
    specials: number;
  }[];
}

interface SimulationState {
  isActive: boolean;
  mode: 'none' | 'random' | 'manual';
  scores: Record<string, SimulatedScore>;
  specials: SimulatedSpecial[];
  round3Generated: boolean;
  round3Matches: SimulatedMatch[];
  round3Groups: Round3Group[];
}

// Genereer random score (totaal = 8 games)
const generateRandomScore = (): { team1: number; team2: number } => {
  const possibleScores = [
    { team1: 8, team2: 0 },
    { team1: 7, team2: 1 },
    { team1: 6, team2: 2 },
    { team1: 5, team2: 3 },
    { team1: 4, team2: 4 },
    { team1: 3, team2: 5 },
    { team1: 2, team2: 6 },
    { team1: 1, team2: 7 },
    { team1: 0, team2: 8 },
  ];
  return possibleScores[Math.floor(Math.random() * possibleScores.length)];
};

// Genereer random specials (0-2 per wedstrijd)
const generateRandomSpecials = (
  matchId: string,
  players: { id?: string; name?: string }[]
): SimulatedSpecial[] => {
  const specials: SimulatedSpecial[] = [];
  const validPlayers = players.filter(p => p.id && p.name);

  // 30% kans op specials per wedstrijd
  if (Math.random() < 0.3 && validPlayers.length > 0) {
    const numSpecials = Math.floor(Math.random() * 2) + 1; // 1-2 specials
    for (let i = 0; i < numSpecials; i++) {
      const player = validPlayers[Math.floor(Math.random() * validPlayers.length)];
      specials.push({
        matchId,
        playerId: player.id!,
        playerName: player.name!,
        count: 1,
      });
    }
  }

  return specials;
};

export const useSimulation = (tournamentId: string, realMatches: Match[], courts: any[]) => {
  const [state, setState] = useState<SimulationState>({
    isActive: false,
    mode: 'none',
    scores: {},
    specials: [],
    round3Generated: false,
    round3Matches: [],
    round3Groups: [],
  });

  // Helper: get all players from a match
  const getMatchPlayers = (match: Match) => [
    { id: match.team1_player1_id, name: match.team1_player1?.name },
    { id: match.team1_player2_id, name: match.team1_player2?.name },
    { id: match.team2_player1_id, name: match.team2_player1?.name },
    { id: match.team2_player2_id, name: match.team2_player2?.name },
  ];

  // Start RANDOM simulatie - vul R1 en R2 met random scores
  const startRandomSimulation = useCallback(() => {
    const newScores: Record<string, SimulatedScore> = {};
    const newSpecials: SimulatedSpecial[] = [];

    const r1r2Matches = realMatches.filter(m => m.round_number === 1 || m.round_number === 2);

    r1r2Matches.forEach(match => {
      const score = generateRandomScore();
      newScores[match.id] = {
        matchId: match.id,
        team1Score: score.team1,
        team2Score: score.team2,
      };

      const matchSpecials = generateRandomSpecials(match.id, getMatchPlayers(match));
      newSpecials.push(...matchSpecials);
    });

    setState({
      isActive: true,
      mode: 'random',
      scores: newScores,
      specials: newSpecials,
      round3Generated: false,
      round3Matches: [],
      round3Groups: [],
    });
  }, [realMatches]);

  // Start HANDMATIGE simulatie - lege scores
  const startManualSimulation = useCallback(() => {
    const newScores: Record<string, SimulatedScore> = {};

    const r1r2Matches = realMatches.filter(m => m.round_number === 1 || m.round_number === 2);

    r1r2Matches.forEach(match => {
      newScores[match.id] = {
        matchId: match.id,
        team1Score: -1, // -1 = nog niet ingevuld
        team2Score: -1,
      };
    });

    setState({
      isActive: true,
      mode: 'manual',
      scores: newScores,
      specials: [],
      round3Generated: false,
      round3Matches: [],
      round3Groups: [],
    });
  }, [realMatches]);

  // Handmatig score invoeren voor een wedstrijd
  const setMatchScore = useCallback((matchId: string, team1Score: number, team2Score: number) => {
    // Validatie: totaal moet 8 zijn
    if (team1Score + team2Score !== 8) {
      console.warn('Score moet optellen tot 8');
      return;
    }
    if (team1Score < 0 || team1Score > 8 || team2Score < 0 || team2Score > 8) {
      console.warn('Score moet tussen 0 en 8 zijn');
      return;
    }

    setState(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [matchId]: {
          matchId,
          team1Score,
          team2Score,
        },
      },
    }));
  }, []);

  // Special toevoegen voor een speler
  const addSpecial = useCallback((matchId: string, playerId: string, playerName: string) => {
    setState(prev => {
      // Check of deze speler al een special heeft voor deze match
      const existingIndex = prev.specials.findIndex(
        s => s.matchId === matchId && s.playerId === playerId
      );

      if (existingIndex >= 0) {
        // Verhoog count
        const newSpecials = [...prev.specials];
        newSpecials[existingIndex] = {
          ...newSpecials[existingIndex],
          count: newSpecials[existingIndex].count + 1,
        };
        return { ...prev, specials: newSpecials };
      } else {
        // Voeg nieuwe toe
        return {
          ...prev,
          specials: [
            ...prev.specials,
            { matchId, playerId, playerName, count: 1 },
          ],
        };
      }
    });
  }, []);

  // Special verwijderen voor een speler
  const removeSpecial = useCallback((matchId: string, playerId: string) => {
    setState(prev => {
      const existingIndex = prev.specials.findIndex(
        s => s.matchId === matchId && s.playerId === playerId
      );

      if (existingIndex >= 0) {
        const current = prev.specials[existingIndex];
        if (current.count > 1) {
          // Verlaag count
          const newSpecials = [...prev.specials];
          newSpecials[existingIndex] = {
            ...newSpecials[existingIndex],
            count: current.count - 1,
          };
          return { ...prev, specials: newSpecials };
        } else {
          // Verwijder
          return {
            ...prev,
            specials: prev.specials.filter((_, i) => i !== existingIndex),
          };
        }
      }
      return prev;
    });
  }, []);

  // Bereken player stats uit gesimuleerde scores
  const calculatePlayerStats = useCallback(() => {
    const stats: Record<string, { 
      playerId: string; 
      playerName: string; 
      gamesWon: number; 
      specials: number;
      groupSide: string;
    }> = {};

    const r1r2Matches = realMatches.filter(m => m.round_number === 1 || m.round_number === 2);

    r1r2Matches.forEach(match => {
      const score = state.scores[match.id];
      if (!score || score.team1Score < 0 || score.team2Score < 0) return;

      const courtSide = match.court?.row_side || 'left';

      // Team 1 players
      [match.team1_player1, match.team1_player2].forEach(player => {
        if (player?.id) {
          if (!stats[player.id]) {
            stats[player.id] = {
              playerId: player.id,
              playerName: player.name,
              gamesWon: 0,
              specials: 0,
              groupSide: courtSide,
            };
          }
          stats[player.id].gamesWon += score.team1Score;
        }
      });

      // Team 2 players
      [match.team2_player1, match.team2_player2].forEach(player => {
        if (player?.id) {
          if (!stats[player.id]) {
            stats[player.id] = {
              playerId: player.id,
              playerName: player.name,
              gamesWon: 0,
              specials: 0,
              groupSide: courtSide,
            };
          }
          stats[player.id].gamesWon += score.team2Score;
        }
      });
    });

    // Tel specials per speler (alleen R1+R2)
    state.specials
      .filter(s => !s.matchId.startsWith('sim-r3-'))
      .forEach(special => {
        if (stats[special.playerId]) {
          stats[special.playerId].specials += special.count;
        }
      });

    return Object.values(stats);
  }, [realMatches, state.scores, state.specials]);

  // Check of R1 en R2 volledig zijn ingevuld
  const r1r2Complete = useMemo(() => {
    const r1r2Matches = realMatches.filter(m => m.round_number === 1 || m.round_number === 2);
    if (r1r2Matches.length === 0) return false;

    return r1r2Matches.every(match => {
      const score = state.scores[match.id];
      return score && score.team1Score >= 0 && score.team2Score >= 0;
    });
  }, [realMatches, state.scores]);

  // Genereer R3 op basis van R1+R2 resultaten
  const generateRound3 = useCallback((fillWithRandomScores: boolean = false) => {
    const playerStats = calculatePlayerStats();

    // Splits op group side en sorteer
    const leftPlayers = playerStats
      .filter(p => p.groupSide === 'left')
      .sort((a, b) => {
        if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
        return b.specials - a.specials;
      });

    const rightPlayers = playerStats
      .filter(p => p.groupSide === 'right')
      .sort((a, b) => {
        if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
        return b.specials - a.specials;
      });

    // Sorteer courts
    const sortedCourts = [...courts].sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));
    const leftCourts = sortedCourts.filter(c => c.row_side === 'left');
    const rightCourts = sortedCourts.filter(c => c.row_side === 'right');

    // Maak groepen
    const groups: Round3Group[] = [
      {
        groupName: 'Links Top 4',
        courtId: leftCourts[0]?.id || '',
        courtName: leftCourts[0]?.name || 'Baan 1',
        players: leftPlayers.slice(0, 4).map(p => ({
          playerId: p.playerId,
          playerName: p.playerName,
          gamesWon: p.gamesWon,
          specials: p.specials,
        })),
      },
      {
        groupName: 'Links Bottom 4',
        courtId: leftCourts[1]?.id || '',
        courtName: leftCourts[1]?.name || 'Baan 3',
        players: leftPlayers.slice(4, 8).map(p => ({
          playerId: p.playerId,
          playerName: p.playerName,
          gamesWon: p.gamesWon,
          specials: p.specials,
        })),
      },
      {
        groupName: 'Rechts Top 4',
        courtId: rightCourts[0]?.id || '',
        courtName: rightCourts[0]?.name || 'Baan 2',
        players: rightPlayers.slice(0, 4).map(p => ({
          playerId: p.playerId,
          playerName: p.playerName,
          gamesWon: p.gamesWon,
          specials: p.specials,
        })),
      },
      {
        groupName: 'Rechts Bottom 4',
        courtId: rightCourts[1]?.id || '',
        courtName: rightCourts[1]?.name || 'Baan 4',
        players: rightPlayers.slice(4, 8).map(p => ({
          playerId: p.playerId,
          playerName: p.playerName,
          gamesWon: p.gamesWon,
          specials: p.specials,
        })),
      },
    ];

    // Genereer round-robin matches per groep
    const r3Matches: SimulatedMatch[] = [];
    const r3Specials: SimulatedSpecial[] = [];
    let matchNumber = 1;

    groups.forEach((group, groupIndex) => {
      const players = group.players;
      if (players.length !== 4) return;

      // Round-robin voor 4 spelers (3 matches)
      const pairings = [
        { t1: [0, 2], t2: [1, 3] },
        { t1: [0, 3], t2: [1, 2] },
        { t1: [0, 1], t2: [2, 3] },
      ];

      pairings.forEach((pairing, matchIndex) => {
        const matchId = `sim-r3-g${groupIndex}-m${matchIndex}`;
        
        let score1: number | null = null;
        let score2: number | null = null;
        
        if (fillWithRandomScores) {
          const score = generateRandomScore();
          score1 = score.team1;
          score2 = score.team2;
          
          // Random specials
          const matchSpecials = generateRandomSpecials(matchId, [
            { id: players[pairing.t1[0]]?.playerId, name: players[pairing.t1[0]]?.playerName },
            { id: players[pairing.t1[1]]?.playerId, name: players[pairing.t1[1]]?.playerName },
            { id: players[pairing.t2[0]]?.playerId, name: players[pairing.t2[0]]?.playerName },
            { id: players[pairing.t2[1]]?.playerId, name: players[pairing.t2[1]]?.playerName },
          ]);
          r3Specials.push(...matchSpecials);
        }

        r3Matches.push({
          id: matchId,
          tournament_id: tournamentId,
          round_number: 3,
          match_number: matchNumber++,
          court_id: group.courtId,
          court: { 
            id: group.courtId, 
            name: group.courtName,
            row_side: groupIndex < 2 ? 'left' : 'right',
          } as any,
          team1_player1_id: players[pairing.t1[0]]?.playerId,
          team1_player2_id: players[pairing.t1[1]]?.playerId,
          team2_player1_id: players[pairing.t2[0]]?.playerId,
          team2_player2_id: players[pairing.t2[1]]?.playerId,
          team1_player1: { id: players[pairing.t1[0]]?.playerId, name: players[pairing.t1[0]]?.playerName } as any,
          team1_player2: { id: players[pairing.t1[1]]?.playerId, name: players[pairing.t1[1]]?.playerName } as any,
          team2_player1: { id: players[pairing.t2[0]]?.playerId, name: players[pairing.t2[0]]?.playerName } as any,
          team2_player2: { id: players[pairing.t2[1]]?.playerId, name: players[pairing.t2[1]]?.playerName } as any,
          status: fillWithRandomScores ? 'completed' : 'scheduled',
          simulated_team1_score: score1,
          simulated_team2_score: score2,
          simulated_specials: fillWithRandomScores ? r3Specials.filter(s => s.matchId === matchId) : [],
          simulated_status: fillWithRandomScores ? 'completed' : 'scheduled',
        } as SimulatedMatch);
      });
    });

    // Update scores state voor R3 matches
    const r3Scores: Record<string, SimulatedScore> = {};
    r3Matches.forEach(match => {
      r3Scores[match.id] = {
        matchId: match.id,
        team1Score: match.simulated_team1_score ?? -1,
        team2Score: match.simulated_team2_score ?? -1,
      };
    });

    setState(prev => ({
      ...prev,
      round3Generated: true,
      round3Matches: r3Matches,
      round3Groups: groups,
      scores: {
        ...prev.scores,
        ...r3Scores,
      },
      specials: [
        ...prev.specials,
        ...r3Specials,
      ],
    }));
  }, [calculatePlayerStats, courts, tournamentId]);

  // Set R3 match score (voor handmatige invoer)
  const setR3MatchScore = useCallback((matchId: string, team1Score: number, team2Score: number) => {
    if (team1Score + team2Score !== 8) return;

    setState(prev => {
      // Update score
      const newScores = {
        ...prev.scores,
        [matchId]: { matchId, team1Score, team2Score },
      };

      // Update R3 match
      const newR3Matches = prev.round3Matches.map(match => {
        if (match.id === matchId) {
          return {
            ...match,
            simulated_team1_score: team1Score,
            simulated_team2_score: team2Score,
            simulated_status: 'completed' as const,
          };
        }
        return match;
      });

      return {
        ...prev,
        scores: newScores,
        round3Matches: newR3Matches,
      };
    });
  }, []);

  // Reset simulatie
  const resetSimulation = useCallback(() => {
    setState({
      isActive: false,
      mode: 'none',
      scores: {},
      specials: [],
      round3Generated: false,
      round3Matches: [],
      round3Groups: [],
    });
  }, []);

  // Combineer echte matches met gesimuleerde scores
  const simulatedMatches = useMemo((): SimulatedMatch[] => {
    if (!state.isActive) return realMatches;

    const r1r2WithSimulation = realMatches
      .filter(m => m.round_number === 1 || m.round_number === 2)
      .map(match => {
        const score = state.scores[match.id];
        const matchSpecials = state.specials.filter(s => s.matchId === match.id);
        const isComplete = score && score.team1Score >= 0 && score.team2Score >= 0;
        
        return {
          ...match,
          simulated_team1_score: isComplete ? score.team1Score : null,
          simulated_team2_score: isComplete ? score.team2Score : null,
          simulated_specials: matchSpecials,
          simulated_status: isComplete ? 'completed' : 'scheduled',
        } as SimulatedMatch;
      });

    // Voeg R3 matches toe als gegenereerd
    if (state.round3Generated) {
      return [...r1r2WithSimulation, ...state.round3Matches];
    }

    return r1r2WithSimulation;
  }, [realMatches, state]);

  // Check of R3 volledig is
  const r3Complete = useMemo(() => {
    if (!state.round3Generated) return false;
    
    return state.round3Matches.every(match => {
      const score = state.scores[match.id];
      return score && score.team1Score >= 0 && score.team2Score >= 0;
    });
  }, [state.round3Generated, state.round3Matches, state.scores]);

  // Bereken finale ranking na R3
  const finalRankings = useMemo(() => {
    if (!state.round3Generated || !r3Complete) return null;

    const allStats: Record<string, {
      playerId: string;
      playerName: string;
      groupSide: string;
      r1r2Games: number;
      r1r2Specials: number;
      r3Games: number;
      r3Specials: number;
      totalGames: number;
      totalSpecials: number;
      r3Group: string;
    }> = {};

    // R1+R2 stats
    const r1r2Stats = calculatePlayerStats();
    r1r2Stats.forEach(stat => {
      allStats[stat.playerId] = {
        playerId: stat.playerId,
        playerName: stat.playerName,
        groupSide: stat.groupSide,
        r1r2Games: stat.gamesWon,
        r1r2Specials: stat.specials,
        r3Games: 0,
        r3Specials: 0,
        totalGames: stat.gamesWon,
        totalSpecials: stat.specials,
        r3Group: '',
      };
    });

    // R3 stats
    state.round3Matches.forEach(match => {
      const score = state.scores[match.id];
      if (!score || score.team1Score < 0) return;

      const t1Score = score.team1Score;
      const t2Score = score.team2Score;
      const groupName = state.round3Groups.find(g => g.courtId === match.court_id)?.groupName || '';

      [match.team1_player1_id, match.team1_player2_id].forEach(playerId => {
        if (playerId && allStats[playerId]) {
          allStats[playerId].r3Games += t1Score;
          allStats[playerId].totalGames += t1Score;
          allStats[playerId].r3Group = groupName;
        }
      });

      [match.team2_player1_id, match.team2_player2_id].forEach(playerId => {
        if (playerId && allStats[playerId]) {
          allStats[playerId].r3Games += t2Score;
          allStats[playerId].totalGames += t2Score;
          allStats[playerId].r3Group = groupName;
        }
      });
    });

    // R3 specials
    state.specials
      .filter(s => s.matchId.startsWith('sim-r3-'))
      .forEach(special => {
        if (allStats[special.playerId]) {
          allStats[special.playerId].r3Specials += special.count;
          allStats[special.playerId].totalSpecials += special.count;
        }
      });

    // Sorteer per groep
    const sortByRanking = (a: any, b: any) => {
      // Eerst op R3 groep (Top 4 voor Bottom 4)
      if (a.r3Group.includes('Top') && b.r3Group.includes('Bottom')) return -1;
      if (a.r3Group.includes('Bottom') && b.r3Group.includes('Top')) return 1;
      // Dan op R3 games
      if (b.r3Games !== a.r3Games) return b.r3Games - a.r3Games;
      // Dan op R3 specials
      if (b.r3Specials !== a.r3Specials) return b.r3Specials - a.r3Specials;
      // Dan op R1+R2 games
      if (b.r1r2Games !== a.r1r2Games) return b.r1r2Games - a.r1r2Games;
      // Dan op R1+R2 specials
      return b.r1r2Specials - a.r1r2Specials;
    };

    const leftRankings = Object.values(allStats)
      .filter(p => p.groupSide === 'left')
      .sort(sortByRanking);

    const rightRankings = Object.values(allStats)
      .filter(p => p.groupSide === 'right')
      .sort(sortByRanking);

    return { left: leftRankings, right: rightRankings };
  }, [state.round3Generated, r3Complete, state.round3Matches, state.round3Groups, state.scores, state.specials, calculatePlayerStats]);

  return {
    // State
    isSimulationActive: state.isActive,
    simulationMode: state.mode,
    simulatedMatches,
    round3Generated: state.round3Generated,
    round3Groups: state.round3Groups,
    finalRankings,
    r1r2Complete,
    r3Complete,
    
    // Actions
    startRandomSimulation,
    startManualSimulation,
    setMatchScore,
    setR3MatchScore,
    addSpecial,
    removeSpecial,
    generateRound3,
    resetSimulation,
    
    // Helpers
    playerStatsAfterR1R2: state.isActive ? calculatePlayerStats() : [],
    getMatchScore: (matchId: string) => state.scores[matchId],
    getMatchSpecials: (matchId: string) => state.specials.filter(s => s.matchId === matchId),
  };
};

export type { SimulatedMatch, SimulatedSpecial, Round3Group };
