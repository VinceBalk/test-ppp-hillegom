
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
  
  // FIX: Omdraaien van de kolommen - rechts wordt links en links wordt rechts
  courtGroups.forEach((courtGroup, index) => {
    if (index % 2 === 0) {
      rightCourts.push(courtGroup); // Was leftCourts
    } else {
      leftCourts.push(courtGroup); // Was rightCourts  
    }
  });
  
  return { leftCourts, rightCourts };
}

// Helper functie om namen in te korten
export function shortenPlayerName(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) return name;
  
  // Eerste naam volledig, rest alleen eerste letter
  const firstName = parts[0];
  const initials = parts.slice(1).map(part => part.charAt(0).toUpperCase()).join('.');
  
  return `${firstName} ${initials}`;
}

// Helper functie voor team namen
export function getShortTeamName(player1?: { name: string }, player2?: { name: string }): string {
  if (!player1) return 'Onbekend';
  
  if (!player2) return shortenPlayerName(player1.name);
  
  return `${shortenPlayerName(player1.name)} & ${shortenPlayerName(player2.name)}`;
}
