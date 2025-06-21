
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Match } from '@/hooks/useMatches';

interface SavedMatchEditorViewProps {
  match: Match;
  onEdit: () => void;
}

export default function SavedMatchEditorView({ match, onEdit }: SavedMatchEditorViewProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {match.team1_player1?.name} & {match.team1_player2?.name} vs {match.team2_player1?.name} & {match.team2_player2?.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Toernooi: {match.tournament?.name}</div>
          <div>Ronde: {match.round_number}</div>
          <div>Baan: {match.court?.name || match.court_number || 'Niet toegewezen'}</div>
          <div>Status: {match.status}</div>
        </div>
      </CardContent>
    </Card>
  );
}
