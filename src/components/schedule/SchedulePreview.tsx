
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Users } from 'lucide-react';
import { SchedulePreview as SchedulePreviewType } from '@/hooks/useSchedulePreview';

interface SchedulePreviewProps {
  preview: SchedulePreviewType;
  onApprove: () => void;
  onReject: () => void;
  isApproving?: boolean;
  tournamentName: string;
  roundNumber: number;
}

export default function SchedulePreview({ 
  preview, 
  onApprove, 
  onReject, 
  isApproving = false,
  tournamentName,
  roundNumber 
}: SchedulePreviewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            2v2 Schema Preview - {tournamentName} Ronde {roundNumber}
          </CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Totaal wedstrijden: {preview.totalMatches}</span>
            <span>Links groep: {preview.leftGroupMatches.length} wedstrijden</span>
            <span>Rechts groep: {preview.rightGroupMatches.length} wedstrijden</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={onApprove} 
              disabled={isApproving}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              {isApproving ? '2v2 Schema Goedkeuren...' : '2v2 Schema Goedkeuren'}
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
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Links Groep */}
        <Card>
          <CardHeader>
            <CardTitle>Links Groep</CardTitle>
            <Badge variant="outline">{preview.leftGroupMatches.length} wedstrijden</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {preview.leftGroupMatches.map((match, index) => (
                <div 
                  key={`left-${index}`}
                  className="p-3 border rounded-lg bg-muted/30"
                >
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
                    2v2 Wedstrijd {index + 1}
                  </div>
                </div>
              ))}
              {preview.leftGroupMatches.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Geen 2v2 wedstrijden in links groep
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rechts Groep */}
        <Card>
          <CardHeader>
            <CardTitle>Rechts Groep</CardTitle>
            <Badge variant="outline">{preview.rightGroupMatches.length} wedstrijden</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {preview.rightGroupMatches.map((match, index) => (
                <div 
                  key={`right-${index}`}
                  className="p-3 border rounded-lg bg-muted/30"
                >
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
                    2v2 Wedstrijd {index + 1}
                  </div>
                </div>
              ))}
              {preview.rightGroupMatches.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Geen 2v2 wedstrijden in rechts groep
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
