
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayerMatches } from '@/hooks/usePlayerMatches';
import { useTournaments } from '@/hooks/useTournaments';
import PlayerMatchesFilters from './PlayerMatchesFilters';
import PlayerMatchesList from './PlayerMatchesList';

interface PlayerMatchesProps {
  playerId: string;
  playerName: string;
}

export default function PlayerMatches({ playerId, playerName }: PlayerMatchesProps) {
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

  if (isLoading) return <p>Bezig met laden...</p>;
  if (error) return <p>Fout bij laden van wedstrijden.</p>;
  if (!matches || matches.length === 0) return <p>Geen wedstrijden gevonden.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wedstrijden van {playerName}</CardTitle>
        
        <PlayerMatchesFilters
          selectedTournamentId={selectedTournamentId}
          selectedRound={selectedRound}
          onTournamentChange={setSelectedTournamentId}
          onRoundChange={setSelectedRound}
          playerTournaments={playerTournaments}
          allAvailableRounds={allAvailableRounds}
        />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <PlayerMatchesList matches={filteredMatches} playerId={playerId} />
      </CardContent>
    </Card>
  );
}
