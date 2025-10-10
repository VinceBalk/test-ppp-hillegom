
import { Badge } from '@/components/ui/badge';
import { Match } from '@/hooks/useMatches';
import { groupMatchesByRound } from '@/utils/playerMatchUtils';
import PlayerMatchCard from './PlayerMatchCard';

interface PlayerMatchesListProps {
  matches: Match[];
  playerId: string;
}

export default function PlayerMatchesList({ matches, playerId }: PlayerMatchesListProps) {
  const matchesByRound = groupMatchesByRound(matches);

  if (matches.length === 0) {
    return (
      <p className="text-muted-foreground">Geen wedstrijden gevonden voor de geselecteerde filters.</p>
    );
  }

  return (
    <div className="space-y-6">
      {Object.keys(matchesByRound)
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
                {roundMatches
                  .sort((a, b) => (a.match_number || 0) - (b.match_number || 0))
                  .map((match) => (
                    <PlayerMatchCard 
                      key={match.id} 
                      match={match} 
                      playerId={playerId}
                    />
                  ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
