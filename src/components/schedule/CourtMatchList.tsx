
import { ScheduleMatch } from '@/types/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{courtName}</CardTitle>
          <Badge variant="secondary" className={`${groupColor} text-white`}>
            {matches.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.map((match, index) => (
          <div key={match.id} className="p-3 border rounded-lg bg-gray-50">
            {/* Blue bar with match number */}
            <div className="mb-2 p-2 bg-blue-100 border border-blue-200 rounded text-center">
              <div className="text-sm font-medium text-blue-800">
                Wedstrijd {index + 1}
              </div>
            </div>
            
            <div className="font-medium text-center">
              <div className="text-blue-600">
                {match.team1_player1_name} & {match.team1_player2_name}
              </div>
              <div className="text-sm text-muted-foreground my-1">vs</div>
              <div className="text-red-600">
                {match.team2_player1_name} & {match.team2_player2_name}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
