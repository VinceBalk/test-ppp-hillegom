
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

interface MatchesRoundFilterProps {
  availableRounds: number[];
  selectedRound: string;
  onRoundChange: (round: string) => void;
}

export default function MatchesRoundFilter({
  availableRounds,
  selectedRound,
  onRoundChange,
}: MatchesRoundFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter op Ronde
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedRound === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRoundChange('all')}
          >
            Alle rondes
          </Button>
          {availableRounds.map((round) => (
            <Button
              key={round}
              variant={selectedRound === round.toString() ? 'default' : 'outline'}
              size="sm"
              onClick={() => onRoundChange(round.toString())}
            >
              Ronde {round}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
