
export interface ScheduleMatch {
  id: string;
  team1_player1_id: string;
  team1_player2_id: string;
  team2_player1_id: string;
  team2_player2_id: string;
  team1_player1_name: string;
  team1_player2_name: string;
  team2_player1_name: string;
  team2_player2_name: string;
  court_name?: string;
  court_number?: number | string;
  court_id?: string;
  round_within_group: number;
  match_number?: number;
}

export interface SchedulePreview {
  matches: ScheduleMatch[];
  totalMatches: number;
  leftGroupMatches: ScheduleMatch[];
  rightGroupMatches: ScheduleMatch[];
}
