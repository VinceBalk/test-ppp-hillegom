import { useState } from 'react';
import { useTournamentPlayers } from './useTournamentPlayers';
import { useCourts } from './useCourts';
import { ScheduleMatch, SchedulePreview } from '@/types/schedule';
import { checkIfScheduleExists, savePreviewToDatabase, clearPreviewFromDatabase } from '@/services/schedulePreviewService';
import { generateR1R2Schedule } from '@/utils/matchGenerator';
import { generateRound3Schedule } from '@/services/round3Generator';
import { supabase } from '@/integrations/supabase/client';

export const useSchedulePreview = (tournamentId?: string) => {
  const [preview, setPreview] = useState<SchedulePreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { tournamentPlayers } = useTournamentPlayers(tournamentId);
  const { courts, loading: courtsLoading } = useCourts();

  const generatePreview = async (roundNumber: number = 1) => {
    if (!tournamentId) return;
    
    setIsGenerating(true);
    console.log('Generating preview for tournament:', tournamentId);
    
    try {
      // Check voor bestaande preview (niet voor R3)
      if (roundNumber !== 3) {
        const existingSchedule = await checkIfScheduleExists(tournamentId, roundNumber);
        if (existingSchedule && existingSchedule.preview_data) {
          console.log('Loading existing schedule from database');
          const existingPreview = existingSchedule.preview_data as unknown as SchedulePreview;
          setPreview(existingPreview);
          return existingPreview;
        }
      } else {
        await clearPreviewFromDatabase(tournamentId, roundNumber);
      }

      let allMatches: ScheduleMatch[];
      let leftMatches: ScheduleMatch[];
      let rightMatches: ScheduleMatch[];

      // R3: aparte logica
      if (roundNumber === 3) {
        if (courtsLoading) {
          throw new Error('Banen worden nog geladen.');
        }
        
        const activeCourts = courts.filter(c => c.is_active);
        if (activeCourts.length === 0) {
          throw new Error('Geen actieve banen beschikbaar.');
        }
        
        const round3Result = await generateRound3Schedule(tournamentId, activeCourts);
        allMatches = round3Result.matches;
        
        leftMatches = allMatches.filter(m => m.id.startsWith('links-'));
        rightMatches = allMatches.filter(m => m.id.startsWith('rechts-'));
      } else {
        // R1 + R2 samen genereren
        const leftPlayers = tournamentPlayers
          .filter(tp => tp.group === 'left')
          .sort((a, b) => (b.player.ranking_score || 0) - (a.player.ranking_score || 0));
        
        const rightPlayers = tournamentPlayers
          .filter(tp => tp.group === 'right')
          .sort((a, b) => (b.player.ranking_score || 0) - (a.player.ranking_score || 0));
        
        console.log('Left players (sorted by ranking):', leftPlayers.map(p => `${p.player.name} (${p.player.ranking_score})`));
        console.log('Right players (sorted by ranking):', rightPlayers.map(p => `${p.player.name} (${p.player.ranking_score})`));

        if (leftPlayers.length !== 8) {
          throw new Error(`Linker groep heeft ${leftPlayers.length} spelers, maar 8 zijn vereist.`);
        }
        if (rightPlayers.length !== 8) {
          throw new Error(`Rechter groep heeft ${rightPlayers.length} spelers, maar 8 zijn vereist.`);
        }

        // Filter courts per row_side
        const leftCourts = courts.filter(c => c.is_active && c.row_side === 'left');
        const rightCourts = courts.filter(c => c.is_active && c.row_side === 'right');

        console.log('Left courts:', leftCourts.map(c => c.name));
        console.log('Right courts:', rightCourts.map(c => c.name));

        if (leftCourts.length < 2) {
          throw new Error(`Onvoldoende linker banen: ${leftCourts.length}/2`);
        }
        if (rightCourts.length < 2) {
          throw new Error(`Onvoldoende rechter banen: ${rightCourts.length}/2`);
        }

        // Genereer R1+R2 voor links (12 wedstrijden)
        const leftResult = generateR1R2Schedule(leftPlayers, 'links', leftCourts, 1);
        
        // Genereer R1+R2 voor rechts (12 wedstrijden)
        const rightResult = generateR1R2Schedule(rightPlayers, 'rechts', rightCourts, leftResult.nextMatchNumber);

        leftMatches = leftResult.matches;
        rightMatches = rightResult.matches;
        
        // Combineer en sorteer alle matches
        allMatches = [...leftMatches, ...rightMatches];
        
        // Sorteer op: R1 eerst, dan R2. Binnen elke ronde: op round_within_group, dan court
        allMatches.sort((a, b) => {
          const aIsR1 = a.id.includes('-r1-');
          const bIsR1 = b.id.includes('-r1-');
          
          if (aIsR1 !== bIsR1) return aIsR1 ? -1 : 1;
          if (a.round_within_group !== b.round_within_group) return a.round_within_group - b.round_within_group;
          
          const aCourtOrder = courts.find(c => c.id === a.court_id)?.menu_order || 0;
          const bCourtOrder = courts.find(c => c.id === b.court_id)?.menu_order || 0;
          return aCourtOrder - bCourtOrder;
        });

        // Hernummer na sortering
        allMatches = allMatches.map((match, index) => ({
          ...match,
          match_number: index + 1,
        }));

        // Re-split voor display
        leftMatches = allMatches.filter(m => m.id.startsWith('links-'));
        rightMatches = allMatches.filter(m => m.id.startsWith('rechts-'));

        console.log(`Generated ${allMatches.length} total matches (${leftMatches.length} left, ${rightMatches.length} right)`);
      }

      const schedulePreview: SchedulePreview = {
        matches: allMatches,
        totalMatches: allMatches.length,
        leftGroupMatches: leftMatches,
        rightGroupMatches: rightMatches,
      };

      console.log('Preview ready:', {
        total: schedulePreview.totalMatches,
        left: schedulePreview.leftGroupMatches.length,
        right: schedulePreview.rightGroupMatches.length,
      });

      await savePreviewToDatabase(tournamentId, roundNumber, schedulePreview);
      setPreview(schedulePreview);
      return schedulePreview;
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const updateMatch = (matchId: string, updates: Partial<ScheduleMatch>) => {
    if (!preview) return;
    
    const updatedMatches = preview.matches.map(match => 
      match.id === matchId ? { ...match, ...updates } : match
    );
    
    const updatedLeftMatches = updatedMatches.filter(m => m.id.startsWith('links-'));
    const updatedRightMatches = updatedMatches.filter(m => m.id.startsWith('rechts-'));
    
    const updatedPreview = {
      matches: updatedMatches,
      totalMatches: updatedMatches.length,
      leftGroupMatches: updatedLeftMatches,
      rightGroupMatches: updatedRightMatches,
    };

    setPreview(updatedPreview);

    if (tournamentId) {
      savePreviewToDatabase(tournamentId, 1, updatedPreview).catch(console.error);
    }
  };

  const clearPreview = async (roundNumber: number = 1) => {
    if (tournamentId && preview) {
      try {
        await clearPreviewFromDatabase(tournamentId, roundNumber);
      } catch (error) {
        console.error('Error clearing preview:', error);
      }
    }
    setPreview(null);
  };

  return {
    preview,
    generatePreview,
    updateMatch,
    clearPreview,
    isGenerating,
    courtsLoading,
  };
};
