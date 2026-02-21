import { supabase } from "@/integrations/supabase/client";
import { recalculateAllRankings } from "@/services/rankingService";

export async function checkAndUpdateTournamentStatus(tournamentId: string): Promise<void> {
  try {
    console.log('=== CHECKING TOURNAMENT STATUS ===');
    console.log('Tournament ID:', tournamentId);
    
    const { data: allMatches, error: matchError } = await supabase
      .from("matches")
      .select("id, status, round_number, score_team1, score_team2")
      .eq("tournament_id", tournamentId);

    if (matchError || !allMatches || allMatches.length === 0) {
      console.log('No matches found or error:', matchError);
      return;
    }

    console.log(`Found ${allMatches.length} total matches`);

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
      const now = new Date().toISOString();
      
      console.log(`✓ All matches completed with scores! Max round: ${maxRound}`);
      
      const { error: updateError } = await supabase
        .from("tournaments")
        .update({ 
          status: "completed",
          current_round: maxRound,
          end_date: now,
          updated_at: now
        })
        .eq("id", tournamentId);
      
      if (!updateError) {
        console.log(`✓ Tournament ${tournamentId} automatically marked as completed!`);
        
        // Herbereken rankings na afronden toernooi
        try {
          await recalculateAllRankings();
          console.log('✓ Rankings recalculated after tournament completion');
        } catch (rankingError) {
          console.error('Warning: Rankings recalculation failed:', rankingError);
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
