
import { ScheduleMatch } from '@/types/schedule';
import CourtMatchesCard from './CourtMatchesCard';

interface ScheduleGroupSectionProps {
  title: string;
  matches: ScheduleMatch[];
  tournamentId: string;
  onUpdateMatch: (matchId: string, updates: Partial<ScheduleMatch>) => void;
  onMoveMatch?: (draggedMatch: ScheduleMatch, targetCourtName: string, targetIndex?: number) => void;
}

export default function ScheduleGroupSection({
  title,
  matches,
  tournamentId,
  onUpdateMatch,
}: ScheduleGroupSectionProps) {
  // Group matches by court for better organization
  const groupMatchesByCourt = (matches: ScheduleMatch[]) => {
    const grouped: { [courtName: string]: ScheduleMatch[] } = {};
    
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

  const courtGroups = groupMatchesByCourt(matches);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {title}
        <Badge variant="secondary">{matches.length} wedstrijden</Badge>
      </h3>
      
      <div className="grid gap-4">
        {Object.entries(courtGroups).map(([courtName, courtMatches]) => (
          <CourtMatchesCard
            key={courtName}
            courtName={courtName}
            matches={courtMatches}
            tournamentId={tournamentId}
            onUpdateMatch={onUpdateMatch}
          />
        ))}
        
        {Object.keys(courtGroups).length === 0 && (
          <div className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/30">
            <p className="text-sm">Geen wedstrijden in {title.toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
