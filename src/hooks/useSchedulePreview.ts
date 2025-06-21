
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScheduleMatch {
  player1_id: string;
  player2_id: string;
  player1_name: string;
  player2_name: string;
  tournament_id: string;
  round_number: number;
  court_assignment?: string;
}

export interface SchedulePreview {
  matches: ScheduleMatch[];
  leftGroupMatches: ScheduleMatch[];
  rightGroupMatches: ScheduleMatch[];
  totalMatches: number;
}

export const useSchedulePreview = () => {
  const [preview, setPreview] = useState<SchedulePreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePreview = async (tournamentId: string, roundNumber: number) => {
    setIsGenerating(true);
    console.log('Generating schedule preview for tournament:', tournamentId, 'round:', roundNumber);
    
    try {
      // Haal alle spelers op voor dit toernooi
      const { data: tournamentPlayers, error: playersError } = await supabase
        .from('tournament_players')
        .select(`
          id,
          player_id,
          group,
          player:players(id, name, ranking_score)
        `)
        .eq('tournament_id', tournamentId)
        .eq('active', true);

      if (playersError) {
        console.error('Error fetching tournament players:', playersError);
        throw playersError;
      }

      if (!tournamentPlayers || tournamentPlayers.length < 2) {
        throw new Error('Er moeten minimaal 2 spelers zijn om wedstrijden te genereren');
      }

      console.log('Found players for preview:', tournamentPlayers);

      // Groepeer spelers per groep
      const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
      const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');

      console.log('Left players:', leftPlayers.length, 'Right players:', rightPlayers.length);

      // Genereer wedstrijden binnen elke groep
      const allMatches: ScheduleMatch[] = [];
      const leftGroupMatches: ScheduleMatch[] = [];
      const rightGroupMatches: ScheduleMatch[] = [];
      
      // Wedstrijden binnen links groep
      for (let i = 0; i < leftPlayers.length; i++) {
        for (let j = i + 1; j < leftPlayers.length; j++) {
          const match: ScheduleMatch = {
            player1_id: leftPlayers[i].player_id,
            player2_id: leftPlayers[j].player_id,
            player1_name: leftPlayers[i].player?.name || 'Onbekend',
            player2_name: leftPlayers[j].player?.name || 'Onbekend',
            tournament_id: tournamentId,
            round_number: roundNumber,
          };
          allMatches.push(match);
          leftGroupMatches.push(match);
        }
      }

      // Wedstrijden binnen rechts groep
      for (let i = 0; i < rightPlayers.length; i++) {
        for (let j = i + 1; j < rightPlayers.length; j++) {
          const match: ScheduleMatch = {
            player1_id: rightPlayers[i].player_id,
            player2_id: rightPlayers[j].player_id,
            player1_name: rightPlayers[i].player?.name || 'Onbekend',
            player2_name: rightPlayers[j].player?.name || 'Onbekend',
            tournament_id: tournamentId,
            round_number: roundNumber,
          };
          allMatches.push(match);
          rightGroupMatches.push(match);
        }
      }

      console.log('Generated preview matches:', allMatches.length);

      const schedulePreview: SchedulePreview = {
        matches: allMatches,
        leftGroupMatches,
        rightGroupMatches,
        totalMatches: allMatches.length
      };

      setPreview(schedulePreview);
      return schedulePreview;

    } catch (error) {
      console.error('Error generating schedule preview:', error);
      toast({
        title: "Fout",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het genereren van het schema preview.",
        variant: "destructive",
      });
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
