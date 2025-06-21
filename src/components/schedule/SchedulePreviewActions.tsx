
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface SchedulePreviewActionsProps {
  onApprove: () => void;
  onReject: () => void;
  isApproving?: boolean;
}

export default function SchedulePreviewActions({
  onApprove,
  onReject,
  isApproving = false
}: SchedulePreviewActionsProps) {
  return (
    <div className="flex gap-4 mb-6">
      <Button 
        onClick={onApprove} 
        disabled={isApproving}
        className="flex items-center gap-2"
      >
        <Check className="h-4 w-4" />
        {isApproving ? 'Schema Goedkeuren...' : 'Schema Goedkeuren'}
      </Button>
      <Button 
        variant="outline" 
        onClick={onReject}
        disabled={isApproving}
        className="flex items-center gap-2"
      >
        <X className="h-4 w-4" />
        Annuleren
      </Button>
    </div>
  );
}
