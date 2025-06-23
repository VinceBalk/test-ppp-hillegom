
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduleMatch } from '@/types/schedule';
import MatchEditor from './MatchEditor';

interface CourtMatchesCardProps {
  courtName: string;
  matches: ScheduleMatch[];
  tournamentId: string;
  onUpdateMatch: (matchId: string, updates: Partial<ScheduleMatch>) => void;
}

export default function CourtMatchesCard({ 
  courtName, 
  matches, 
  tournamentId, 
  onUpdateMatch 
}: CourtMatchesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{courtName}</CardTitle>
        <Badge variant="outline">{matches.length} wedstrijden</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {matches.map((match) => (
            <MatchEditor
              key={match.id}
              match={match}
              tournamentId={tournamentId}
              onUpdate={onUpdateMatch}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
