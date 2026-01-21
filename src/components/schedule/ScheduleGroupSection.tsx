import { ScheduleMatch } from '@/types/schedule';
import { Badge } from '@/components/ui/badge';
import MatchEditor from './MatchEditor';

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
  // Groepeer matches per baan
  const groupMatchesByCourt = (matches: ScheduleMatch[]) => {
    const grouped: { [courtName: string]: ScheduleMatch[] } = {};
    
    matches.forEach(match => {
      const courtKey = match.court_name || 'Onbekende Baan';
      if (!grouped[courtKey]) {
        grouped[courtKey] = [];
      }
      grouped[courtKey].push(match);
    });
    
    // Sorteer matches binnen elke baan op ronde
    Object.keys(grouped).forEach(courtName => {
      grouped[courtName].sort((a, b) => a.round_within_group - b.round_within_group);
    });
    
    return grouped;
  };

  const courtGroups = groupMatchesByCourt(matches);
  
  // Haal alle unieke court names op en sorteer ze
  // Dit werkt nu dynamisch i.p.v. hardcoded namen
  const sortedCourtNames = Object.keys(courtGroups).sort((a, b) => {
    // Sorteer op basis van de eerste match's court menu order als beschikbaar
    const aMatch = courtGroups[a][0];
    const bMatch = courtGroups[b][0];
    const aOrder = (aMatch as any)?.courtMenuOrder || 0;
    const bOrder = (bMatch as any)?.courtMenuOrder || 0;
    return aOrder - bOrder;
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedCourtNames.map((courtName) => (
            <div key={courtName} className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-gray-50">
                <h3 className="font-semibold text-gray-900">{courtName}</h3>
                <Badge variant="secondary" className={`${groupColor} text-white`}>
                  {courtGroups[courtName].length}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {courtGroups[courtName].map((match) => (
                  <MatchEditor
                    key={match.id}
                    match={match}
                    tournamentId={tournamentId}
                    onUpdate={onUpdateMatch}
                    isPreviewMode={true}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
