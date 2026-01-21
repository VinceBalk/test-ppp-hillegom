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
      // Voor ronde 3: ALTIJD regenereren om laatste logica te gebruiken
      if (roundNumber !== 3) {
        const existingSchedule = await checkIfScheduleExists(tournamentId, roundNumber);
        if (existingSchedule && existingSchedule.preview_data) {
          console.log('Loading existing schedule from database');
          const existingPreview = existingSchedule.preview_data as unknown as SchedulePreview;
          setPreview(existingPreview);
          return existingPreview;
        }
      } else {
        console.log('🔄 Round 3: Clearing existing preview to force regeneration');
        await clearPreviewFromDatabase(tournamentId, roundNumber);
      }

      let allMatches: ScheduleMatch[];
      let leftMatches: ScheduleMatch[];
      let rightMatches: ScheduleMatch[];

      const { data: existingMatches } = await supabase
        .from('matches')
        .select('match_number')
        .eq('tournament_id', tournamentId)
        .order('match_number', { ascending: false })
        .limit(1);
      
      const highestMatchNumber = existingMatches?.[0]?.match_number || 0;
      const startMatchNumber = roundNumber === 1 ? 1 : highestMatchNumber + 1;

      if (roundNumber === 3) {
        if (courtsLoading) {
          throw new Error('Banen worden nog geladen. Probeer het opnieuw.');
        }
        
        if (!courts || courts.length === 0) {
          throw new Error('Geen banen beschikbaar.');
        }
        
        const activeCourts = courts.filter(c => c.is_active);
        if (activeCourts.length === 0) {
          throw new Error('Geen actieve banen beschikbaar.');
        }
        
        const round3Result = await generateRound3Schedule(tournamentId, activeCourts);
        allMatches = round3Result.matches;
        
        leftMatches = allMatches.filter(m => m.id.startsWith('links-'));
        rightMatches = allMatches.filter(m => m.id.startsWith('rechts-'));
        
        console.log('Generated Round 3 - Left:', leftMatches.length, 'Right:', rightMatches.length);
      } else {
        // R1 en R2: player group generatie
        const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
        const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');
        
        console.log('Left players:', leftPlayers.length);
        console.log('Right players:', rightPlayers.length);

        // Filter courts per row_side
        const leftCourts = courts.filter(c => c.is_active && c.row_side === 'left');
        const rightCourts = courts.filter(c => c.is_active && c.row_side === 'right');

        console.log('Left courts:', leftCourts.map(c => c.name));
        console.log('Right courts:', rightCourts.map(c => c.name));

        const leftResult = generateGroupMatches(leftPlayers, 'links', leftCourts, 0);
        const rightResult = generateGroupMatches(rightPlayers, 'rechts', rightCourts, 0);
        
        leftMatches = leftResult.matches;
        rightMatches = rightResult.matches;
        
        console.log('Generated left matches:', leftMatches.length);
        console.log('Generated right matches:', rightMatches.length);
        
        // Combineer en sorteer
        const combinedMatches = [...leftMatches, ...rightMatches];
        const courtOrderMap = new Map(courts.map(c => [c.id, c.menu_order || 0]));
        
        combinedMatches.sort((a, b) => {
          if (a.round_within_group !== b.round_within_group) {
            return a.round_within_group - b.round_within_group;
          }
          const orderA = a.court_id ? (courtOrderMap.get(a.court_id) || 0) : 0;
          const orderB = b.court_id ? (courtOrderMap.get(b.court_id) || 0) : 0;
          return orderA - orderB;
        });
        
        // Nummeren
        let currentMatchNumber = startMatchNumber;
        combinedMatches.forEach(match => {
          match.match_number = currentMatchNumber++;
        });
        
        allMatches = combinedMatches;
        
        // Re-split na nummering
        leftMatches = allMatches.filter(m => m.id.startsWith('links-'));
        rightMatches = allMatches.filter(m => m.id.startsWith('rechts-'));
        
        console.log('Final - Left:', leftMatches.length, 'Right:', rightMatches.length);
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
