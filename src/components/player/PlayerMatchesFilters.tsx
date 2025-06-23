
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Tournament {
  id: string;
  name: string;
}

interface PlayerMatchesFiltersProps {
  selectedTournamentId: string;
  selectedRound: string;
  onTournamentChange: (value: string) => void;
  onRoundChange: (value: string) => void;
  playerTournaments: Tournament[];
  allAvailableRounds: number[];
}

export default function PlayerMatchesFilters({
  selectedTournamentId,
  selectedRound,
  onTournamentChange,
  onRoundChange,
  playerTournaments,
  allAvailableRounds,
}: PlayerMatchesFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <Label className="text-sm font-medium">Toernooi</Label>
        <Select value={selectedTournamentId} onValueChange={onTournamentChange}>
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
        <Select value={selectedRound} onValueChange={onRoundChange}>
          <SelectTrigger>
            <SelectValue placeholder="Alle rondes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle rondes</SelectItem>
            {allAvailableRounds.map(round => (
              <SelectItem key={round} value={round.toString()}>
                Ronde {round}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
