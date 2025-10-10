
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SchedulePreview as SchedulePreviewType } from '@/types/schedule';
import SchedulePreviewHeader from './SchedulePreviewHeader';
import SchedulePreviewActions from './SchedulePreviewActions';
import ScheduleGroupSection from './ScheduleGroupSection';
import CourtsOverview from './CourtsOverview';

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
    <div className="space-y-8">
      <Card className="border-blue-200 bg-blue-50/30">
        <SchedulePreviewHeader
          tournamentName={tournamentName}
          roundNumber={roundNumber}
          totalMatches={preview.totalMatches}
          leftGroupMatchesCount={preview.leftGroupMatches.length}
          rightGroupMatchesCount={preview.rightGroupMatches.length}
        />
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
            <div className="p-4 bg-blue-100 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-700">{preview.totalMatches}</div>
              <div className="text-sm text-blue-600 font-medium">Totaal Wedstrijden</div>
            </div>
            <div className="p-4 bg-green-100 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-700">{preview.leftGroupMatches.length}</div>
              <div className="text-sm text-green-600 font-medium">Linker rijtje</div>
            </div>
            <div className="p-4 bg-purple-100 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-700">{preview.rightGroupMatches.length}</div>
              <div className="text-sm text-purple-600 font-medium">Rechter rijtje</div>
            </div>
          </div>
          
          <SchedulePreviewActions
            onApprove={onApprove}
            onReject={onReject}
            isApproving={isApproving}
          />
        </CardContent>
      </Card>

      {/* Main Courts Overview */}
      <CourtsOverview 
        leftGroupMatches={preview.leftGroupMatches}
        rightGroupMatches={preview.rightGroupMatches}
      />

      {/* Detailed Group Sections for Editing */}
      <div className="space-y-8">
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Gedetailleerde Weergave per Groep</h3>
          <div className="grid gap-8 lg:grid-cols-2">
            <ScheduleGroupSection
              title="Linker rijtje"
              matches={preview.leftGroupMatches}
              tournamentId={tournamentId}
              onUpdateMatch={onUpdateMatch}
              onMoveMatch={handleMoveMatch}
              groupColor="bg-green-500"
            />
            
            <ScheduleGroupSection
              title="Rechter rijtje"
              matches={preview.rightGroupMatches}
              tournamentId={tournamentId}
              onUpdateMatch={onUpdateMatch}
              onMoveMatch={handleMoveMatch}
              groupColor="bg-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
