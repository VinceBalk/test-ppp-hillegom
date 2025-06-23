
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, Check, X } from 'lucide-react';
import { ScheduleMatch } from '@/types/schedule';
import MatchEditorView from '../matches/MatchEditorView';
import { useCourts } from '@/hooks/useCourts';

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
  const [isEditingCourt, setIsEditingCourt] = useState(false);
  const [selectedCourtName, setSelectedCourtName] = useState(courtName);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const { courts } = useCourts();
  
  const availableCourts = courts?.filter(court => court.is_active) || [];

  const handleCourtChange = () => {
    if (selectedCourtName !== courtName) {
      // Update alle wedstrijden op dit court naar de nieuwe court
      matches.forEach(match => {
        onUpdateMatch(match.id, { 
          court_name: selectedCourtName,
          court_id: availableCourts.find(c => c.name === selectedCourtName)?.id 
        });
      });
    }
    setIsEditingCourt(false);
  };

  const handleCancelCourtEdit = () => {
    setSelectedCourtName(courtName);
    setIsEditingCourt(false);
  };

  const handleMatchUpdate = (matchId: string, updates: Partial<ScheduleMatch>) => {
    onUpdateMatch(matchId, updates);
    setEditingMatch(null);
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEditingCourt ? (
              <div className="flex items-center gap-2">
                <Select value={selectedCourtName} onValueChange={setSelectedCourtName}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourts.map((court) => (
                      <SelectItem key={court.id} value={court.name}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={handleCourtChange}>
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelCourtEdit}>
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{courtName}</CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsEditingCourt(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <Badge variant="outline">{matches.length} wedstrijden</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
              Geen wedstrijden op deze baan
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="relative">
                <MatchEditorView
                  match={match}
                  onEdit={() => setEditingMatch(match.id)}
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
