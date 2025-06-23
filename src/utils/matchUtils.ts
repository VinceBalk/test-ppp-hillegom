import { Match } from '@/hooks/useMatches';

export interface GroupedMatches {
  courtName: string;
  matches: Match[];
}

export function groupByCourt(matches: Match[]): GroupedMatches[] {
  const grouped: { [key: string]: Match[] } = {};
  
  matches.forEach((match) => {
    // Prioritize court.name over court_number for better grouping
    const courtName = match.court?.name || (match.court_number ? `Baan ${match.court_number}` : 'Onbekende baan');
    if (!grouped[courtName]) {
      grouped[courtName] = [];
    }
    grouped[courtName].push(match);
  });

  return Object.entries(grouped)
    .map(([courtName, matches]) => ({
      courtName,
      matches,
    }))
    .sort((a, b) => a.courtName.localeCompare(b.courtName));
}

export function splitMatchesByPosition(matches: Match[]): { leftMatches: Match[], rightMatches: Match[] } {
  // Voor nu verdelen we simpelweg de matches in twee groepen
  // In de toekomst kan dit gebaseerd worden op echte positie-informatie
  const leftMatches: Match[] = [];
  const rightMatches: Match[] = [];
  
  matches.forEach((match, index) => {
    if (index % 2 === 0) {
      leftMatches.push(match);
    } else {
      rightMatches.push(match);
    }
  });
  
  return { leftMatches, rightMatches };
}

export function splitCourtsByPosition(courtGroups: GroupedMatches[]): { leftCourts: GroupedMatches[], rightCourts: GroupedMatches[] } {
  const leftCourts: GroupedMatches[] = [];
  const rightCourts: GroupedMatches[] = [];
  
  // Distribute courts evenly across left and right columns
  // Keep entire courts together, don't split individual matches
  courtGroups.forEach((courtGroup, index) => {
    if (index % 2 === 0) {
      leftCourts.push(courtGroup);
    } else {
      rightCourts.push(courtGroup);
    }
  });
  
  return { leftCourts, rightCourts };
}
