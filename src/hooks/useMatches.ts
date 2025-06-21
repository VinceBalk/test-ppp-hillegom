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

  const { data: matches = [], isLoading, error, refetch } = useQuery({
    queryKey: ['matches', tournamentId],
    queryFn: async () => {
      console.log('=== FETCHING MATCHES ===');
      console.log('Tournament ID:', tournamentId);
      
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
        `);

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('=== MATCHES QUERY ERROR ===');
        console.error('Error details:', error);
        throw error;
      }
      
      console.log('=== MATCHES QUERY SUCCESS ===');
      console.log('Raw data from database:', data);
      console.log('Number of matches found:', data?.length || 0);
      
      // Add detailed logging for each match
      if (data && data.length > 0) {
        data.forEach((match, index) => {
          console.log(`Match ${index + 1}:`, {
            id: match.id,
            tournament_id: match.tournament_id,
            team1_player1: match.team1_player1?.name,
            team1_player2: match.team1_player2?.name,
            team2_player1: match.team2_player1?.name,
            team2_player2: match.team2_player2?.name,
            court: match.court?.name,
            court_number: match.court_number,
            status: match.status,
            created_at: match.created_at
          });
        });
      }
      
      return data as Match[];
    },
    enabled: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch to ensure fresh data
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

  const saveIndividualMatch = useMutation({
    mutationFn: async (params: {
      matchId: string;
      team1Player1Id: string;
      team1Player2Id: string;
      team2Player1Id: string;
      team2Player2Id: string;
      courtId?: string;
      courtNumber?: string;
      roundWithinGroup?: number;
    }) => {
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

  return {
    matches,
    isLoading,
    error,
    refetch,
    createMatch: createMatch.mutate,
    updateMatch: updateMatch.mutate,
    saveIndividualMatch: saveIndividualMatch.mutate,
    isCreating: createMatch.isPending,
    isUpdating: updateMatch.isPending,
    isSavingIndividual: saveIndividualMatch.isPending,
  };
};
