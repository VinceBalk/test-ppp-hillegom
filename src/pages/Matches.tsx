
import { useAuth } from '@/contexts/AuthContext';
import MatchesAuthGuard from '@/components/matches/MatchesAuthGuard';
import MatchesContent from '@/components/matches/MatchesContent';
import { useMatchesPage } from '@/hooks/useMatchesPage';

export default function Matches() {
  const { user, isSuperAdmin, hasRole } = useAuth();
  const { selectedTournamentId, setSelectedTournamentId, editMode, setEditMode } = useMatchesPage();
  
  console.log('=== MATCHES PAGE RENDER START ===');
  console.log('Current user:', user?.email || 'No user');
  console.log('User ID:', user?.id || 'No user ID');
  console.log('Is super admin:', isSuperAdmin());
  console.log('Has organisator role:', hasRole('organisator'));
  console.log('Auth loading state:', !user ? 'No user found' : 'User authenticated');

  return (
    <MatchesAuthGuard user={user}>
      <MatchesContent
        selectedTournamentId={selectedTournamentId}
        setSelectedTournamentId={setSelectedTournamentId}
        editMode={editMode}
        setEditMode={setEditMode}
        isSuperAdmin={isSuperAdmin()}
        hasOrganizerRole={hasRole('organisator')}
        hasPlayerRole={hasRole('speler')}
      />
    </MatchesAuthGuard>
  );
}
