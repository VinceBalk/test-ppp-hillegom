import { supabase } from "@/integrations/supabase/client";
import { recalculateAllRankings } from "@/services/rankingService";

/**
 * Checks if all matches in a tournament are completed WITH SCORES and automatically
 * updates the tournament status to "completed" if so.
 * 
 * REQUIREMENTS FOR COMPLETION:
 * - ALL matches (R1 + R2 + R3) must have status "completed"
 * - ALL matches must have score_team1 and score_team2 filled in (not null)
 * - Specials are NOT required (can be 0 or empty)
 */
export async function checkAndUpdateTournamentStatus(tournamentId: string): Promise<void> {
  try {
    console.log('=== CHECKING TOURNAMENT STATUS ===');
    console.log('Tournament ID:', tournamentId);
    
    // Fetch all matches for this tournament
    const { data: allMatches, error: matchError } = await supabase
      .from("matches")
      .select("id, status, round_number, score_team1, score_team2")
      .eq("tournament_id", tournamentId);

    if (matchError || !allMatches || allMatches.length === 0) {
      console.log('No matches found or error:', matchError);
      return;
    }

    console.log(`Found ${allMatches.length} total matches`);

    // Check if ALL matches are completed AND have scores
    const allCompleted = allMatches.every(m => 
      m.status === "completed" && 
      m.score_team1 !== null && 
      m.score_team2 !== null
    );
    
    const completedCount = allMatches.filter(m => m.status === "completed").length;
    const withScoresCount = allMatches.filter(m => 
      m.status === "completed" && 
      m.score_team1 !== null && 
      m.score_team2 !== null
    ).length;
    
    console.log(`Completed matches: ${completedCount}/${allMatches.length}`);
    console.log(`With scores: ${withScoresCount}/${allMatches.length}`);
    
    if (allCompleted) {
      const maxRound = Math.max(...allMatches.map(m => m.round_number));
      
      console.log(`✓ All matches completed with scores! Max round: ${maxRound}`);
      
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("tournaments")
        .update({ 
          status: "completed",
          current_round: maxRound,
          end_date: now,
          updated_at: now,
        })
        .eq("id", tournamentId);
      
      if (!updateError) {
        console.log(`✓ Tournament ${tournamentId} automatically marked as completed!`);
        
        // Herbereken rankings na auto-complete
        try {
          await recalculateAllRankings();
          console.log('✓ Rankings successfully recalculated after auto-complete');
        } catch (rankingError) {
          console.error('Warning: Rankings recalculation failed after auto-complete:', rankingError);
          // Niet throwen — tournament update was succesvol
        }
      } else {
        console.error("Error updating tournament status:", updateError);
      }
    } else {
      console.log('Tournament not ready for completion yet');
    }
  } catch (error) {
    console.error("Error in checkAndUpdateTournamentStatus:", error);
  }
}
