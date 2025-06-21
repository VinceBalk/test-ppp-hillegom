
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
  const { toast } = useToast();

  const generatePreview = async (tournamentId: string, roundNumber: number) => {
    setIsGenerating(true);
    console.log('Generating 2v2 schedule preview for tournament:', tournamentId, 'round:', roundNumber);
    
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

      if (!tournamentPlayers || tournamentPlayers.length < 4) {
        throw new Error('Er moeten minimaal 4 spelers zijn om 2v2 wedstrijden te genereren');
      }

      console.log('Found players for 2v2 preview:', tournamentPlayers);

      // Groepeer spelers per groep
      const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
      const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');

      console.log('Left players:', leftPlayers.length, 'Right players:', rightPlayers.length);

      // Genereer 2v2 wedstrijden binnen elke groep
      const allMatches: ScheduleMatch[] = [];
      const leftGroupMatches: ScheduleMatch[] = [];
      const rightGroupMatches: ScheduleMatch[] = [];
      
      // Functie om alle mogelijke team combinaties te maken
      const generateTeamCombinations = (players: any[]) => {
        const teams = [];
        for (let i = 0; i < players.length; i++) {
          for (let j = i + 1; j < players.length; j++) {
            teams.push([players[i], players[j]]);
          }
        }
        return teams;
      };

      // Functie om wedstrijden tussen teams te genereren
      const generateMatchesBetweenTeams = (teams: any[][], group: string) => {
        const matches: ScheduleMatch[] = [];
        for (let i = 0; i < teams.length; i++) {
          for (let j = i + 1; j < teams.length; j++) {
            const team1 = teams[i];
            const team2 = teams[j];
            
            const match: ScheduleMatch = {
              team1_player1_id: team1[0].player_id,
              team1_player2_id: team1[1].player_id,
              team2_player1_id: team2[0].player_id,
              team2_player2_id: team2[1].player_id,
              team1_player1_name: team1[0].player?.name || 'Onbekend',
              team1_player2_name: team1[1].player?.name || 'Onbekend',
              team2_player1_name: team2[0].player?.name || 'Onbekend',
              team2_player2_name: team2[1].player?.name || 'Onbekend',
              tournament_id: tournamentId,
              round_number: roundNumber,
            };
            
            matches.push(match);
            allMatches.push(match);
            
            if (group === 'left') {
              leftGroupMatches.push(match);
            } else {
              rightGroupMatches.push(match);
            }
          }
        }
        return matches;
      };

      // Wedstrijden binnen links groep
      if (leftPlayers.length >= 4) {
        const leftTeams = generateTeamCombinations(leftPlayers);
        generateMatchesBetweenTeams(leftTeams, 'left');
      }

      // Wedstrijden binnen rechts groep  
      if (rightPlayers.length >= 4) {
        const rightTeams = generateTeamCombinations(rightPlayers);
        generateMatchesBetweenTeams(rightTeams, 'right');
      }

      console.log('Generated 2v2 preview matches:', allMatches.length);

      if (allMatches.length === 0) {
        throw new Error('Geen 2v2 wedstrijden gegenereerd - controleer of elke groep minimaal 4 spelers heeft');
      }

      const schedulePreview: SchedulePreview = {
        matches: allMatches,
        leftGroupMatches,
        rightGroupMatches,
        totalMatches: allMatches.length
      };

      setPreview(schedulePreview);
      return schedulePreview;

    } catch (error) {
      console.error('Error generating 2v2 schedule preview:', error);
      toast({
        title: "Fout",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het genereren van het 2v2 schema preview.",
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
