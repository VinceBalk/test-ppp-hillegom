import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { ScheduleMatch } from '@/types/schedule';

interface MatchEditorViewProps {
  match: ScheduleMatch;
  onEdit: () => void;
}

export default function MatchEditorView({ match, onEdit }: MatchEditorViewProps) {
  const handleEditClick = () => {
    console.log('Edit button clicked for match', match.id);
    onEdit();
  };

  return (
    <div className="p-4 border-2 rounded-lg bg-white relative shadow-sm hover:shadow-md transition-shadow">
      {/* GROTE DUIDELIJKE EDIT BUTTON */}
      <Button
        variant="default"
        size="sm"
        className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 z-10"
        onClick={handleEditClick}
        title="Bewerk wedstrijd"
      >
        <Edit className="h-4 w-4 mr-1" />
        Bewerk
      </Button>
      
      <div className="font-medium text-center pr-20">
        {match.match_number && (
          <div className="font-bold text-sm text-muted-foreground mb-2">
            Wedstrijd #{match.match_number}
          </div>
        )}
        <div className="text-blue-600 font-semibold">
          {match.team1_player1_name} & {match.team1_player2_name}
        </div>
        <div className="text-sm text-muted-foreground my-1">vs</div>
        <div className="text-red-600 font-semibold">
          {match.team2_player1_name} & {match.team2_player2_name}
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground text-center mt-3 pt-3 border-t">
        <div className="font-medium">{match.court_name}</div>
        <div>Ronde {match.round_within_group}</div>
      </div>
    </div>
  );
}
