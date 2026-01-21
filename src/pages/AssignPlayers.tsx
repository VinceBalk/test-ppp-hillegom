import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { usePlayers } from '@/hooks/usePlayers';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { usePlayerRankings } from '@/hooks/usePlayerRankings';
import PlayerAddForm from '@/components/tournaments/PlayerAddForm';
import TournamentStatsCard from '@/components/tournaments/TournamentStatsCard';
import PlayerGroupTable from '@/components/tournaments/PlayerGroupTable';

export default function AssignPlayers() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { tournaments } = useTournaments();
  const { players } = usePlayers();
  const { 
    tournamentPlayers, 
    isLoading, 
    addPlayer, 
    removePlayer, 
    updatePlayerGroup,
    isAddingPlayer 
  } = useTournamentPlayers(tournamentId);

  // Fetch player rankings
  const { data: rankings } = usePlayerRankings();

  const tournament = tournaments.find(t => t.id === tournamentId);

  const availablePlayers = players.filter(player => 
    !tournamentPlayers.some(tp => tp.player_id === player.id)
  );

  const handleAddPlayer = (playerId: string, tournamentId: string, group: 'left' | 'right') => {
    addPlayer({
      playerId,
      tournamentId,
      group
    });
  };

  const handleRemovePlayer = (tournamentPlayerId: string) => {
    removePlayer(tournamentPlayerId);
  };

  const handleGroupChange = (tournamentPlayerId: string, newGroup: 'left' | 'right') => {
    updatePlayerGroup({ tournamentPlayerId, group: newGroup });
  };

  // Enrich tournament players with ranking data
  const enrichedTournamentPlayers = tournamentPlayers.map(tp => {
    const ranking = rankings?.find(r => r.player_id === tp.player_id);
    return {
      ...tp,
      avg_position: ranking?.avg_position ?? 99,
      total_games_won: ranking?.total_games_won ?? 0,
    };
  });

  // Sort players by group, then by avg_position (lowest first), then by total_games_won (highest first)
  const sortedTournamentPlayers = [...enrichedTournamentPlayers].sort((a, b) => {
    // First sort by group
    if (a.group !== b.group) {
      return a.group === 'left' ? -1 : 1;
    }
    
    // Then by avg_position (lower is better)
    if (a.avg_position !== b.avg_position) {
      return a.avg_position - b.avg_position;
    }
    
    // Finally by total_games_won (higher is better)
    return b.total_games_won - a.total_games_won;
  });

  const leftPlayers = sortedTournamentPlayers.filter(tp => tp.group === 'left');
  const rightPlayers = sortedTournamentPlayers.filter(tp => tp.group === 'right');

  if (isLoading || !tournament) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/tournaments')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar Toernooien
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spelers Toewijzen</h1>
          <p className="text-muted-foreground">
            Toernooi: {tournament.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlayerAddForm
          availablePlayers={availablePlayers}
          onAddPlayer={handleAddPlayer}
          tournamentId={tournamentId!}
          isAddingPlayer={isAddingPlayer}
        />

        <TournamentStatsCard
          tournament={tournament}
          leftPlayersCount={leftPlayers.length}
          rightPlayersCount={rightPlayers.length}
          totalPlayersCount={tournamentPlayers.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlayerGroupTable
          title="Linker rijtje"
          players={leftPlayers}
          groupName="left"
          onGroupChange={handleGroupChange}
          onRemovePlayer={handleRemovePlayer}
          emptyMessage="Nog geen spelers in het linker rijtje."
        />

        <PlayerGroupTable
          title="Rechter rijtje"
          players={rightPlayers}
          groupName="right"
          onGroupChange={handleGroupChange}
          onRemovePlayer={handleRemovePlayer}
          emptyMessage="Nog geen spelers in het rechter rijtje."
        />
      </div>
    </div>
  );
}
