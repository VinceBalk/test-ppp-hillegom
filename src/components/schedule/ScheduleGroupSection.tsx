
import { ScheduleMatch } from '@/types/schedule';
import { Badge } from '@/components/ui/badge';
import CourtScheduleTable from './CourtScheduleTable';

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

  const handleEditMatch = (match: ScheduleMatch) => {
    // For now, we'll just log the match - you can implement a modal or inline editing
    console.log('Edit match:', match);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {matches.length} wedstrijden
        </Badge>
      </div>
      
      <div className="space-y-6">
        {Object.entries(courtGroups).map(([courtName, courtMatches]) => (
          <CourtScheduleTable
            key={courtName}
            courtName={courtName}
            matches={courtMatches}
            onEditMatch={handleEditMatch}
          />
        ))}
        
        {Object.keys(courtGroups).length === 0 && (
          <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg bg-gray-50">
            <p className="text-lg">Geen wedstrijden in {title.toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
