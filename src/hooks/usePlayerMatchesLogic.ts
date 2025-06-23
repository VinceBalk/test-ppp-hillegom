
import { useState } from 'react';
import { usePlayerMatches } from './usePlayerMatches';
import { useTournaments } from './useTournaments';

export const usePlayerMatchesLogic = (playerId: string) => {
  const { matches, isLoading, error } = usePlayerMatches(playerId);
  const { tournaments } = useTournaments();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const [selectedRound, setSelectedRound] = useState<string>('all');

  // Get all unique rounds from ALL matches (not filtered)
  const allAvailableRounds = [...new Set(matches?.map(match => match.round_number) || [])].sort();

  // Filter matches based on selected tournament and round
  const filteredMatches = matches?.filter(match => {
    const tournamentFilter = selectedTournamentId === 'all' || match.tournament_id === selectedTournamentId;
    const roundFilter = selectedRound === 'all' || match.round_number === parseInt(selectedRound);
    return tournamentFilter && roundFilter;
  }) || [];

  // Get unique tournaments from player's matches
  const playerTournaments = tournaments?.filter(tournament => 
    matches?.some(match => match.tournament_id === tournament.id)
  ) || [];

  return {
    matches,
    isLoading,
    error,
    selectedTournamentId,
    selectedRound,
    setSelectedTournamentId,
    setSelectedRound,
    allAvailableRounds,
    filteredMatches,
    playerTournaments,
  };
};
