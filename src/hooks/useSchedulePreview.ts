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

      // Get highest existing match number for this tournament
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('match_number')
        .eq('tournament_id', tournamentId)
        .order('match_number', { ascending: false })
        .limit(1);
      
      const highestMatchNumber = existingMatches?.[0]?.match_number || 0;
      const startMatchNumber = roundNumber === 1 ? 1 : highestMatchNumber + 1;

      // Round 3 uses stats-based generation
      if (roundNumber === 3) {
        if (courtsLoading) {
          console.error('❌ Courts are still loading, cannot generate Round 3 yet');
          throw new Error('Banen worden nog geladen. Probeer het opnieuw over een paar seconden.');
        }
        
        if (!courts || courts.length === 0) {
          console.error('❌ No courts available for Round 3 generation');
          throw new Error('Geen banen beschikbaar. Maak eerst banen aan voordat je Ronde 3 kunt genereren.');
        }
        
        const activeCourts = courts.filter(c => c.is_active);
        console.log('Active courts for Round 3:', activeCourts.map(c => c.name));
        
        if (activeCourts.length === 0) {
          console.error('❌ No active courts available');
          throw new Error('Geen actieve banen beschikbaar. Activeer minimaal 4 banen om Ronde 3 te kunnen genereren.');
        }
        
        const round3Result = await generateRound3Schedule(tournamentId, activeCourts);
        allMatches = round3Result.matches;
        
        leftMatches = allMatches.filter(m => m.id.startsWith('links-'));
        rightMatches = allMatches.filter(m => m.id.startsWith('rechts-'));
        
        console.log('Split matches - Left:', leftMatches.length, 'Right:', rightMatches.length);
        console.log('Generated Round 3 matches:', allMatches.length);
      } else {
        // Rounds 1 and 2 use player group generation
        const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
        const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');
        
        console.log(`Round ${roundNumber} - Left players:`, leftPlayers.length);
        console.log(`Round ${roundNumber} - Right players:`, rightPlayers.length);
        console.log('Available courts:', courts);

        // Pass roundNumber to generateGroupMatches for R1/R2 differentiation
        const leftResult = generateGroupMatches(leftPlayers, 'Links', courts, 0, roundNumber);
        const rightResult = generateGroupMatches(rightPlayers, 'Rechts', courts, 0, roundNumber);
        
        // Maak court menu_order lookup
        const courtOrderMap = new Map(courts.map(c => [c.id, c.menu_order || 0]));
        
        // Combineer matches en sorteer: eerst potje, dan baan menu_order
        const combinedMatches = [...leftResult.matches, ...rightResult.matches];
        combinedMatches.sort((a, b) => {
          if (a.round_within_group !== b.round_within_group) {
            return a.round_within_group - b.round_within_group;
          }
          const orderA = a.court_id ? (courtOrderMap.get(a.court_id) || 0) : 0;
          const orderB = b.court_id ? (courtOrderMap.get(b.court_id) || 0) : 0;
          return orderA - orderB;
        });
        
        // Nummer de wedstrijden
        let currentMatchNumber = startMatchNumber;
        combinedMatches.forEach(match => {
          match.match_number = currentMatchNumber++;
        });
        
        // Split voor display
        leftMatches = combinedMatches.filter(m => m.id.startsWith('links-'));
        rightMatches = combinedMatches.filter(m => m.id.startsWith('rechts-'));
        allMatches = combinedMatches;
        
        console.log(`Generated Round ${roundNumber} matches:`, allMatches.length);
        console.log('Match numbers range:', startMatchNumber, 'to', currentMatchNumber - 1);
      }

      const schedulePreview: SchedulePreview = {
        matches: allMatches,
        totalMatches: allMatches.length,
        leftGroupMatches: leftMatches,
        rightGroupMatches: rightMatches,
      };

      // Save to database with correct round number
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
    console.log('useSchedulePreview updateMatch called', { matchId, updates, hasPreview: !!preview });
    if (!preview) return;
    
    const updatedMatches = preview.matches.map(match => 
      match.id === matchId ? { ...match, ...updates } : match
    );
    console.log('Preview updated, updatedMatches count:', updatedMatches.length);
    
    const updatedLeftMatches = updatedMatches.filter(m => m.id.startsWith('links-'));
    const updatedRightMatches = updatedMatches.filter(m => m.id.startsWith('rechts-'));
    
    const updatedPreview = {
      matches: updatedMatches,
      totalMatches: updatedMatches.length,
      leftGroupMatches: updatedLeftMatches,
      rightGroupMatches: updatedRightMatches,
    };

    setPreview(updatedPreview);

    // Auto-save changes to database (use roundNumber 1 as default for now)
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
