
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CourtSelectorProps {
  courtId: string;
  courts: Array<{
    id: string;
    name: string;
  }>;
  onCourtChange: (courtId: string) => void;
}

export default function CourtSelector({ courtId, courts, onCourtChange }: CourtSelectorProps) {
  return (
    <div>
      <Label className="text-xs">Baan</Label>
      <Select value={courtId || ''} onValueChange={onCourtChange}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue placeholder="Selecteer baan..." />
        </SelectTrigger>
        <SelectContent>
          {courts.map(court => (
            <SelectItem key={court.id} value={court.id} className="text-xs">
              {court.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
