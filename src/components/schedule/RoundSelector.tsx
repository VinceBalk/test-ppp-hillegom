
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface RoundSelectorProps {
  selectedRound: number;
  onRoundChange: (round: number) => void;
}

export default function RoundSelector({ selectedRound, onRoundChange }: RoundSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Ronde Selectie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {[1, 2, 3].map((round) => (
            <Button
              key={round}
              variant={selectedRound === round ? "default" : "outline"}
              onClick={() => onRoundChange(round)}
            >
              Ronde {round}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
