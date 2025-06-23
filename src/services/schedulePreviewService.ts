
import { supabase } from '@/integrations/supabase/client';
import { SchedulePreview } from '@/types/schedule';

export const checkIfScheduleExists = async (tournamentId: string, roundNumber: number) => {
  try {
    const { data, error } = await supabase
      .from('tournament_schedule_previews')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('round_number', roundNumber)
      .maybeSingle();

    if (error) {
      console.error('Error checking existing schedule:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in checkIfScheduleExists:', error);
    return null;
  }
};

export const savePreviewToDatabase = async (tournamentId: string, roundNumber: number, previewData: SchedulePreview) => {
  try {
    // Convert SchedulePreview to a plain object that's compatible with Json type
    const previewJson = JSON.parse(JSON.stringify(previewData));
    
    const { data, error } = await supabase
      .from('tournament_schedule_previews')
      .upsert({
        tournament_id: tournamentId,
        round_number: roundNumber,
        preview_data: previewJson,
        is_approved: false,
        is_locked: false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving preview to database:', error);
      throw error;
    }

    console.log('Preview saved to database:', data);
    return data;
  } catch (error) {
    console.error('Error in savePreviewToDatabase:', error);
    throw error;
  }
};

export const clearPreviewFromDatabase = async (tournamentId: string, roundNumber: number = 1) => {
  try {
    await supabase
      .from('tournament_schedule_previews')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('round_number', roundNumber);
    
    console.log('Preview cleared from database');
  } catch (error) {
    console.error('Error clearing preview from database:', error);
    throw error;
  }
};
