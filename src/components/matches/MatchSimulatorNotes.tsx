
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MatchSimulatorNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export default function MatchSimulatorNotes({ notes, onNotesChange }: MatchSimulatorNotesProps) {
  return (
    <div>
      <Label>Opmerkingen</Label>
      <Textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Bijzonderheden, opmerkingen..."
        className="mt-1"
        rows={3}
      />
    </div>
  );
}
