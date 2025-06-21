import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Match {
  id: string;
  tournament_id: string;
  player1_id?: string;
  player2_id?: string;
  team1_player1_id?: string;
  team1_player2_id?: string;
  team2_player1_id?: string;
  team2_player2_id?: string;
  court_id?: string;
  court_number?: string;
  match_date?: string;
  round_number: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  team1_score?: number;
  team2_score?: number;
  player1_score?: number;
  player2_score?: number;
  winner_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  tournament?: {
    name: string;
  };
  player1?: {
    name: string;
  };
  player2?: {
    name: string;
  };
  team1_player1?: {
    name: string;
  };
  team1_player2?: {
    name: string;
  };
  team2_player1?: {
    name: string;
  };
  team2_player2?: {
    name: string;
  };
  court?: {
    name: string;
  };
}

export const useMatches = (tournamentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading, error } = useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: async () => {
      let query = supabase
        .from('matches')
        .select(`
          *,
          tournament:tournaments(name),
          player1:players!matches_player1_id_fkey(name),
          player2:players!matches_player2_id_fkey(name),
          team1_player1:players!matches_team1_player1_id_fkey(name),
          team1_player2:players!matches_team1_player2_id_fkey(name),
          team2_player1:players!matches_team2_player1_id_fkey(name),
          team2_player2:players!matches_team2_player2_id_fkey(name),
          court:courts(name)
        `)
        .order('match_date', { ascending: true });

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Match[];
    },
    enabled: !!tournamentId || tournamentId === undefined,
  });

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
    matches,
    isLoading,
    error,
    createMatch: createMatch.mutate,
    updateMatch: updateMatch.mutate,
    isCreating: createMatch.isPending,
    isUpdating: updateMatch.isPending,
  };
};
