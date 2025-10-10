
import { ScheduleMatch } from '@/types/schedule';
import { Badge } from '@/components/ui/badge';
import CourtMatchList from './CourtMatchList';

interface ScheduleGroupSectionProps {
  title: string;
  matches: ScheduleMatch[];
  tournamentId: string;
  onUpdateMatch: (matchId: string, updates: Partial<ScheduleMatch>) => void;
  onMoveMatch?: (draggedMatch: ScheduleMatch, targetCourtName: string, targetIndex?: number) => void;
  groupColor?: string;
}

export default function ScheduleGroupSection({
  title,
  matches,
  tournamentId,
  onUpdateMatch,
  groupColor = "bg-blue-500"
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
  const sortedCourtNames = Object.keys(courtGroups).sort();

  const handleEditMatch = (match: ScheduleMatch) => {
    // For now, we'll just log the match - you can implement a modal or inline editing
    console.log('Edit match:', match);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <Badge variant="secondary" className={`${groupColor} text-white px-3 py-1`}>
          {matches.length} wedstrijden
        </Badge>
      </div>
      
      {sortedCourtNames.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg bg-gray-50">
          <p className="text-lg">Geen wedstrijden in {title.toLowerCase()}</p>
        </div>
      ) : (
        <div className="grid-3">
          {sortedCourtNames.map((courtName) => (
            <CourtMatchList
              key={courtName}
              courtName={courtName}
              matches={courtGroups[courtName]}
              groupColor={groupColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
