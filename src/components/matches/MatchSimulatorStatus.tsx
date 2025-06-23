
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface MatchSimulatorStatusProps {
  status: 'scheduled' | 'in_progress' | 'completed';
  onStatusChange: (status: 'scheduled' | 'in_progress' | 'completed') => void;
}

export default function MatchSimulatorStatus({ status, onStatusChange }: MatchSimulatorStatusProps) {
  return (
    <div>
      <Label>Status</Label>
      <div className="flex gap-2 mt-1">
        <Button
          variant={status === 'scheduled' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange('scheduled')}
        >
          Gepland
        </Button>
        <Button
          variant={status === 'in_progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange('in_progress')}
        >
          Bezig
        </Button>
        <Button
          variant={status === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange('completed')}
        >
          Voltooid
        </Button>
      </div>
    </div>
  );
}
