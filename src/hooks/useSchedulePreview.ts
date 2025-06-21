
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScheduleMatch {
  team1_player1_id: string;
  team1_player2_id: string;
  team2_player1_id: string;
  team2_player2_id: string;
  team1_player1_name: string;
  team1_player2_name: string;
  team2_player1_name: string;
  team2_player2_name: string;
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
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const { toast } = useToast();

  const generatePreview = async (tournamentId: string, roundNumber: number) => {
    if (!tournamentId) {
      console.error('No tournament ID provided');
      toast({
        title: "Fout",
        description: "Geen toernooi ID opgegeven.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    console.log('Fetching players for manual 2v2 schedule setup, tournament:', tournamentId);
    
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

      console.log('Raw tournament players data:', tournamentPlayers);

      if (playersError) {
        console.error('Error fetching tournament players:', playersError);
        throw playersError;
      }

      if (!tournamentPlayers || tournamentPlayers.length < 4) {
        throw new Error('Er moeten minimaal 4 spelers zijn om 2v2 wedstrijden te genereren');
      }

      // Filter out players without valid data
      const validPlayers = tournamentPlayers.filter(tp => 
        tp.player && tp.player.id && tp.player.name && tp.group
      );

      console.log('Valid players after filtering:', validPlayers);

      if (validPlayers.length < 4) {
        throw new Error('Er zijn niet genoeg geldige spelers om 2v2 wedstrijden te genereren');
      }

      console.log('Found players for manual setup:', validPlayers);
      setAvailablePlayers(validPlayers);

      // Groepeer spelers per groep
      const leftPlayers = validPlayers.filter(tp => tp.group === 'left');
      const rightPlayers = validPlayers.filter(tp => tp.group === 'right');

      console.log('Left players:', leftPlayers);
      console.log('Right players:', rightPlayers);

      // Start met lege preview voor handmatige invoer
      const schedulePreview: SchedulePreview = {
        matches: [],
        leftGroupMatches: [],
        rightGroupMatches: [],
        totalMatches: 0
      };

      setPreview(schedulePreview);
      
      toast({
        title: "Spelers geladen",
        description: `${leftPlayers.length} spelers in links groep, ${rightPlayers.length} spelers in rechts groep. Je kunt nu handmatig wedstrijden samenstellen.`,
      });

      return schedulePreview;

    } catch (error) {
      console.error('Error loading players for manual setup:', error);
      const errorMessage = error instanceof Error ? error.message : "Er is een fout opgetreden bij het laden van de spelers.";
      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const addManualMatch = (match: Omit<ScheduleMatch, 'tournament_id' | 'round_number'>, tournamentId: string, roundNumber: number) => {
    if (!preview) {
      console.error('No preview available to add match to');
      return;
    }

    if (!tournamentId || !roundNumber) {
      console.error('Missing tournament ID or round number');
      return;
    }

    const newMatch: ScheduleMatch = {
      ...match,
      tournament_id: tournamentId,
      round_number: roundNumber,
    };

    console.log('Adding new match:', newMatch);

    const updatedMatches = [...preview.matches, newMatch];
    
    // Determine group based on first player of team 1
    const leftGroupMatches = updatedMatches.filter(m => {
      const player = availablePlayers.find(p => p.player_id === m.team1_player1_id);
      return player?.group === 'left';
    });
    
    const rightGroupMatches = updatedMatches.filter(m => {
      const player = availablePlayers.find(p => p.player_id === m.team1_player1_id);
      return player?.group === 'right';
    });

    const updatedPreview: SchedulePreview = {
      matches: updatedMatches,
      leftGroupMatches,
      rightGroupMatches,
      totalMatches: updatedMatches.length
    };

    console.log('Updated preview:', updatedPreview);
    setPreview(updatedPreview);
    
    toast({
      title: "Wedstrijd toegevoegd",
      description: "2v2 wedstrijd is toegevoegd aan het schema.",
    });
  };

  const removeMatch = (matchIndex: number) => {
    if (!preview) return;

    if (matchIndex < 0 || matchIndex >= preview.matches.length) {
      console.error('Invalid match index:', matchIndex);
      return;
    }

    const updatedMatches = preview.matches.filter((_, index) => index !== matchIndex);
    
    const leftGroupMatches = updatedMatches.filter(m => {
      const player = availablePlayers.find(p => p.player_id === m.team1_player1_id);
      return player?.group === 'left';
    });
    
    const rightGroupMatches = updatedMatches.filter(m => {
      const player = availablePlayers.find(p => p.player_id === m.team1_player1_id);
      return player?.group === 'right';
    });

    const updatedPreview: SchedulePreview = {
      matches: updatedMatches,
      leftGroupMatches,
      rightGroupMatches,
      totalMatches: updatedMatches.length
    };

    setPreview(updatedPreview);
    
    toast({
      title: "Wedstrijd verwijderd",
      description: "De wedstrijd is verwijderd uit het schema.",
    });
  };

  const clearPreview = () => {
    console.log('Clearing preview and available players');
    setPreview(null);
    setAvailablePlayers([]);
  };

  return {
    preview,
    availablePlayers,
    generatePreview,
    addManualMatch,
    removeMatch,
    clearPreview,
    isGenerating,
  };
};
