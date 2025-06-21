
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SchedulePreview } from './useSchedulePreview';

export interface GenerateScheduleParams {
  tournamentId: string;
  roundNumber: number;
  preview?: SchedulePreview;
}

export const useScheduleGeneration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateSchedule = useMutation({
    mutationFn: async ({ tournamentId, roundNumber, preview }: GenerateScheduleParams) => {
      console.log('Generating and saving 2v2 schedule for tournament:', tournamentId, 'round:', roundNumber);
      
      // If we have a preview, use those matches directly
      if (preview && preview.matches.length > 0) {
        console.log('Using 2v2 preview matches:', preview.matches);
        
        const matches = preview.matches.map(match => ({
          tournament_id: tournamentId,
          team1_player1_id: match.team1_player1_id,
          team1_player2_id: match.team1_player2_id,
          team2_player1_id: match.team2_player1_id,
          team2_player2_id: match.team2_player2_id,
          court_number: match.court_number?.toString() || '1',
          round_number: roundNumber,
          status: 'scheduled' as const,
          team1_score: 0,
          team2_score: 0,
          notes: match.court_name ? `Baan: ${match.court_name} - Ronde ${match.round_within_group}` : undefined
        }));

        console.log('Prepared 2v2 matches for insert:', matches);

        // Sla wedstrijden op in database
        const { data: createdMatches, error: matchesError } = await supabase
          .from('matches')
          .insert(matches)
          .select(`
            *,
            tournament:tournaments(name),
            team1_player1:players!matches_team1_player1_id_fkey(name),
            team1_player2:players!matches_team1_player2_id_fkey(name),
            team2_player1:players!matches_team2_player1_id_fkey(name),
            team2_player2:players!matches_team2_player2_id_fkey(name)
          `);

        if (matchesError) {
          console.error('Error creating 2v2 matches:', matchesError);
          throw matchesError;
        }

        console.log('Created 2v2 matches:', createdMatches);

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
      }

      // Fallback: generate matches from scratch if no preview provided
      throw new Error('Geen preview beschikbaar. Genereer eerst een preview.');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({
        title: "2v2 Schema goedgekeurd en opgeslagen",
        description: `${data.length} 2v2 wedstrijden zijn succesvol aangemaakt met baan-toewijzingen.`,
      });
    },
    onError: (error) => {
      console.error('Error generating 2v2 schedule:', error);
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het genereren van het 2v2 schema.",
        variant: "destructive",
      });
    },
  });

  return {
    generateSchedule: generateSchedule.mutate,
    isGenerating: generateSchedule.isPending,
  };
};
