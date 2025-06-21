
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
  current_round?: number;
  total_rounds?: number;
  round_1_generated?: boolean;
  round_2_generated?: boolean;
  round_3_generated?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export const useTournaments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tournaments = [], isLoading, error } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as Tournament[];
    },
  });

  const createTournament = useMutation({
    mutationFn: async (tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('tournaments')
        .insert([tournament])
        .select()
        .single();
      
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('tournaments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
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
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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
    createTournament: createTournament.mutate,
    updateTournament: updateTournament.mutate,
    deleteTournament: deleteTournament.mutate,
    isCreating: createTournament.isPending,
    isUpdating: updateTournament.isPending,
    isDeleting: deleteTournament.isPending,
  };
};
