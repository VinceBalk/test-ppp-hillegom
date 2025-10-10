
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  max_players?: number;
  entry_fee?: number;
  status?: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  is_simulation?: boolean;
  current_round?: number;
  total_rounds?: number;
  round_1_generated?: boolean;
  round_2_generated?: boolean;
  round_3_generated?: boolean;
  round_1_schedule_generated?: boolean;
  round_2_schedule_generated?: boolean;
  round_3_schedule_generated?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export const useTournaments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tournaments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      console.log('=== FETCHING TOURNAMENTS ===');
      
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('=== TOURNAMENTS QUERY ERROR ===');
        console.error('Error details:', error);
        throw error;
      }
      
      console.log('=== TOURNAMENTS QUERY SUCCESS ===');
      console.log('Raw data from database:', data);
      console.log('Number of tournaments found:', data?.length || 0);
      
      return data as Tournament[];
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createTournament = useMutation({
    mutationFn: async (tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      console.log('=== CREATING TOURNAMENT ===');
      console.log('Tournament data:', tournament);
      
      const { data, error } = await supabase
        .from('tournaments')
        .insert([tournament])
        .select()
        .single();
      
      if (error) {
        console.error('=== CREATE TOURNAMENT ERROR ===');
        console.error('Error details:', error);
        throw error;
      }
      
      console.log('=== TOURNAMENT CREATED ===');
      console.log('Created tournament:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({
        title: "Toernooi toegevoegd",
        description: "Het toernooi is succesvol toegevoegd.",
      });
    },
    onError: (error) => {
      console.error('Error creating tournament:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van het toernooi.",
        variant: "destructive",
      });
    },
  });

  const updateTournament = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tournament> & { id: string }) => {
      console.log('=== UPDATING TOURNAMENT ===');
      console.log('Tournament ID:', id);
      console.log('Updates:', updates);
      
      const { data, error } = await supabase
        .from('tournaments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('=== UPDATE TOURNAMENT ERROR ===');
        console.error('Error details:', error);
        throw error;
      }
      
      console.log('=== TOURNAMENT UPDATED ===');
      console.log('Updated tournament:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({
        title: "Toernooi bijgewerkt",
        description: "Het toernooi is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      console.error('Error updating tournament:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van het toernooi.",
        variant: "destructive",
      });
    },
  });

  const deleteTournament = useMutation({
    mutationFn: async (id: string) => {
      console.log('=== DELETING TOURNAMENT ===');
      console.log('Tournament ID:', id);
      
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('=== DELETE TOURNAMENT ERROR ===');
        console.error('Error details:', error);
        throw error;
      }
      
      console.log('=== TOURNAMENT DELETED ===');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({
        title: "Toernooi verwijderd",
        description: "Het toernooi is succesvol verwijderd.",
      });
    },
    onError: (error) => {
      console.error('Error deleting tournament:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van het toernooi.",
        variant: "destructive",
      });
    },
  });

  return {
    tournaments,
    isLoading,
    error,
    refetch,
    createTournament: createTournament.mutate,
    updateTournament: updateTournament.mutate,
    deleteTournament: deleteTournament.mutate,
    isCreating: createTournament.isPending,
    isUpdating: updateTournament.isPending,
    isDeleting: deleteTournament.isPending,
  };
};
