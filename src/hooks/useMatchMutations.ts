
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Match } from './useMatches';

export const useMatchMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMatch = useMutation({
    mutationFn: async (match: Omit<Match, 'id' | 'created_at' | 'updated_at' | 'tournament' | 'player1' | 'player2' | 'team1_player1' | 'team1_player2' | 'team2_player1' | 'team2_player2' | 'court'>) => {
      const { data, error } = await supabase
        .from('matches')
        .insert([match])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Wedstrijd toegevoegd",
        description: "De wedstrijd is succesvol toegevoegd.",
      });
    },
    onError: (error) => {
      console.error('Error creating match:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de wedstrijd.",
        variant: "destructive",
      });
    },
  });

  const updateMatch = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Match> & { id: string }) => {
      const { data, error } = await supabase
        .from('matches')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({
        title: "Wedstrijd bijgewerkt",
        description: "De wedstrijd is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      console.error('Error updating match:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de wedstrijd.",
        variant: "destructive",
      });
    },
  });

  return {
    createMatch: createMatch.mutate,
    updateMatch: updateMatch.mutate,
    isCreating: createMatch.isPending,
    isUpdating: updateMatch.isPending,
  };
};
