
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useMatchesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || '');
  const [editMode, setEditMode] = useState(false);

  // Update URL when tournament selection changes
  useEffect(() => {
    if (selectedTournamentId) {
      setSearchParams({ tournament: selectedTournamentId });
    } else {
      setSearchParams({});
    }
  }, [selectedTournamentId, setSearchParams]);

  return {
    selectedTournamentId,
    setSelectedTournamentId,
    editMode,
    setEditMode,
  };
};
