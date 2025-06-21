
import { useState } from 'react';
import { useTournamentPlayers } from './useTournamentPlayers';

export interface ScheduleMatch {
  team1_player1_id: string;
  team1_player2_id: string;
  team2_player1_id: string;
  team2_player2_id: string;
  team1_player1_name: string;
  team1_player2_name: string;
  team2_player1_name: string;
  team2_player2_name: string;
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

      const generateGroupMatches = (players: typeof leftPlayers): ScheduleMatch[] => {
        const matches: ScheduleMatch[] = [];
        
        // Generate all possible 2v2 combinations within the group
        for (let i = 0; i < players.length - 3; i += 4) {
          if (i + 3 < players.length) {
            matches.push({
              team1_player1_id: players[i].player_id,
              team1_player2_id: players[i + 1].player_id,
              team2_player1_id: players[i + 2].player_id,
              team2_player2_id: players[i + 3].player_id,
              team1_player1_name: players[i].player.name,
              team1_player2_name: players[i + 1].player.name,
              team2_player1_name: players[i + 2].player.name,
              team2_player2_name: players[i + 3].player.name,
            });
          }
        }
        
        return matches;
      };

      const leftMatches = generateGroupMatches(leftPlayers);
      const rightMatches = generateGroupMatches(rightPlayers);
      
      const allMatches = [...leftMatches, ...rightMatches];
      
      console.log('Generated 2v2 matches:', allMatches.length);

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

  const clearPreview = () => {
    setPreview(null);
  };

  return {
    preview,
    generatePreview,
    clearPreview,
    isGenerating,
  };
};
