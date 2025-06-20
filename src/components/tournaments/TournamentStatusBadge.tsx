
import { Badge } from '@/components/ui/badge';

interface TournamentStatusBadgeProps {
  status?: string;
}

export function TournamentStatusBadge({ status }: TournamentStatusBadgeProps) {
  const variants = {
    draft: 'secondary',
    open: 'default',
    in_progress: 'default',
    completed: 'outline',
    cancelled: 'destructive'
  } as const;
  
  const labels = {
    draft: 'Concept',
    open: 'Open',
    in_progress: 'Bezig',
    completed: 'Voltooid',
    cancelled: 'Geannuleerd'
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
      {labels[status as keyof typeof labels] || status}
    </Badge>
  );
}
