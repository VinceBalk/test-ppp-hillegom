import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { ScheduleMatch } from '@/types/schedule';

interface MatchEditorViewProps {
  match: ScheduleMatch;
  onEdit: () => void;
}

export default function MatchEditorView({ match, onEdit }: MatchEditorViewProps) {
  return (
    <div className="p-3 border rounded-lg bg-muted/30 relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={onEdit}
      >
        <Edit className="h-3 w-3" />
      </Button>
      
      <div className="font-medium text-center">
        <div className="text-blue-600">
          {match.team1_player1_name} & {match.team1_player2_name}
        </div>
        <div className="text-sm text-muted-foreground my-1">vs</div>
        <div className="text-red-600">
          {match.team2_player1_name} & {match.team2_player2_name}
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground text-center mt-2">
        <div>{match.court_name}</div>
        <div>Ronde {match.round_within_group}</div>
      </div>
    </div>
  );
}
