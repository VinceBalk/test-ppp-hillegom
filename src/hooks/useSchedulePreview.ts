
import { useState } from 'react';
import { useTournamentPlayers } from './useTournamentPlayers';
import { useCourts } from './useCourts';
import { ScheduleMatch, SchedulePreview } from '@/types/schedule';
import { checkIfScheduleExists, savePreviewToDatabase, clearPreviewFromDatabase } from '@/services/schedulePreviewService';
import { generateGroupMatches } from '@/utils/matchGenerator';

export const useSchedulePreview = (tournamentId?: string) => {
  const [preview, setPreview] = useState<SchedulePreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { tournamentPlayers } = useTournamentPlayers(tournamentId);
  const { courts } = useCourts();

  const generatePreview = async (roundNumber: number = 1) => {
    if (!tournamentId) return;
    
    setIsGenerating(true);
    console.log('Generating 2v2 preview for tournament:', tournamentId, 'round:', roundNumber);
    
    try {
      // Check if schedule already exists
      const existingSchedule = await checkIfScheduleExists(tournamentId, roundNumber);
      if (existingSchedule && existingSchedule.preview_data) {
        console.log('Loading existing schedule from database');
        // Safely cast the Json data back to SchedulePreview
        const existingPreview = existingSchedule.preview_data as unknown as SchedulePreview;
        setPreview(existingPreview);
        return existingPreview;
      }

      const leftPlayers = tournamentPlayers.filter(tp => tp.group === 'left');
      const rightPlayers = tournamentPlayers.filter(tp => tp.group === 'right');
      
      console.log('Left players for 2v2:', leftPlayers.length);
      console.log('Right players for 2v2:', rightPlayers.length);
      console.log('Available courts:', courts);

      const leftMatches = generateGroupMatches(leftPlayers, 'Links', courts);
      const rightMatches = generateGroupMatches(rightPlayers, 'Rechts', courts);
      
      const allMatches = [...leftMatches, ...rightMatches];
      
      console.log('Generated 2v2 matches with court assignments from database:', allMatches.length);

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
      console.error('Error generating 2v2 preview:', error);
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
    
    const updatedLeftMatches = updatedMatches.filter(m => 
      m.court_name?.includes('Links') || m.id.includes('links')
    );
    const updatedRightMatches = updatedMatches.filter(m => 
      m.court_name?.includes('Rechts') || m.id.includes('rechts')
    );
    
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

  const clearPreview = async () => {
    if (tournamentId && preview) {
      try {
        await clearPreviewFromDatabase(tournamentId, 1);
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
  };
};
