
import { useState } from 'react';
import { ScheduleMatch } from '@/types/schedule';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useCourts } from '@/hooks/useCourts';
import MatchEditorView from './MatchEditorView';
import MatchEditorForm from './MatchEditorForm';

interface MatchEditorProps {
  match: ScheduleMatch;
  tournamentId: string;
  onUpdate: (matchId: string, updates: Partial<ScheduleMatch>) => void;
}

export default function MatchEditor({ match, tournamentId, onUpdate }: MatchEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState<ScheduleMatch>(match);
  const { tournamentPlayers } = useTournamentPlayers(tournamentId);
  const { courts } = useCourts();

  const activeCourts = courts.filter(court => court.is_active);

  // Determine which group this match belongs to based on court name
  const isLeftGroup = match.court_name?.includes('Links') || false;
  const isRightGroup = match.court_name?.includes('Rechts') || false;
  
  // Filter players based on the match's group
  const availablePlayers = tournamentPlayers.filter(tp => {
    if (isLeftGroup) return tp.group === 'left';
    if (isRightGroup) return tp.group === 'right';
    return true; // If group can't be determined, show all players
  });

  const handleSave = () => {
    console.log('MatchEditor handleSave called', { matchId: match.id, editedMatch });
    onUpdate(match.id, editedMatch);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedMatch(match);
    setIsEditing(false);
  };

  const updatePlayer = (position: 'team1_player1' | 'team1_player2' | 'team2_player1' | 'team2_player2', playerId: string) => {
    const player = availablePlayers.find(tp => tp.player_id === playerId);
    if (!player) return;

    setEditedMatch(prev => ({
      ...prev,
      [`${position}_id`]: playerId,
      [`${position}_name`]: player.player.name,
    }));
  };

  const updateCourt = (courtId: string) => {
    const court = activeCourts.find(c => c.id === courtId);
    if (!court) return;

    setEditedMatch(prev => ({
      ...prev,
      court_id: courtId,
      court_name: court.name,
    }));
  };

  const updateRound = (round: number) => {
    setEditedMatch(prev => ({
      ...prev,
      round_within_group: round
    }));
  };

  const updateMatchNumber = (matchNumber: number) => {
    setEditedMatch(prev => ({
      ...prev,
      match_number: matchNumber
    }));
  };

  if (!isEditing) {
    return (
      <MatchEditorView 
        match={match} 
        onEdit={() => setIsEditing(true)} 
      />
    );
  }

  return (
    <MatchEditorForm
      editedMatch={editedMatch}
      availablePlayers={availablePlayers}
      activeCourts={activeCourts}
      isLeftGroup={isLeftGroup}
      isRightGroup={isRightGroup}
      onSave={handleSave}
      onCancel={handleCancel}
      onUpdatePlayer={updatePlayer}
      onUpdateCourt={updateCourt}
      onUpdateRound={updateRound}
      onUpdateMatchNumber={updateMatchNumber}
    />
  );
}
