
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SchedulePreview as SchedulePreviewType } from '@/types/schedule';
import SchedulePreviewHeader from './SchedulePreviewHeader';
import SchedulePreviewActions from './SchedulePreviewActions';
import ScheduleGroupSection from './ScheduleGroupSection';

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
  const handleMoveMatch = (draggedMatch: any, targetCourtName: string, targetIndex?: number) => {
    // Update the match with the new court name
    onUpdateMatch(draggedMatch.id, { 
      court_name: targetCourtName 
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <SchedulePreviewHeader
          tournamentName={tournamentName}
          roundNumber={roundNumber}
          totalMatches={preview.totalMatches}
          leftGroupMatchesCount={preview.leftGroupMatches.length}
          rightGroupMatchesCount={preview.rightGroupMatches.length}
        />
        <CardContent>
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{preview.totalMatches}</div>
                <div className="text-sm text-blue-700">Totaal Wedstrijden</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{preview.leftGroupMatches.length}</div>
                <div className="text-sm text-green-700">Links Groep</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">{preview.rightGroupMatches.length}</div>
                <div className="text-sm text-purple-700">Rechts Groep</div>
              </div>
            </div>
          </div>
          
          <SchedulePreviewActions
            onApprove={onApprove}
            onReject={onReject}
            isApproving={isApproving}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScheduleGroupSection
          title="Links Groep"
          matches={preview.leftGroupMatches}
          tournamentId={tournamentId}
          onUpdateMatch={onUpdateMatch}
          onMoveMatch={handleMoveMatch}
        />
        
        <ScheduleGroupSection
          title="Rechts Groep"
          matches={preview.rightGroupMatches}
          tournamentId={tournamentId}
          onUpdateMatch={onUpdateMatch}
          onMoveMatch={handleMoveMatch}
        />
      </div>
    </div>
  );
}
