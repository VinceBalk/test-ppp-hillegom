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
  
  const groupMatchesByRound = (matches: ScheduleMatch[]) => {
    const grouped: { [round: number]: ScheduleMatch[] } = {};
    
    matches.forEach(match => {
      const round = match.round_within_group || 1;
      if (!grouped[round]) {
        grouped[round] = [];
      }
      grouped[round].push(match);
    });
    
    Object.keys(grouped).forEach(round => {
      grouped[Number(round)].sort((a, b) => {
        if (a.match_number && b.match_number) {
          return a.match_number - b.match_number;
        }
        return (a.court_name || '').localeCompare(b.court_name || '');
      });
    });
    
    return grouped;
  };

  const roundGroups = groupMatchesByRound(matches);
  const sortedRounds = Object.keys(roundGroups).map(Number).sort((a, b) => a - b);

  const roundColors: { [key: number]: string } = {
    1: 'bg-emerald-500',
    2: 'bg-amber-500', 
    3: 'bg-purple-500'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <Badge variant="secondary" className={`${groupColor} text-white px-3 py-1`}>
          {matches.length} wedstrijden
        </Badge>
      </div>
      
      {sortedRounds.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg bg-gray-50">
          <p className="text-lg">Geen wedstrijden in {title.toLowerCase()}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedRounds.map((round) => (
            <div key={round} className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${roundColors[round] || 'bg-gray-500'}`}>
                <h3 className="font-bold text-white text-lg">Ronde {round}</h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {roundGroups[round].length} wedstrijden
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roundGroups[round].map((match) => (
                  <div key={match.id} className="relative">
                    <div className="absolute -top-2 left-3 z-10">
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border">
                        {match.court_name || 'Onbekende Baan'}
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
