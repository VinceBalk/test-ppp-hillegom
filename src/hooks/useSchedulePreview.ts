import { useState } from 'react';
import { useTournamentPlayers } from './useTournamentPlayers';
import { useCourts } from './useCourts';
import { ScheduleMatch, SchedulePreview } from '@/types/schedule';
import { checkIfScheduleExists, savePreviewToDatabase, clearPreviewFromDatabase } from '@/services/schedulePreviewService';
import { generateMaxVarietySchedule } from '@/utils/matchGenerator';
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
        // Check of schema al bestaat (alleen voor rondes 1 & 2)
        const existingSchedule = await checkIfScheduleExists(tournamentId, roundNumber);
        if (existingSchedule && existingSchedule.preview_data) {
          console.log('Loading existing schedule from database');
          const existingPreview = existingSchedule.preview_data as unknown as SchedulePreview;
          setPreview(existingPreview);
          return existingPreview;
        }
      } else {
        // Ronde 3: Clear bestaande preview eerst om regeneratie te forceren
        console.log('🔄 Round 3: Clearing existing preview to force regeneration');
        await clearPreviewFromDatabase(tournamentId, roundNumber);
      }

      let allMatches: ScheduleMatch[];
      let leftMatches: ScheduleMatch[];
      let rightMatches: ScheduleMatch[];

      // Haal hoogste bestaande match nummer op voor dit toernooi
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('match_number')
        .eq('tournament_id', tournamentId)
        .order('match_number', { ascending: false })
        .limit(1);
      
      const highestMatchNumber = existingMatches?.[0]?.match_number || 0;
      const startMatchNumber = roundNumber === 1 ? 1 : highestMatchNumber + 1;

      // Ronde 3 gebruikt stats-based generatie
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
        
        // Split matches per groep voor display
        leftMatches = allMatches.filter(m => m.id.startsWith('links-'));
        rightMatches = allMatches.filter(m => m.id.startsWith('rechts-'));
        
        console.log('Split matches - Left:', leftMatches.length, 'Right:', rightMatches.length);
        console.log('Generated Round 3 matches:', allMatches.length);
      } else {
        // Rondes 1 en 2 gebruiken max variety schedule generatie
        const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
        const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');
        
        console.log('Left players:', leftPlayers.length);
        console.log('Right players:', rightPlayers.length);
        console.log('Available courts:', courts);

        const leftResult = generateMaxVarietySchedule(leftPlayers, 'Links', courts, 0);
        const rightResult = generateMaxVarietySchedule(rightPlayers, 'Rechts', courts, 0);
        
        // Maak court menu_order lookup
        const courtOrderMap = new Map(courts.map(c => [c.id, c.menu_order || 0]));
        
        // Combineer matches en sorteer HORIZONTAAL: eerst ronde, dan baan menu_order
        const combinedMatches = [...leftResult.matches, ...rightResult.matches];
        combinedMatches.sort((a, b) => {
          if (a.round_within_group !== b.round_within_group) {
            return a.round_within_group - b.round_within_group;
          }
          const orderA = a.court_id ? (courtOrderMap.get(a.court_id) || 0) : 0;
          const orderB = b.court_id ? (courtOrderMap.get(b.court_id) || 0) : 0;
          return orderA - orderB;
        });
        
        // Nu horizontaal nummeren vanaf startMatchNumber
        let currentMatchNumber = startMatchNumber;
        combinedMatches.forEach(match => {
          match.match_number = currentMatchNumber++;
        });
        
        // Split terug voor display
        leftMatches = combinedMatches.filter(m => m.court_name?.includes('Links'));
        rightMatches = combinedMatches.filter(m => m.court_name?.includes('Rechts'));
        allMatches = combinedMatches;
        
        console.log('Generated matches with court assignments and match numbers:', allMatches.length);
        console.log('Match numbers range:', startMatchNumber, 'to', currentMatchNumber - 1);
      }

      const schedulePreview: SchedulePreview = {
        matches: allMatches,
        totalMatches: allMatches.length,
        leftGroupMatches: leftMatches,
        rightGroupMatches: rightMatches,
      };

      // Save to database
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

    // Auto-save changes to database
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
