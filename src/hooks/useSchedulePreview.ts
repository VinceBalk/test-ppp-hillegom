
import { useState } from 'react';
import { useTournamentPlayers } from './useTournamentPlayers';
import { useCourts } from './useCourts';
import { supabase } from '@/integrations/supabase/client';

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

  const checkIfScheduleExists = async (tournamentId: string, roundNumber: number) => {
    try {
      const { data, error } = await supabase
        .from('tournament_schedule_previews')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('round_number', roundNumber)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing schedule:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in checkIfScheduleExists:', error);
      return null;
    }
  };

  const savePreviewToDatabase = async (tournamentId: string, roundNumber: number, previewData: SchedulePreview) => {
    try {
      // Convert SchedulePreview to a plain object that's compatible with Json type
      const previewJson = JSON.parse(JSON.stringify(previewData));
      
      const { data, error } = await supabase
        .from('tournament_schedule_previews')
        .upsert({
          tournament_id: tournamentId,
          round_number: roundNumber,
          preview_data: previewJson,
          is_approved: false,
          is_locked: false,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving preview to database:', error);
        throw error;
      }

      console.log('Preview saved to database:', data);
      return data;
    } catch (error) {
      console.error('Error in savePreviewToDatabase:', error);
      throw error;
    }
  };

  const generatePreview = async (roundNumber: number = 1) => {
    if (!tournamentId) return;
    
    setIsGenerating(true);
    console.log('Generating 2v2 preview for tournament:', tournamentId, 'round:', roundNumber);
    
    try {
      // Check if schedule already exists
      const existingSchedule = await checkIfScheduleExists(tournamentId, roundNumber);
      if (existingSchedule && existingSchedule.preview_data) {
        console.log('Loading existing schedule from database');
        // Safely cast the Json data back to SchedulePreview
        const existingPreview = existingSchedule.preview_data as unknown as SchedulePreview;
        setPreview(existingPreview);
        return existingPreview;
      }

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

      // Save to database
      await savePreviewToDatabase(tournamentId, roundNumber, schedulePreview);

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
    
    const updatedPreview = {
      matches: updatedMatches,
      totalMatches: updatedMatches.length,
      leftGroupMatches: updatedLeftMatches,
      rightGroupMatches: updatedRightMatches,
    };

    setPreview(updatedPreview);

    // Auto-save changes to database
    if (tournamentId) {
      savePreviewToDatabase(tournamentId, 1, updatedPreview).catch(error => {
        console.error('Error auto-saving preview changes:', error);
      });
    }
  };

  const clearPreview = async () => {
    if (tournamentId && preview) {
      try {
        // Delete from database
        await supabase
          .from('tournament_schedule_previews')
          .delete()
          .eq('tournament_id', tournamentId)
          .eq('round_number', 1);
        
        console.log('Preview cleared from database');
      } catch (error) {
        console.error('Error clearing preview from database:', error);
      }
    }
    
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
