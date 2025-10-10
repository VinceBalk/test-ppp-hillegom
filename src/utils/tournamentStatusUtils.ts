import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if all matches in a tournament are completed and automatically
 * updates the tournament status to "completed" if so.
 */
export async function checkAndUpdateTournamentStatus(tournamentId: string): Promise<void> {
  try {
    // Fetch all matches for this tournament
    const { data: allMatches, error: matchError } = await supabase
      .from("matches")
      .select("id, status, round_number")
      .eq("tournament_id", tournamentId);

    if (matchError || !allMatches || allMatches.length === 0) {
      return;
    }

    // Check if all matches are completed
    const allCompleted = allMatches.every(m => m.status === "completed");
    
    if (allCompleted) {
      // Find the highest round number
      const maxRound = Math.max(...allMatches.map(m => m.round_number));
      
      // Update tournament status to completed
      const { error: updateError } = await supabase
        .from("tournaments")
        .update({ 
          status: "completed",
          current_round: maxRound
        })
        .eq("id", tournamentId);
      
      if (!updateError) {
        console.log(`✓ Tournament ${tournamentId} automatically marked as completed!`);
      } else {
        console.error("Error updating tournament status:", updateError);
      }
    }
  } catch (error) {
    console.error("Error in checkAndUpdateTournamentStatus:", error);
  }
}
