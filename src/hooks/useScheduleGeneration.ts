// src/hooks/useScheduleGeneration.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SchedulePreview } from '@/types/schedule';

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
      
      if (preview && preview.matches.length > 0) {
        console.log('Using preview matches for generation');
        
        const matches = preview.matches.map(match => {
          // PRIMAIR: gebruik tournament_round (gezet door useSchedulePreview)
          // FALLBACK: ID-detectie voor backwards compatibility
          const tr = (match as any).tournament_round;
          let matchRoundNumber: number;
          
          if (tr === 1 || tr === 2) {
            matchRoundNumber = tr;
          } else if (match.id.includes('-r2-')) {
            matchRoundNumber = 2;
          } else if (match.id.includes('-r1-')) {
            matchRoundNumber = 1;
          } else {
            matchRoundNumber = roundNumber;
          }
          
          console.log(`Match ${match.id}: tournament_round=${tr}, resolved round=${matchRoundNumber}`);
          
          return {
            tournament_id: tournamentId,
            team1_player1_id: match.team1_player1_id,
            team1_player2_id: match.team1_player2_id,
            team2_player1_id: match.team2_player1_id,
            team2_player2_id: match.team2_player2_id,
            match_number: match.match_number,
            court_id: match.court_id || null,
            court_number: match.court_number?.toString() || '1',
            round_number: matchRoundNumber,
            status: 'scheduled' as const,
            team1_score: 0,
            team2_score: 0,
            notes: match.court_name ? `Baan: ${match.court_name}` : undefined
          };
        });

        const r1Count = matches.filter(m => m.round_number === 1).length;
        const r2Count = matches.filter(m => m.round_number === 2).length;
        console.log('Prepared matches for database insert:', matches.length);
        console.log('R1 matches:', r1Count);
        console.log('R2 matches:', r2Count);

        if (r1Count !== 12 || r2Count !== 12) {
          console.error(`WRONG SPLIT: R1=${r1Count}, R2=${r2Count} (expected 12+12)`);
          // Log alle match IDs en hun tournament_round voor debugging
          preview.matches.forEach(m => {
            console.log(`  ID: ${m.id}, tournament_round: ${(m as any).tournament_round}`);
          });
        }

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
        console.log('Created matches:', createdMatches?.length);

        // Update toernooi status - markeer BEIDE rondes als gegenereerd
        const { error: tournamentError } = await supabase
          .from('tournaments')
          .update({
            round_1_schedule_generated: true,
            round_2_schedule_generated: true,
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
        }

        return createdMatches;
      }

      throw new Error('Geen preview beschikbaar. Genereer eerst een preview.');
    },
    onSuccess: (data) => {
      console.log('=== SCHEDULE GENERATION SUCCESS ===');
      console.log('Generated matches count:', data?.length);
      
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.refetchQueries({ queryKey: ['matches'] });
      
      toast({
        title: "Schema goedgekeurd en opgeslagen",
        description: `${data?.length} wedstrijden zijn succesvol aangemaakt (R1 + R2).`,
      });
    },
    onError: (error) => {
      console.error('=== SCHEDULE GENERATION ERROR ===');
      console.error('Error details:', error);
      
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
