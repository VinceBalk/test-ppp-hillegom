
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

// Helper functie om namen proper te formatteren met correcte behandeling van Nederlandse tussenvoegsels
export function formatPlayerName(name: string): string {
  if (!name) return '';
  
  // Nederlandse tussenvoegsels die klein moeten blijven (behalve aan het begin van een zin)
  const dutchPrefixes = ['van', 'van der', 'van den', 'de', 'den', 'der', 'te', 'ten', 'ter', 'tot', 'op'];
  
  const words = name.toLowerCase().split(' ');
  
  return words.map((word, index) => {
    // Eerste woord altijd met hoofdletter
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    
    // Check voor samengestelde tussenvoegsels eerst (van der, van den, etc.)
    const remainingWords = words.slice(index).join(' ');
    for (const prefix of dutchPrefixes) {
      if (remainingWords.startsWith(prefix + ' ') || remainingWords === prefix) {
        // Als het een tussenvoegsel is, houd het klein
        if (prefix.includes(' ')) {
          // Voor samengestelde tussenvoegsels zoals "van der"
          return prefix;
        } else {
          // Voor enkele tussenvoegsels
          return word;
        }
      }
    }
    
    // Anders normale hoofdletter
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// Helper functie voor team namen - nu met volledige namen en juiste formattering
export function getShortTeamName(player1?: { name: string }, player2?: { name: string }): string {
  if (!player1) return 'Onbekend';
  
  if (!player2) return formatPlayerName(player1.name);
  
  return `${formatPlayerName(player1.name)} & ${formatPlayerName(player2.name)}`;
}

// Deprecated functions - keeping for backward compatibility
export function shortenPlayerName(name: string): string {
  return formatPlayerName(name);
}
