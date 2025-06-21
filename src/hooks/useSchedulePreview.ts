
import { useState } from 'react';
import { useTournamentPlayers } from './useTournamentPlayers';
import { useCourts } from './useCourts';

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
  court_id?: string;
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
  const { courts } = useCourts();

  const generatePreview = async () => {
    if (!tournamentId) return;
    
    setIsGenerating(true);
    console.log('Generating 2v2 preview for tournament:', tournamentId);
    
    try {
      const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
      const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');
      
      console.log('Left players for 2v2:', leftPlayers.length);
      console.log('Right players for 2v2:', rightPlayers.length);
      console.log('Available courts:', courts);

      const activeCourts = courts.filter(court => court.is_active);

      const generateGroupMatches = (players: typeof leftPlayers, courtPrefix: string): ScheduleMatch[] => {
        const matches: ScheduleMatch[] = [];
        
        // Group players into groups of 4 for round-robin style matches
        for (let groupStart = 0; groupStart < players.length; groupStart += 4) {
          const groupPlayers = players.slice(groupStart, groupStart + 4);
          
          if (groupPlayers.length >= 4) {
            const courtIndex = Math.floor(groupStart / 4);
            const assignedCourt = activeCourts[courtIndex % activeCourts.length];
            
            // Create more meaningful court names that include group info
            const courtName = assignedCourt ? 
              `${assignedCourt.name} (${courtPrefix})` : 
              `${courtPrefix} Baan ${courtIndex + 1}`;
            const courtId = assignedCourt ? assignedCourt.id : undefined;
            
            // Based on the Excel pattern:
            // Round 1: Player 1&3 vs Player 2&4
            matches.push({
              id: `${courtPrefix.toLowerCase()}-g${courtIndex + 1}-r1`,
              team1_player1_id: groupPlayers[0].player_id,
              team1_player2_id: groupPlayers[2].player_id,
              team2_player1_id: groupPlayers[1].player_id,
              team2_player2_id: groupPlayers[3].player_id,
              team1_player1_name: groupPlayers[0].player.name,
              team1_player2_name: groupPlayers[2].player.name,
              team2_player1_name: groupPlayers[1].player.name,
              team2_player2_name: groupPlayers[3].player.name,
              court_name: courtName,
              court_number: courtIndex + 1,
              court_id: courtId,
              round_within_group: 1,
            });

            // Round 2: Player 1&4 vs Player 2&3 
            matches.push({
              id: `${courtPrefix.toLowerCase()}-g${courtIndex + 1}-r2`,
              team1_player1_id: groupPlayers[0].player_id,
              team1_player2_id: groupPlayers[3].player_id,
              team2_player1_id: groupPlayers[1].player_id,
              team2_player2_id: groupPlayers[2].player_id,
              team1_player1_name: groupPlayers[0].player.name,
              team1_player2_name: groupPlayers[3].player.name,
              team2_player1_name: groupPlayers[1].player.name,
              team2_player2_name: groupPlayers[2].player.name,
              court_name: courtName,
              court_number: courtIndex + 1,
              court_id: courtId,
              round_within_group: 2,
            });

            // Round 3: Player 1&2 vs Player 3&4
            matches.push({
              id: `${courtPrefix.toLowerCase()}-g${courtIndex + 1}-r3`,
              team1_player1_id: groupPlayers[0].player_id,
              team1_player2_id: groupPlayers[1].player_id,
              team2_player1_id: groupPlayers[2].player_id,
              team2_player2_id: groupPlayers[3].player_id,
              team1_player1_name: groupPlayers[0].player.name,
              team1_player2_name: groupPlayers[1].player.name,
              team2_player1_name: groupPlayers[2].player.name,
              team2_player2_name: groupPlayers[3].player.name,
              court_name: courtName,
              court_number: courtIndex + 1,
              court_id: courtId,
              round_within_group: 3,
            });
          }
        }
        
        return matches;
      };

      const leftMatches = generateGroupMatches(leftPlayers, 'Links');
      const rightMatches = generateGroupMatches(rightPlayers, 'Rechts');
      
      const allMatches = [...leftMatches, ...rightMatches];
      
      console.log('Generated 2v2 matches with court assignments from database:', allMatches.length);

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
    
    const updatedLeftMatches = updatedMatches.filter(m => 
      m.court_name?.includes('Links') || m.id.includes('links')
    );
    const updatedRightMatches = updatedMatches.filter(m => 
      m.court_name?.includes('Rechts') || m.id.includes('rechts')
    );
    
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
