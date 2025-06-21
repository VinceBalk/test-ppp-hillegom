
import { useState } from 'react';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { useCourts } from '@/hooks/useCourts';
import { useIndividualMatchSaveMutation } from '@/hooks/useIndividualMatchSaveMutation';
import { Match } from '@/hooks/useMatches';
import SavedMatchEditorView from './SavedMatchEditorView';
import SavedMatchEditorForm from './SavedMatchEditorForm';

interface SavedMatchEditorProps {
  match: Match;
  tournamentId: string;
}

export default function SavedMatchEditor({ match, tournamentId }: SavedMatchEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatch, setEditedMatch] = useState(match);
  const { tournamentPlayers } = useTournamentPlayers(tournamentId);
  const { courts } = useCourts();
  const saveMatch = useIndividualMatchSaveMutation();

  const availablePlayers = tournamentPlayers;
  const activeCourts = courts.filter(court => court.is_active);

  const handleSaveToDatabase = async () => {
    if (!editedMatch.team1_player1_id || !editedMatch.team1_player2_id || 
        !editedMatch.team2_player1_id || !editedMatch.team2_player2_id) {
      console.error('All player IDs must be provided');
      return;
    }

    try {
      await saveMatch.mutateAsync({
        matchId: match.id,
        team1Player1Id: editedMatch.team1_player1_id,
        team1Player2Id: editedMatch.team1_player2_id,
        team2Player1Id: editedMatch.team2_player1_id,
        team2Player2Id: editedMatch.team2_player2_id,
        courtId: editedMatch.court_id,
        courtNumber: editedMatch.court_number,
        roundWithinGroup: editedMatch.round_number || 1
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

  const updatePlayer = (field: string, playerId: string) => {
    const player = availablePlayers.find(tp => tp.player_id === playerId);
    if (!player) return;

    setEditedMatch(prev => ({
      ...prev,
      [field]: playerId,
    }));
  };

  const updateCourt = (courtId: string) => {
    const court = activeCourts.find(c => c.id === courtId);
    if (!court) return;

    setEditedMatch(prev => ({
      ...prev,
      court_id: courtId,
    }));
  };

  if (!isEditing) {
    return (
      <SavedMatchEditorView 
        match={match} 
        onEdit={() => setIsEditing(true)} 
      />
    );
  }

  return (
    <SavedMatchEditorForm
      editedMatch={editedMatch}
      availablePlayers={availablePlayers}
      activeCourts={activeCourts}
      onSave={handleSaveToDatabase}
      onCancel={handleCancel}
      onUpdatePlayer={updatePlayer}
      onUpdateCourt={updateCourt}
      isSaving={saveMatch.isPending}
    />
  );
}
