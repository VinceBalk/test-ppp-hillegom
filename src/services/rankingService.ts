import { supabase } from '@/integrations/supabase/client';

/**
 * Service voor ranking berekeningen
 */

/**
 * Herbereken alle speler rankings
 * Roept de PostgreSQL functie aan die de rankings update
 */
export const recalculateAllRankings = async (): Promise<void> => {
  console.log('Recalculating all player rankings...');
  
  const { error } = await supabase.rpc('calculate_all_player_rankings');
  
  if (error) {
    console.error('Error recalculating rankings:', error);
    throw new Error(`Fout bij herberekenen rankings: ${error.message}`);
  }
  
  console.log('Rankings successfully recalculated');
};

/**
 * Haal huidige ranking voor een specifieke speler op
 */
export const getPlayerRanking = async (playerId: string) => {
  const { data, error } = await supabase
    .from('players')
    .select('ranking_score, position, row_side, total_tournaments')
    .eq('id', playerId)
    .single();
  
  if (error) {
    console.error('Error fetching player ranking:', error);
    throw error;
  }
  
  return data;
};

/**
 * Haal alle rankings op (gesorteerd)
 */
export const getAllRankings = async () => {
  const { data, error } = await supabase
    .from('players')
    .select('id, name, ranking_score, position, row_side, total_tournaments')
    .order('ranking_score', { ascending: false });
  
  if (error) {
    console.error('Error fetching all rankings:', error);
    throw error;
  }
  
  return data;
};
