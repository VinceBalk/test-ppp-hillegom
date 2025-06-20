
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  group_side?: 'left' | 'right';
  ranking_score?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export const usePlayers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players = [], isLoading, error } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Player[];
    },
  });

  const createPlayer = useMutation({
    mutationFn: async (player: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('players')
        .insert([player])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Speler toegevoegd",
        description: "De speler is succesvol toegevoegd.",
      });
    },
    onError: (error) => {
      console.error('Error creating player:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de speler.",
        variant: "destructive",
      });
    },
  });

  const updatePlayer = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Player> & { id: string }) => {
      const { data, error } = await supabase
        .from('players')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Speler bijgewerkt",
        description: "De speler is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      console.error('Error updating player:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de speler.",
        variant: "destructive",
      });
    },
  });

  const deletePlayer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({
        title: "Speler verwijderd",
        description: "De speler is succesvol verwijderd.",
      });
    },
    onError: (error) => {
      console.error('Error deleting player:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de speler.",
        variant: "destructive",
      });
    },
  });

  return {
    players,
    isLoading,
    error,
    createPlayer: createPlayer.mutate,
    updatePlayer: updatePlayer.mutate,
    deletePlayer: deletePlayer.mutate,
    isCreating: createPlayer.isPending,
    isUpdating: updatePlayer.isPending,
    isDeleting: deletePlayer.isPending,
  };
};
