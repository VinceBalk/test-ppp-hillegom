
import { useState } from 'react';
import { ScheduleMatch } from '@/types/schedule';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useCourts } from '@/hooks/useCourts';
import { useIndividualMatchSaveMutation } from '@/hooks/useIndividualMatchSaveMutation';
import MatchEditorView from './MatchEditorView';
import MatchEditorForm from './MatchEditorForm';

interface MatchEditorProps {
  match: ScheduleMatch;
  tournamentId: string;
  onUpdate: (matchId: string, updates: Partial<ScheduleMatch>) => void;
  showSaveButton?: boolean;
}

export default function MatchEditor({ match, tournamentId, onUpdate, showSaveButton = false }: MatchEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState<ScheduleMatch>(match);
  const { tournamentPlayers } = useTournamentPlayers(tournamentId);
  const { courts } = useCourts();
  const saveMatch = useIndividualMatchSaveMutation();

  const activeCourts = courts.filter(court => court.is_active);

  const isLeftGroup = match.court_name?.includes('Links') || false;
  const isRightGroup = match.court_name?.includes('Rechts') || false;
  
  const availablePlayers = tournamentPlayers.filter(tp => {
    if (isLeftGroup) return tp.group === 'left';
    if (isRightGroup) return tp.group === 'right';
    return true;
  });

  const handleSave = () => {
    onUpdate(match.id, editedMatch);
    setIsEditing(false);
  };

  const handleSaveToDatabase = async () => {
    try {
      await saveMatch.mutateAsync({
        matchId: match.id,
        team1Player1Id: editedMatch.team1_player1_id,
        team1Player2Id: editedMatch.team1_player2_id,
        team2Player1Id: editedMatch.team2_player1_id,
        team2Player2Id: editedMatch.team2_player2_id,
        courtId: editedMatch.court_id,
        courtNumber: editedMatch.court_number?.toString(),
        roundWithinGroup: editedMatch.round_within_group
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save match to database:', error);
    }
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
      showSaveButton={showSaveButton}
      onSave={handleSave}
      onSaveToDatabase={handleSaveToDatabase}
      onCancel={handleCancel}
      onUpdatePlayer={updatePlayer}
      onUpdateCourt={updateCourt}
      onUpdateRound={updateRound}
      isSaving={saveMatch.isPending}
    />
  );
}
