
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TournamentPlayer {
  id: string;
  tournament_id: string;
  player_id: string;
  group: 'left' | 'right';
  active: boolean;
  registration_date: string;
  player: {
    id: string;
    name: string;
    email?: string;
  };
}

export const useTournamentPlayers = (tournamentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tournamentPlayers = [], isLoading, error } = useQuery({
    queryKey: ['tournament-players', tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from('tournament_players')
        .select(`
          *,
          player:players(id, name, email)
        `)
        .eq('tournament_id', tournamentId)
        .eq('active', true)
        .order('registration_date');
      
      if (error) throw error;
      return data as TournamentPlayer[];
    },
    enabled: !!tournamentId,
  });

  const addPlayer = useMutation({
    mutationFn: async (playerData: { playerId: string; tournamentId: string; group: 'left' | 'right' }) => {
      const { data, error } = await supabase
        .from('tournament_players')
        .insert([{
          tournament_id: playerData.tournamentId,
          player_id: playerData.playerId,
          group: playerData.group,
          active: true
        }])
        .select(`
          *,
          player:players(id, name, email)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-players', tournamentId] });
      toast({
        title: "Speler toegevoegd",
        description: "De speler is succesvol toegevoegd aan het toernooi.",
      });
    },
    onError: (error) => {
      console.error('Error adding player to tournament:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de speler.",
        variant: "destructive",
      });
    },
  });

  const removePlayer = useMutation({
    mutationFn: async (tournamentPlayerId: string) => {
      const { error } = await supabase
        .from('tournament_players')
        .delete()
        .eq('id', tournamentPlayerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-players', tournamentId] });
      toast({
        title: "Speler verwijderd",
        description: "De speler is succesvol verwijderd uit het toernooi.",
      });
    },
    onError: (error) => {
      console.error('Error removing player from tournament:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de speler.",
        variant: "destructive",
      });
    },
  });

  const updatePlayerGroup = useMutation({
    mutationFn: async ({ tournamentPlayerId, group }: { tournamentPlayerId: string; group: 'left' | 'right' }) => {
      const { data, error } = await supabase
        .from('tournament_players')
        .update({ group })
        .eq('id', tournamentPlayerId)
        .select(`
          *,
          player:players(id, name, email)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-players', tournamentId] });
      toast({
        title: "Groep bijgewerkt",
        description: "De spelersgroep is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      console.error('Error updating player group:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de groep.",
        variant: "destructive",
      });
    },
  });

  return {
    tournamentPlayers,
    isLoading,
    error,
    addPlayer: addPlayer.mutate,
    removePlayer: removePlayer.mutate,
    updatePlayerGroup: updatePlayerGroup.mutate,
    isAddingPlayer: addPlayer.isPending,
    isRemovingPlayer: removePlayer.isPending,
    isUpdatingGroup: updatePlayerGroup.isPending,
  };
};
