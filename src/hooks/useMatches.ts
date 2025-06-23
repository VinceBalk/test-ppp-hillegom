
import { useMatchesFetch } from './useMatchesFetch';
import { useMatchMutations } from './useMatchMutations';
import { useIndividualMatchSaveMutation } from './useIndividualMatchSaveMutation';

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
    start_date?: string;
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
  const { data: matches = [], isLoading, error, refetch } = useMatchesFetch(tournamentId);
  const matchMutations = useMatchMutations();
  const individualMatchSave = useIndividualMatchSaveMutation();

  return {
    matches,
    isLoading,
    error,
    refetch,
    createMatch: matchMutations.createMatch,
    updateMatch: matchMutations.updateMatch,
    saveIndividualMatch: individualMatchSave.mutate,
    isCreating: matchMutations.isCreating,
    isUpdating: matchMutations.isUpdating,
    isSavingIndividual: individualMatchSave.isPending,
  };
};
