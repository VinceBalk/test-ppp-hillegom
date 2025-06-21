
import { Card, CardContent } from '@/components/ui/card';
import { SchedulePreview as SchedulePreviewType } from '@/hooks/useSchedulePreview';
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
        />
        
        <ScheduleGroupSection
          title="Rechts Groep"
          matches={preview.rightGroupMatches}
          tournamentId={tournamentId}
          onUpdateMatch={onUpdateMatch}
        />
      </div>
    </div>
  );
}
