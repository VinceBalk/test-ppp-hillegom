
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SaveIndividualMatchParams {
  matchId: string;
  team1Player1Id: string;
  team1Player2Id: string;
  team2Player1Id: string;
  team2Player2Id: string;
  courtId?: string;
  courtNumber?: string;
  roundWithinGroup?: number;
}

export const useIndividualMatchSaveMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveIndividualMatchParams) => {
      console.log('Saving individual match with params:', params);
      
      const { data, error } = await supabase.rpc('save_individual_match', {
        p_match_id: params.matchId,
        p_team1_player1_id: params.team1Player1Id,
        p_team1_player2_id: params.team1Player2Id,
        p_team2_player1_id: params.team2Player1Id,
        p_team2_player2_id: params.team2Player2Id,
        p_court_id: params.courtId || null,
        p_court_number: params.courtNumber || null,
        p_round_within_group: params.roundWithinGroup || 1
      });
      
      if (error) {
        console.error('Error saving individual match:', error);
        throw error;
      }
      
      console.log('Individual match saved successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Wedstrijd opgeslagen",
        description: "De wijzigingen aan de wedstrijd zijn succesvol opgeslagen.",
      });
    },
    onError: (error) => {
      console.error('Error saving individual match:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van de wedstrijdwijzigingen.",
        variant: "destructive",
      });
    },
  });
};
