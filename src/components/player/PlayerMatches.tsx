
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin } from 'lucide-react';
import { usePlayerMatches } from '@/hooks/usePlayerMatches';
import { useTournaments } from '@/hooks/useTournaments';
import { Match } from '@/hooks/useMatches';

interface PlayerMatchesProps {
  playerId: string;
  playerName: string;
}

export default function PlayerMatches({ playerId, playerName }: PlayerMatchesProps) {
  const { matches, isLoading, error } = usePlayerMatches(playerId);
  const { tournaments } = useTournaments();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const [selectedRound, setSelectedRound] = useState<string>('all');

  const getMatchType = (match: Match) => {
    if (match.team1_player1 && match.team2_player1) return '2v2';
    if (match.player1 && match.player2) return '1v1';
    return 'Onbekend';
  };

  const getOpponentNames = (match: Match, playerId: string) => {
    if (match.team1_player1 && match.team2_player1) {
      const isInTeam1 = match.team1_player1_id === playerId || match.team1_player2_id === playerId;
      if (isInTeam1) {
        return match.team2_player2
          ? `${match.team2_player1.name} & ${match.team2_player2.name}`
          : match.team2_player1.name;
      } else {
        return match.team1_player2
          ? `${match.team1_player1.name} & ${match.team1_player2.name}`
          : match.team1_player1.name;
      }
    }

    if (match.player1 && match.player2) {
      return match.player1_id === playerId ? match.player2.name : match.player1.name;
    }

    return 'Onbekend';
  };

  const getPartnerName = (match: Match, playerId: string) => {
    if (match.team1_player1 && match.team2_player1) {
      if (match.team1_player1_id === playerId) return match.team1_player2?.name ?? 'geen';
      if (match.team1_player2_id === playerId) return match.team1_player1?.name ?? 'geen';
      if (match.team2_player1_id === playerId) return match.team2_player2?.name ?? 'geen';
      if (match.team2_player2_id === playerId) return match.team2_player1?.name ?? 'geen';
    }
    return null;
  };

  // Filter matches based on selected tournament and round
  const filteredMatches = matches?.filter(match => {
    const tournamentFilter = selectedTournamentId === 'all' || match.tournament_id === selectedTournamentId;
    const roundFilter = selectedRound === 'all' || match.round_number === parseInt(selectedRound);
    return tournamentFilter && roundFilter;
  }) || [];

  // Group matches by round
  const matchesByRound = filteredMatches.reduce((groups, match) => {
    const round = match.round_number;
    if (!groups[round]) {
      groups[round] = [];
    }
    groups[round].push(match);
    return groups;
  }, {} as Record<number, Match[]>);

  // Get unique tournaments from player's matches
  const playerTournaments = tournaments?.filter(tournament => 
    matches?.some(match => match.tournament_id === tournament.id)
  ) || [];

  // Get unique rounds from filtered matches
  const availableRounds = [...new Set(filteredMatches.map(match => match.round_number))].sort();

  if (isLoading) return <p>Bezig met laden...</p>;
  if (error) return <p>Fout bij laden van wedstrijden.</p>;
  if (!matches || matches.length === 0) return <p>Geen wedstrijden gevonden.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wedstrijden van {playerName}</CardTitle>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-sm font-medium">Toernooi</Label>
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger>
                <SelectValue placeholder="Alle toernooien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle toernooien</SelectItem>
                {playerTournaments.map(tournament => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Ronde</Label>
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger>
                <SelectValue placeholder="Alle rondes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle rondes</SelectItem>
                {availableRounds.map(round => (
                  <SelectItem key={round} value={round.toString()}>
                    Ronde {round}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {filteredMatches.length === 0 ? (
          <p className="text-muted-foreground">Geen wedstrijden gevonden voor de geselecteerde filters.</p>
        ) : (
          Object.keys(matchesByRound)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(roundKey => {
              const round = parseInt(roundKey);
              const roundMatches = matchesByRound[round];
              
              return (
                <div key={round} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Ronde {round}</h3>
                    <Badge variant="outline">{roundMatches.length} wedstrijd{roundMatches.length !== 1 ? 'en' : ''}</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {roundMatches.map((match) => {
                      const opponents = getOpponentNames(match, playerId);
                      const partner = getPartnerName(match, playerId);
                      const type = getMatchType(match);

                      return (
                        <div key={match.id} className="border p-4 rounded-lg shadow-sm bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-muted-foreground">
                              <Calendar className="inline w-4 h-4 mr-1" />
                              {match.tournament?.name} — {type}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Ronde {match.round_number}
                            </Badge>
                          </div>

                          {partner && (
                            <div className="text-sm mb-1">
                              <span className="font-medium">Met:</span> {partner}
                            </div>
                          )}

                          <div className="text-sm">
                            <span className="font-medium">Tegen:</span> {opponents}
                          </div>

                          {match.court?.name && (
                            <div className="text-xs text-gray-500 mt-1">
                              <MapPin className="inline w-3 h-3 mr-1" />
                              Baan: {match.court.name}
                            </div>
                          )}

                          {match.status === 'completed' && (
                            <div className="text-xs mt-2 p-2 bg-green-50 rounded">
                              <span className="font-medium">Uitslag: </span>
                              {match.team1_player1 && match.team2_player1
                                ? (match.team1_score !== undefined && match.team2_score !== undefined
                                  ? `${match.team1_score} - ${match.team2_score}`
                                  : 'Geen score')
                                : (match.player1_score !== undefined && match.player2_score !== undefined
                                  ? `${match.player1_score} - ${match.player2_score}`
                                  : 'Geen score')
                              }
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
        )}
      </CardContent>
    </Card>
  );
}
