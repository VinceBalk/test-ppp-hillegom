import { useState } from 'react';
import { useTournamentPlayers } from './useTournamentPlayers';
import { useCourts } from './useCourts';
import { ScheduleMatch, SchedulePreview } from '@/types/schedule';
import { checkIfScheduleExists, savePreviewToDatabase, clearPreviewFromDatabase } from '@/services/schedulePreviewService';
import { generateGroupMatches } from '@/utils/matchGenerator';
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
    console.log('Generating preview for tournament:', tournamentId, 'round:', roundNumber);
    
    try {
      // Check if schedule already exists
      const existingSchedule = await checkIfScheduleExists(tournamentId, roundNumber);
      if (existingSchedule && existingSchedule.preview_data) {
        console.log('Loading existing schedule from database for round', roundNumber);
        const existingPreview = existingSchedule.preview_data as unknown as SchedulePreview;
        setPreview(existingPreview);
        return existingPreview;
      }

      let allMatches: ScheduleMatch[];
      let leftMatches: ScheduleMatch[];
      let rightMatches: ScheduleMatch[];

      // Round 3 uses stats-based generation (separate flow)
      if (roundNumber === 3) {
        if (courtsLoading) {
          throw new Error('Banen worden nog geladen. Probeer het opnieuw over een paar seconden.');
        }
        
        if (!courts || courts.length === 0) {
          throw new Error('Geen banen beschikbaar. Maak eerst banen aan voordat je Ronde 3 kunt genereren.');
        }
        
        const activeCourts = courts.filter(c => c.is_active);
        if (activeCourts.length === 0) {
          throw new Error('Geen actieve banen beschikbaar. Activeer minimaal 4 banen om Ronde 3 te kunnen genereren.');
        }
        
        const round3Result = await generateRound3Schedule(tournamentId, activeCourts);
        allMatches = round3Result.matches;
        
        leftMatches = allMatches.filter(m => m.id.startsWith('links-'));
        rightMatches = allMatches.filter(m => m.id.startsWith('rechts-'));
        
        console.log('Generated Round 3 matches:', allMatches.length);
      } else {
        // Generate BOTH R1 and R2 together
        const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
        const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');
        
        console.log('Left players:', leftPlayers.length);
        console.log('Right players:', rightPlayers.length);

        // === RONDE 1: 12 wedstrijden ===
        const r1LeftResult = generateGroupMatches(leftPlayers, 'Links', courts, 1, 1);
        const r1RightResult = generateGroupMatches(rightPlayers, 'Rechts', courts, 1, 1);
        
        // Combineer en sorteer R1
        const r1Combined = [...r1LeftResult.matches, ...r1RightResult.matches];
        const courtOrderMap = new Map(courts.map(c => [c.id, c.menu_order || 0]));
        
        r1Combined.sort((a, b) => {
          if (a.round_within_group !== b.round_within_group) {
            return a.round_within_group - b.round_within_group;
          }
          const orderA = a.court_id ? (courtOrderMap.get(a.court_id) || 0) : 0;
          const orderB = b.court_id ? (courtOrderMap.get(b.court_id) || 0) : 0;
          return orderA - orderB;
        });
        
        // Nummer R1 wedstrijden 1-12
        r1Combined.forEach((match, index) => {
          match.match_number = index + 1;
          (match as any).tournament_round = 1;
        });

        // === RONDE 2: 12 wedstrijden ===
        const r2LeftResult = generateGroupMatches(leftPlayers, 'Links', courts, 13, 2);
        const r2RightResult = generateGroupMatches(rightPlayers, 'Rechts', courts, 13, 2);
        
        // Combineer en sorteer R2
        const r2Combined = [...r2LeftResult.matches, ...r2RightResult.matches];
        
        r2Combined.sort((a, b) => {
          if (a.round_within_group !== b.round_within_group) {
            return a.round_within_group - b.round_within_group;
          }
          const orderA = a.court_id ? (courtOrderMap.get(a.court_id) || 0) : 0;
          const orderB = b.court_id ? (courtOrderMap.get(b.court_id) || 0) : 0;
          return orderA - orderB;
        });
        
        // Nummer R2 wedstrijden 13-24
        r2Combined.forEach((match, index) => {
          match.match_number = 13 + index;
          (match as any).tournament_round = 2;
        });

        // Combineer alles
        allMatches = [...r1Combined, ...r2Combined];
        leftMatches = allMatches.filter(m => m.id.startsWith('links-'));
        rightMatches = allMatches.filter(m => m.id.startsWith('rechts-'));
        
        console.log('Generated R1 + R2 matches:', allMatches.length);
        console.log('R1:', r1Combined.length, 'R2:', r2Combined.length);
      }

      const schedulePreview: SchedulePreview = {
        matches: allMatches,
        totalMatches: allMatches.length,
        leftGroupMatches: leftMatches,
        rightGroupMatches: rightMatches,
      };

      // Save preview
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
      savePreviewToDatabase(tournamentId, 1, updatedPreview).catch(error => {
        console.error('Error auto-saving preview changes:', error);
      });
    }
  };

  const clearPreview = async (roundNumber: number = 1) => {
    if (tournamentId && preview) {
      try {
        await clearPreviewFromDatabase(tournamentId, roundNumber);
      } catch (error) {
        console.error('Error clearing preview from database:', error);
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
