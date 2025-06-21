
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface RoundInputProps {
  round: number;
  onRoundChange: (round: number) => void;
}

export default function RoundInput({ round, onRoundChange }: RoundInputProps) {
  return (
    <div>
      <Label className="text-xs">Ronde binnen groep</Label>
      <Input
        type="number"
        min="1"
        max="3"
        value={round}
        onChange={(e) => onRoundChange(parseInt(e.target.value) || 1)}
        className="h-7 text-xs"
      />
    </div>
  );
}
