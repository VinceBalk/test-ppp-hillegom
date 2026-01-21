import { ScheduleMatch } from '@/types/schedule';
import { Badge } from '@/components/ui/badge';
import { useCourts } from '@/hooks/useCourts';
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
  const { courts } = useCourts();
  
  // Maak lookup voor court kleuren
  const courtColorMap = new Map<string, string>();
  courts.forEach(court => {
    if (court.background_color) {
      courtColorMap.set(court.name, court.background_color);
    }
  });

  // Haal kleur op, ook als court_name een suffix heeft zoals "(Links)"
  const getCourtColor = (courtName: string): string | undefined => {
    // Eerst directe match proberen
    if (courtColorMap.has(courtName)) {
      return courtColorMap.get(courtName);
    }
    // Anders zoeken naar court naam zonder suffix
    for (const [name, color] of courtColorMap) {
      if (courtName.includes(name)) {
        return color;
      }
    }
    return undefined;
  };

  // Splits matches op tournament_round (R1 vs R2)
  const splitByTournamentRound = (matches: ScheduleMatch[]) => {
    const r1: ScheduleMatch[] = [];
    const r2: ScheduleMatch[] = [];
    
    matches.forEach(match => {
      const tournamentRound = (match as any).tournament_round || 1;
      if (tournamentRound === 2) {
        r2.push(match);
      } else {
        r1.push(match);
      }
    });
    
    return { r1, r2 };
  };

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
    
    Object.keys(grouped).forEach(courtName => {
      grouped[courtName].sort((a, b) => a.round_within_group - b.round_within_group);
    });
    
    return grouped;
  };

  const { r1, r2 } = splitByTournamentRound(matches);
  const hasR2 = r2.length > 0;

  const renderRoundSection = (roundMatches: ScheduleMatch[], roundNumber: number) => {
    const courtGroups = groupMatchesByCourt(roundMatches);
    const courtNames = Object.keys(courtGroups).sort();

    const roundColors: { [key: number]: string } = {
      1: 'bg-emerald-600',
      2: 'bg-amber-600',
    };

    return (
      <div className="space-y-4">
        <div className={`p-3 rounded-lg ${roundColors[roundNumber] || 'bg-gray-600'}`}>
          <h3 className="font-bold text-white text-lg">Ronde {roundNumber}</h3>
          <span className="text-white/80 text-sm">{roundMatches.length} wedstrijden</span>
        </div>

        {courtNames.length === 0 ? (
          <div className="text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg bg-gray-50">
            <p>Geen wedstrijden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courtNames.map((courtName) => {
              const bgColor = getCourtColor(courtName);
              const headerStyle = bgColor 
                ? { backgroundColor: bgColor } 
                : undefined;
              const headerClass = bgColor 
                ? 'p-2 rounded-lg' 
                : `p-2 rounded-lg ${groupColor}`;

              return (
                <div key={courtName} className="space-y-3">
                  <div className={headerClass} style={headerStyle}>
                    <h4 className="font-semibold text-white text-sm">{courtName}</h4>
                    <span className="text-white/80 text-xs">{courtGroups[courtName].length} wedstrijden</span>
                  </div>
                  
                  <div className="space-y-2">
                    {courtGroups[courtName].map((match, index) => (
                      <div key={match.id} className="relative">
                        <div className="absolute -top-2 left-3 z-10">
                          <span className="text-xs font-medium bg-gray-800 text-white px-2 py-0.5 rounded-full">
                            Wedstrijd {index + 1}
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
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <Badge variant="secondary" className={`${groupColor} text-white px-3 py-1`}>
          {matches.length} wedstrijden
        </Badge>
      </div>
      
      {matches.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg bg-gray-50">
          <p className="text-lg">Geen wedstrijden in {title.toLowerCase()}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {renderRoundSection(r1, 1)}
          {hasR2 && renderRoundSection(r2, 2)}
        </div>
      )}
    </div>
  );
}
