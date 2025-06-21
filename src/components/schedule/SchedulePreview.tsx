
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Users } from 'lucide-react';
import { SchedulePreview as SchedulePreviewType } from '@/hooks/useSchedulePreview';
import MatchEditor from './MatchEditor';

interface SchedulePreviewProps {
  preview: SchedulePreviewType;
  onApprove: () => void;
  onReject: () => void;
  onUpdateMatch: (matchId: string, updates: Partial<SchedulePreviewType['matches'][0]>) => void;
  isApproving?: boolean;
  tournamentName: string;
  tournamentId: string;
  roundNumber: number;
}

export default function SchedulePreview({ 
  preview, 
  onApprove, 
  onReject, 
  onUpdateMatch,
  isApproving = false,
  tournamentName,
  tournamentId,
  roundNumber 
}: SchedulePreviewProps) {
  
  // Group matches by court for better organization
  const groupMatchesByCourt = (matches: SchedulePreviewType['matches'][0][]) => {
    const grouped: { [courtName: string]: SchedulePreviewType['matches'][0][] } = {};
    
    matches.forEach(match => {
      const courtKey = match.court_name || 'Onbekende Baan';
      if (!grouped[courtKey]) {
        grouped[courtKey] = [];
      }
      grouped[courtKey].push(match);
    });
    
    // Sort matches within each court by round
    Object.keys(grouped).forEach(courtName => {
      grouped[courtName].sort((a, b) => a.round_within_group - b.round_within_group);
    });
    
    return grouped;
  };

  const leftCourtGroups = groupMatchesByCourt(preview.leftGroupMatches);
  const rightCourtGroups = groupMatchesByCourt(preview.rightGroupMatches);

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
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Links Groep */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Links Groep</h3>
          {Object.entries(leftCourtGroups).map(([courtName, matches]) => (
            <Card key={courtName}>
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
          ))}
          {Object.keys(leftCourtGroups).length === 0 && (
            <div className="text-center text-muted-foreground py-8 border rounded-lg">
              Geen wedstrijden in links groep
            </div>
          )}
        </div>

        {/* Rechts Groep */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Rechts Groep</h3>
          {Object.entries(rightCourtGroups).map(([courtName, matches]) => (
            <Card key={courtName}>
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
          ))}
          {Object.keys(rightCourtGroups).length === 0 && (
            <div className="text-center text-muted-foreground py-8 border rounded-lg">
              Geen wedstrijden in rechts groep
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
