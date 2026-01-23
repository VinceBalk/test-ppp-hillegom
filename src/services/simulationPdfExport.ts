import jsPDF from 'jspdf';
import { SimulatedMatch, SimulatedSpecial, Round3Group } from '@/hooks/useSimulation';

interface PlayerRanking {
  playerId: string;
  playerName: string;
  groupSide: string;
  r1r2Games: number;
  r1r2Specials: number;
  r3Games: number;
  r3Specials: number;
  totalGames: number;
  totalSpecials: number;
  r3Group: string;
}

interface ExportData {
  tournamentName: string;
  tournamentDate: string;
  matches: SimulatedMatch[];
  round3Groups: Round3Group[];
  finalRankings: {
    left: PlayerRanking[];
    right: PlayerRanking[];
  } | null;
}

export const exportSimulationToPdf = (data: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Helper functies
  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  const drawHeader = () => {
    // Titel
    doc.setFillColor(102, 51, 153); // Purple
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PPP HILLEGOM', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(data.tournamentName, pageWidth / 2, 23, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`SIMULATIE - ${data.tournamentDate}`, pageWidth / 2, 30, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    yPos = 45;
  };

  const drawRoundHeader = (roundName: string) => {
    addNewPageIfNeeded(20);
    
    doc.setFillColor(240, 240, 250);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setDrawColor(102, 51, 153);
    doc.rect(margin, yPos, contentWidth, 10, 'S');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 51, 153);
    doc.text(roundName, pageWidth / 2, yPos + 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    
    yPos += 15;
  };

  const drawMatchesForRound = (roundNumber: number) => {
    const roundMatches = data.matches.filter(m => m.round_number === roundNumber);
    if (roundMatches.length === 0) return;

    // Groepeer per baan
    const matchesByCourt: Record<string, SimulatedMatch[]> = {};
    roundMatches.forEach(match => {
      const courtName = match.court?.name || 'Onbekend';
      if (!matchesByCourt[courtName]) {
        matchesByCourt[courtName] = [];
      }
      matchesByCourt[courtName].push(match);
    });

    // Sorteer banen
    const courtNames = Object.keys(matchesByCourt).sort();
    
    // Splits in links en rechts
    const leftCourts = courtNames.filter(name => {
      const match = matchesByCourt[name][0];
      return match.court?.row_side === 'left';
    });
    const rightCourts = courtNames.filter(name => {
      const match = matchesByCourt[name][0];
      return match.court?.row_side === 'right';
    });

    const columnWidth = (contentWidth - 10) / 2;
    const leftX = margin;
    const rightX = margin + columnWidth + 10;

    // Teken kolom headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 0);
    doc.text('RIJ LINKS', leftX + columnWidth / 2, yPos, { align: 'center' });
    doc.setTextColor(150, 0, 0);
    doc.text('RIJ RECHTS', rightX + columnWidth / 2, yPos, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    // Bereken max hoogte nodig
    const drawCourt = (courtName: string, matches: SimulatedMatch[], xPos: number, startY: number): number => {
      let y = startY;
      
      // Baan header
      doc.setFillColor(255, 245, 230);
      doc.rect(xPos, y, columnWidth, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Baan: ${courtName}`, xPos + columnWidth / 2, y + 5.5, { align: 'center' });
      y += 10;

      // Wedstrijden
      matches.sort((a, b) => (a.match_number || 0) - (b.match_number || 0));
      
      matches.forEach((match, idx) => {
        addNewPageIfNeeded(25);
        
        const score1 = match.simulated_team1_score ?? match.team1_score ?? 0;
        const score2 = match.simulated_team2_score ?? match.team2_score ?? 0;
        const specials = match.simulated_specials || [];

        // Wedstrijd box
        doc.setDrawColor(200, 200, 200);
        doc.rect(xPos, y, columnWidth, 22, 'S');

        // Wedstrijd nummer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Wedstrijd ${idx + 1}`, xPos + 2, y + 4);

        // Team 1
        doc.setFont('helvetica', 'normal');
        const t1p1 = match.team1_player1?.name || 'Speler 1';
        const t1p2 = match.team1_player2?.name || 'Speler 2';
        doc.text(`${t1p1} & ${t1p2}`, xPos + 2, y + 10);
        
        // Score
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`${score1} - ${score2}`, xPos + columnWidth - 15, y + 12, { align: 'center' });

        // Team 2
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const t2p1 = match.team2_player1?.name || 'Speler 3';
        const t2p2 = match.team2_player2?.name || 'Speler 4';
        doc.text(`${t2p1} & ${t2p2}`, xPos + 2, y + 16);

        // Specials
        if (specials.length > 0) {
          doc.setFontSize(7);
          doc.setTextColor(255, 140, 0);
          const specialsText = specials.map(s => `⭐${s.playerName}`).join(', ');
          doc.text(specialsText, xPos + 2, y + 20);
          doc.setTextColor(0, 0, 0);
        }

        y += 24;
      });

      return y;
    };

    // Teken links en rechts naast elkaar
    let maxY = yPos;
    
    leftCourts.forEach(courtName => {
      const endY = drawCourt(courtName, matchesByCourt[courtName], leftX, yPos);
      maxY = Math.max(maxY, endY);
    });

    let rightY = yPos;
    rightCourts.forEach(courtName => {
      const endY = drawCourt(courtName, matchesByCourt[courtName], rightX, rightY);
      rightY = endY + 5;
      maxY = Math.max(maxY, endY);
    });

    yPos = maxY + 10;
  };

  const drawRankingTable = (title: string, rankings: PlayerRanking[], xPos: number, width: number) => {
    addNewPageIfNeeded(80);
    
    // Header
    doc.setFillColor(240, 240, 250);
    doc.rect(xPos, yPos, width, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, xPos + width / 2, yPos + 5.5, { align: 'center' });
    yPos += 10;

    // Kolom headers
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('#', xPos + 3, yPos + 4);
    doc.text('Speler', xPos + 10, yPos + 4);
    doc.text('R1+R2', xPos + width - 35, yPos + 4);
    doc.text('R3', xPos + width - 20, yPos + 4);
    doc.text('Tot', xPos + width - 8, yPos + 4);
    yPos += 6;

    // Rijen
    doc.setFont('helvetica', 'normal');
    rankings.forEach((player, idx) => {
      const isTop4 = player.r3Group.includes('Top');
      if (isTop4) {
        doc.setFillColor(230, 255, 230);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(xPos, yPos, width, 6, 'F');
      
      doc.setFontSize(7);
      doc.text(`${idx + 1}`, xPos + 3, yPos + 4);
      doc.text(player.playerName.substring(0, 15), xPos + 10, yPos + 4);
      doc.text(`${player.r1r2Games}g/${player.r1r2Specials}⭐`, xPos + width - 35, yPos + 4);
      doc.text(`${player.r3Games}g/${player.r3Specials}⭐`, xPos + width - 20, yPos + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(`${player.totalGames}`, xPos + width - 8, yPos + 4);
      doc.setFont('helvetica', 'normal');
      
      yPos += 6;
    });
  };

  // Start PDF generatie
  drawHeader();

  // Ronde 1
  drawRoundHeader('RONDE 1');
  drawMatchesForRound(1);

  // Ronde 2
  drawRoundHeader('RONDE 2');
  drawMatchesForRound(2);

  // Tussenstand na R1+R2
  if (data.round3Groups.length > 0) {
    addNewPageIfNeeded(60);
    drawRoundHeader('TUSSENSTAND NA RONDE 1 + 2 → INDELING RONDE 3');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    data.round3Groups.forEach(group => {
      addNewPageIfNeeded(40);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`${group.groupName} → ${group.courtName}`, margin, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      group.players.forEach((player, idx) => {
        doc.text(`  ${idx + 1}. ${player.playerName} (${player.gamesWon}g, ${player.specials}⭐)`, margin, yPos);
        yPos += 4;
      });
      yPos += 3;
    });
  }

  // Ronde 3
  if (data.matches.some(m => m.round_number === 3)) {
    drawRoundHeader('RONDE 3 (Finale Ronde)');
    drawMatchesForRound(3);
  }

  // Eindrangschikking
  if (data.finalRankings) {
    doc.addPage();
    yPos = margin;
    
    doc.setFillColor(255, 215, 0);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('🏆 EINDRANGSCHIKKING 🏆', pageWidth / 2, 14, { align: 'center' });
    yPos = 30;

    const columnWidth = (contentWidth - 10) / 2;
    
    const savedY = yPos;
    drawRankingTable('LINKS', data.finalRankings.left, margin, columnWidth);
    
    yPos = savedY;
    drawRankingTable('RECHTS', data.finalRankings.right, margin + columnWidth + 10, columnWidth);
  }

  // Footer op elke pagina
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `PPP Hillegom - Simulatie Export - Pagina ${i}/${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download
  doc.save(`${data.tournamentName.replace(/\s+/g, '_')}_Simulatie.pdf`);
};
