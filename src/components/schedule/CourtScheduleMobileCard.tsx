import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';
import { ScheduleMatch } from '@/types/schedule';

interface CourtScheduleMobileCardProps {
  match: ScheduleMatch;
  onEditMatch: (match: ScheduleMatch) => void;
}

export function CourtScheduleMobileCard({ 
  match, 
  onEditMatch 
}: CourtScheduleMobileCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Ronde {match.round_within_group}</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditMatch(match)}
            className="h-8 w-8 p-0"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Team 1</p>
            <p className="font-medium text-blue-600">
              {match.team1_player1_name} & {match.team1_player2_name}
            </p>
          </div>
          
          <div className="text-center text-muted-foreground text-sm py-1">
            vs
          </div>
          
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Team 2</p>
            <p className="font-medium text-red-600">
              {match.team2_player1_name} & {match.team2_player2_name}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
