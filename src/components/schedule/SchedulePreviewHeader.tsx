
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface SchedulePreviewHeaderProps {
  tournamentName: string;
  roundNumber: number;
  totalMatches: number;
  leftGroupMatchesCount: number;
  rightGroupMatchesCount: number;
}

export default function SchedulePreviewHeader({
  tournamentName,
  roundNumber,
  totalMatches,
  leftGroupMatchesCount,
  rightGroupMatchesCount
}: SchedulePreviewHeaderProps) {
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        2v2 Schema Preview - {tournamentName} Ronde {roundNumber}
      </CardTitle>
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Totaal wedstrijden: {totalMatches}</span>
        <span>Linker rijtje: {leftGroupMatchesCount} wedstrijden</span>
        <span>Rechter rijtje: {rightGroupMatchesCount} wedstrijden</span>
      </div>
    </CardHeader>
  );
}
