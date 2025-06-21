
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GenerateScheduleParams {
  tournamentId: string;
  roundNumber: number;
}

export const useScheduleGeneration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateSchedule = useMutation({
    mutationFn: async ({ tournamentId, roundNumber }: GenerateScheduleParams) => {
      console.log('Generating and saving schedule for tournament:', tournamentId, 'round:', roundNumber);
      
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

      console.log('Found players:', tournamentPlayers);

      // Groepeer spelers per groep
      const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
      const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');

      console.log('Left players:', leftPlayers.length, 'Right players:', rightPlayers.length);

      // Genereer wedstrijden binnen elke groep
      const matches = [];
      
      // Wedstrijden binnen links groep
      for (let i = 0; i < leftPlayers.length; i++) {
        for (let j = i + 1; j < leftPlayers.length; j++) {
          matches.push({
            tournament_id: tournamentId,
            player1_id: leftPlayers[i].player_id,
            player2_id: leftPlayers[j].player_id,
            round_number: roundNumber,
            status: 'scheduled',
            player1_score: 0,
            player2_score: 0
          });
        }
      }

      // Wedstrijden binnen rechts groep
      for (let i = 0; i < rightPlayers.length; i++) {
        for (let j = i + 1; j < rightPlayers.length; j++) {
          matches.push({
            tournament_id: tournamentId,
            player1_id: rightPlayers[i].player_id,
            player2_id: rightPlayers[j].player_id,
            round_number: roundNumber,
            status: 'scheduled',
            player1_score: 0,
            player2_score: 0
          });
        }
      }

      console.log('Generated matches:', matches.length);

      if (matches.length === 0) {
        throw new Error('Geen wedstrijden gegenereerd - controleer of spelers correct zijn toegewezen aan groepen');
      }

      // Sla wedstrijden op in database
      const { data: createdMatches, error: matchesError } = await supabase
        .from('matches')
        .insert(matches)
        .select();

      if (matchesError) {
        console.error('Error creating matches:', matchesError);
        throw matchesError;
      }

      console.log('Created matches:', createdMatches);

      // Update toernooi status
      const { error: tournamentError } = await supabase
        .from('tournaments')
        .update({
          [`round_${roundNumber}_generated`]: true,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (tournamentError) {
        console.error('Error updating tournament:', tournamentError);
        throw tournamentError;
      }

      return createdMatches;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({
        title: "Schema goedgekeurd en opgeslagen",
        description: `${data.length} wedstrijden zijn succesvol aangemaakt.`,
      });
    },
    onError: (error) => {
      console.error('Error generating schedule:', error);
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het genereren van het schema.",
        variant: "destructive",
      });
    },
  });

  return {
    generateSchedule: generateSchedule.mutate,
    isGenerating: generateSchedule.isPending,
  };
};
