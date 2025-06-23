
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduleMatch } from '@/types/schedule';

interface CourtMatchListProps {
  courtName: string;
  matches: ScheduleMatch[];
  groupColor: string;
}

export default function CourtMatchList({ courtName, matches, groupColor }: CourtMatchListProps) {
  // Sort matches by round within group
  const sortedMatches = [...matches].sort((a, b) => a.round_within_group - b.round_within_group);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{courtName}</CardTitle>
          <Badge variant="secondary" className={`${groupColor} text-white`}>
            {matches.length} wedstrijden
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedMatches.length === 0 ? (
          <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg bg-gray-50">
            <p className="text-sm">Geen wedstrijden</p>
          </div>
        ) : (
          sortedMatches.map((match, index) => (
            <div key={match.id} className="p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs font-medium">
                  Ronde {match.round_within_group}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-600">
                      {match.team1_player1_name} & {match.team1_player2_name}
                    </div>
                    <div className="text-xs text-muted-foreground my-1">vs</div>
                    <div className="text-sm font-medium text-red-600">
                      {match.team2_player1_name} & {match.team2_player2_name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
