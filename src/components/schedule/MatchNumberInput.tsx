import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface MatchNumberInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export default function MatchNumberInput({ value, onChange }: MatchNumberInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="match-number">Wedstrijdnummer</Label>
      <Input
        id="match-number"
        type="number"
        min="1"
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value) || 1)}
        placeholder="Wedstrijdnummer"
      />
    </div>
  );
}
