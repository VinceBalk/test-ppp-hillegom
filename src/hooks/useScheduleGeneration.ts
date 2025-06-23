
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
      console.log('=== GENERATING SCHEDULE ===');
      console.log('Tournament ID:', tournamentId);
      console.log('Round Number:', roundNumber);
      console.log('Preview matches:', preview?.matches?.length || 0);
      
      // If we have a preview, use those matches directly
      if (preview && preview.matches.length > 0) {
        console.log('Using preview matches for generation');
        
        const matches = preview.matches.map(match => ({
          tournament_id: tournamentId,
          team1_player1_id: match.team1_player1_id,
          team1_player2_id: match.team1_player2_id,
          team2_player1_id: match.team2_player1_id,
          team2_player2_id: match.team2_player2_id,
          court_id: match.court_id || null,
          court_number: match.court_number?.toString() || '1',
          round_number: roundNumber,
          status: 'scheduled' as const,
          team1_score: 0,
          team2_score: 0,
          notes: match.court_name ? `Baan: ${match.court_name} - Ronde ${match.round_within_group}` : undefined
        }));

        console.log('Prepared matches for database insert:', matches);

        // Sla wedstrijden op in database
        const { data: createdMatches, error: matchesError } = await supabase
          .from('matches')
          .insert(matches)
          .select(`
            *,
            tournament:tournaments(name),
            court:courts(name),
            team1_player1:players!matches_team1_player1_id_fkey(name),
            team1_player2:players!matches_team1_player2_id_fkey(name),
            team2_player1:players!matches_team2_player1_id_fkey(name),
            team2_player2:players!matches_team2_player2_id_fkey(name)
          `);

        if (matchesError) {
          console.error('=== DATABASE INSERT ERROR ===');
          console.error('Error details:', matchesError);
          throw matchesError;
        }

        console.log('=== MATCHES CREATED SUCCESSFULLY ===');
        console.log('Created matches:', createdMatches);

        // Update toernooi status en markeer de ronde als gegenereerd
        const roundKey = `round_${roundNumber}_schedule_generated`;
        const { error: tournamentError } = await supabase
          .from('tournaments')
          .update({
            [roundKey]: true,
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', tournamentId);

        if (tournamentError) {
          console.error('Error updating tournament:', tournamentError);
          throw tournamentError;
        }

        console.log('Tournament status updated successfully');

        // Mark the preview as approved in the database
        const { error: previewError } = await supabase
          .from('tournament_schedule_previews')
          .update({
            is_approved: true,
            is_locked: true,
            updated_at: new Date().toISOString()
          })
          .eq('tournament_id', tournamentId)
          .eq('round_number', roundNumber);

        if (previewError) {
          console.error('Error updating preview status:', previewError);
          // Don't throw here as the main operation succeeded
        }

        return createdMatches;
      }

      // Fallback: generate matches from scratch if no preview provided
      throw new Error('Geen preview beschikbaar. Genereer eerst een preview.');
    },
    onSuccess: (data) => {
      console.log('=== SCHEDULE GENERATION SUCCESS ===');
      console.log('Generated matches count:', data.length);
      
      // Invalidate ALL relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      
      // Force refetch matches for all tournaments
      queryClient.refetchQueries({ queryKey: ['matches'] });
      
      toast({
        title: "2v2 Schema goedgekeurd en opgeslagen",
        description: `${data.length} 2v2 wedstrijden zijn succesvol aangemaakt met baan-toewijzingen.`,
      });
    },
    onError: (error) => {
      console.error('=== SCHEDULE GENERATION ERROR ===');
      console.error('Error details:', error);
      
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
