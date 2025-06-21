
import { useState } from 'react';
import { useTournamentPlayers } from './useTournamentPlayers';

export interface ScheduleMatch {
  id: string;
  team1_player1_id: string;
  team1_player2_id: string;
  team2_player1_id: string;
  team2_player2_id: string;
  team1_player1_name: string;
  team1_player2_name: string;
  team2_player1_name: string;
  team2_player2_name: string;
  court_name?: string;
  court_number?: number;
  round_within_group: number;
}

export interface SchedulePreview {
  matches: ScheduleMatch[];
  totalMatches: number;
  leftGroupMatches: ScheduleMatch[];
  rightGroupMatches: ScheduleMatch[];
}

export const useSchedulePreview = (tournamentId?: string) => {
  const [preview, setPreview] = useState<SchedulePreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { tournamentPlayers } = useTournamentPlayers(tournamentId);

  const generatePreview = async () => {
    if (!tournamentId) return;
    
    setIsGenerating(true);
    console.log('Generating 2v2 preview for tournament:', tournamentId);
    
    try {
      const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
      const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');
      
      console.log('Left players for 2v2:', leftPlayers.length);
      console.log('Right players for 2v2:', rightPlayers.length);

      const generateGroupMatches = (players: typeof leftPlayers, courtPrefix: string): ScheduleMatch[] => {
        const matches: ScheduleMatch[] = [];
        
        // Group players into groups of 4 for round-robin style matches
        for (let groupStart = 0; groupStart < players.length; groupStart += 4) {
          const groupPlayers = players.slice(groupStart, groupStart + 4);
          
          if (groupPlayers.length >= 4) {
            const courtNumber = Math.floor(groupStart / 4) + 1;
            const courtName = `${courtPrefix} Baan ${courtNumber}`;
            
            // Generate 3 rounds following the Excel pattern
            // Round 1: Player 1&2 vs Player 3&4
            matches.push({
              id: `${courtPrefix.toLowerCase()}-g${courtNumber}-r1`,
              team1_player1_id: groupPlayers[0].player_id,
              team1_player2_id: groupPlayers[1].player_id,
              team2_player1_id: groupPlayers[2].player_id,
              team2_player2_id: groupPlayers[3].player_id,
              team1_player1_name: groupPlayers[0].player.name,
              team1_player2_name: groupPlayers[1].player.name,
              team2_player1_name: groupPlayers[2].player.name,
              team2_player2_name: groupPlayers[3].player.name,
              court_name: courtName,
              court_number: courtNumber,
              round_within_group: 1,
            });

            // Round 2: Player 1&3 vs Player 2&4
            matches.push({
              id: `${courtPrefix.toLowerCase()}-g${courtNumber}-r2`,
              team1_player1_id: groupPlayers[0].player_id,
              team1_player2_id: groupPlayers[2].player_id,
              team2_player1_id: groupPlayers[1].player_id,
              team2_player2_id: groupPlayers[3].player_id,
              team1_player1_name: groupPlayers[0].player.name,
              team1_player2_name: groupPlayers[2].player.name,
              team2_player1_name: groupPlayers[1].player.name,
              team2_player2_name: groupPlayers[3].player.name,
              court_name: courtName,
              court_number: courtNumber,
              round_within_group: 2,
            });

            // Round 3: Player 1&4 vs Player 2&3
            matches.push({
              id: `${courtPrefix.toLowerCase()}-g${courtNumber}-r3`,
              team1_player1_id: groupPlayers[0].player_id,
              team1_player2_id: groupPlayers[3].player_id,
              team2_player1_id: groupPlayers[1].player_id,
              team2_player2_id: groupPlayers[2].player_id,
              team1_player1_name: groupPlayers[0].player.name,
              team1_player2_name: groupPlayers[3].player.name,
              team2_player1_name: groupPlayers[1].player.name,
              team2_player2_name: groupPlayers[2].player.name,
              court_name: courtName,
              court_number: courtNumber,
              round_within_group: 3,
            });
          }
        }
        
        return matches;
      };

      const leftMatches = generateGroupMatches(leftPlayers, 'Links');
      const rightMatches = generateGroupMatches(rightPlayers, 'Rechts');
      
      const allMatches = [...leftMatches, ...rightMatches];
      
      console.log('Generated 2v2 matches following Excel pattern:', allMatches.length);

      const schedulePreview: SchedulePreview = {
        matches: allMatches,
        totalMatches: allMatches.length,
        leftGroupMatches: leftMatches,
        rightGroupMatches: rightMatches,
      };

      setPreview(schedulePreview);
      return schedulePreview;
    } catch (error) {
      console.error('Error generating 2v2 preview:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const updateMatch = (matchId: string, updates: Partial<ScheduleMatch>) => {
    if (!preview) return;
    
    const updatedMatches = preview.matches.map(match => 
      match.id === matchId ? { ...match, ...updates } : match
    );
    
    const updatedLeftMatches = updatedMatches.filter(m => m.court_name?.includes('Links'));
    const updatedRightMatches = updatedMatches.filter(m => m.court_name?.includes('Rechts'));
    
    setPreview({
      matches: updatedMatches,
      totalMatches: updatedMatches.length,
      leftGroupMatches: updatedLeftMatches,
      rightGroupMatches: updatedRightMatches,
    });
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return {
    preview,
    generatePreview,
    updateMatch,
    clearPreview,
    isGenerating,
  };
};
