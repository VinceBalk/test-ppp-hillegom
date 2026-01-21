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
  
  const groupMatchesByCourt = (matches: ScheduleMatch[]) => {
    const grouped: { [courtName: string]: ScheduleMatch[] } = {};
    
    matches.forEach(match => {
      const courtKey = match.court_name || 'Onbekende Baan';
      if (!grouped[courtKey]) {
        grouped[courtKey] = [];
      }
      grouped[courtKey].push(match);
    });
    
    // Sorteer wedstrijden binnen elke baan op round_within_group (potje 1, 2, 3)
    Object.keys(grouped).forEach(courtName => {
      grouped[courtName].sort((a, b) => a.round_within_group - b.round_within_group);
    });
    
    return grouped;
  };

  const courtGroups = groupMatchesByCourt(matches);
  const courtNames = Object.keys(courtGroups).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <Badge variant="secondary" className={`${groupColor} text-white px-3 py-1`}>
          {matches.length} wedstrijden
        </Badge>
      </div>
      
      {courtNames.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg bg-gray-50">
          <p className="text-lg">Geen wedstrijden in {title.toLowerCase()}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courtNames.map((courtName) => (
            <div key={courtName} className="space-y-3">
              <div className={`p-3 rounded-lg ${groupColor}`}>
                <h3 className="font-bold text-white">{courtName}</h3>
                <span className="text-white/80 text-sm">{courtGroups[courtName].length} potjes</span>
              </div>
              
              <div className="space-y-2">
                {courtGroups[courtName].map((match, index) => (
                  <div key={match.id} className="relative">
                    <div className="absolute -top-2 left-3 z-10">
                      <span className="text-xs font-medium bg-gray-800 text-white px-2 py-0.5 rounded-full">
                        Potje {index + 1}
                      </span>
                    </div>
                    <MatchEditor
                      match={match}
                      tournamentId={tournamentId}
                      onUpdate={onUpdateMatch}
                      isPreviewMode={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
