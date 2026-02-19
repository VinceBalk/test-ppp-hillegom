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
    ranking_score?: number;
    total_specials?: number;
    total_tournaments?: number;
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
          player:players(id, name, email, ranking_score, total_specials, total_tournaments)
        `)
        .eq('tournament_id', tournamentId)
        .eq('active', true);

      if (error) throw error;

      // Sorteer per groep op:
      // 1. ranking_score DESC (hoger = beter)
      // 2. total_specials DESC (meer specials = hoger bij gelijke score)
      // 3. total_tournaments ASC (minder toernooien = hoger bij nog steeds gelijk)
      const sortedData = (data as TournamentPlayer[]).sort((a, b) => {
        if (a.group !== b.group) {
          return a.group === 'left' ? -1 : 1;
        }

        const rankA = a.player?.ranking_score    ?? 0;
        const rankB = b.player?.ranking_score    ?? 0;
        if (rankB !== rankA) return rankB - rankA;

        const specsA = a.player?.total_specials   ?? 0;
        const specsB = b.player?.total_specials   ?? 0;
        if (specsB !== specsA) return specsB - specsA;

        const tournsA = a.player?.total_tournaments ?? 0;
        const tournsB = b.player?.total_tournaments ?? 0;
        return tournsA - tournsB; // minder toernooien = hoger
      });

      return sortedData;
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
          player:players(id, name, email, ranking_score, total_specials, total_tournaments)
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
        description: "De speler is verwijderd uit het toernooi.",
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
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-players', tournamentId] });
      toast({
        title: "Groep bijgewerkt",
        description: "De speler is verplaatst naar de andere groep.",
      });
    },
    onError: (error) => {
      console.error('Error updating player group:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het wijzigen van de groep.",
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
  };
};
