
import { ScheduleMatch } from '@/types/schedule';
import { Badge } from '@/components/ui/badge';

interface CourtMatchListProps {
  courtName: string;
  matches: ScheduleMatch[];
  groupColor?: string;
}

export default function CourtMatchList({ 
  courtName, 
  matches, 
  groupColor = "bg-blue-500" 
}: CourtMatchListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 rounded-lg border bg-gray-50">
        <h3 className="font-semibold text-gray-900">{courtName}</h3>
        <Badge variant="secondary" className={`${groupColor} text-white`}>
          {matches.length}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {matches.map((match, index) => (
          <div 
            key={match.id} 
            className="p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="text-sm font-medium text-left">
              <div className="text-blue-600 mb-1">
                {match.team1_player1_name}
                {match.team1_player2_name && ` & ${match.team1_player2_name}`}
              </div>
              <div className="text-xs text-muted-foreground mb-1">vs</div>
              <div className="text-red-600">
                {match.team2_player1_name}
                {match.team2_player2_name && ` & ${match.team2_player2_name}`}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
              <span>Ronde {match.round_within_group}</span>
              <Badge variant="outline" className="text-xs">Gepland</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
