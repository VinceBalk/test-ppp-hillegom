
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateMatchNumbersParams {
  tournamentId: string;
  roundNumber: number;
  matchIds: string[];
  matchNumbers: number[];
}

export const useMatchNumberUpdate = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tournamentId, roundNumber, matchIds, matchNumbers }: UpdateMatchNumbersParams) => {
      console.log('Updating match numbers:', { tournamentId, roundNumber, matchIds, matchNumbers });
      
      const { data, error } = await supabase.rpc('update_match_numbers', {
        p_tournament_id: tournamentId,
        p_round_number: roundNumber,
        p_match_ids: matchIds,
        p_match_numbers: matchNumbers
      });
      
      if (error) {
        console.error('Error updating match numbers:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Wedstrijdnummers bijgewerkt",
        description: "De wedstrijdnummers zijn succesvol aangepast.",
      });
    },
    onError: (error) => {
      console.error('Error updating match numbers:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de wedstrijdnummers.",
        variant: "destructive",
      });
    },
  });
};
