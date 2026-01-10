import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlayerRanking {
  player_id: string;
  name: string;
  row_side: "left" | "right";
  tournaments_played: number;
  total_points: number;
  avg_position: number;
  total_games_won: number;
  total_specials: number;
}

export function usePlayerRankings(
  tournamentId?: string,
  rowSide?: "left" | "right"
) {
  return useQuery({
    queryKey: ["player-rankings", tournamentId, rowSide],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_player_rankings", {
        p_tournament_id: tournamentId || null,
        p_row_side: rowSide || null,
      });

      if (error) throw error;
      return data as PlayerRanking[];
    },
  });
}
