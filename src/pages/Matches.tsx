
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useMatches } from '@/hooks/useMatches';
import { useTournaments, Tournament } from '@/hooks/useTournaments';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MatchCard from '@/components/matches/MatchCard';
import SavedMatchEditor from '@/components/matches/SavedMatchEditor';
import MatchesFilter from '@/components/matches/MatchesFilter';
import MatchesDebug from '@/components/matches/MatchesDebug';

export default function Matches() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || '');
  const [editMode, setEditMode] = useState(false);
  
  const { tournaments, isLoading: tournamentsLoading, error: tournamentsError } = useTournaments();
  const { matches, isLoading: matchesLoading, error: matchesError, refetch } = useMatches(selectedTournamentId || undefined);

  console.log('=== MATCHES PAGE DEBUG ===');
  console.log('Tournament from URL:', tournamentId);
  console.log('Selected tournament:', selectedTournamentId);
  console.log('All tournaments:', tournaments);
  console.log('Tournaments loading:', tournamentsLoading);
  console.log('Tournaments error:', tournamentsError);
  console.log('Matches found:', matches?.length || 0);
  console.log('Matches data:', matches);
  console.log('Matches loading:', matchesLoading);
  console.log('Matches error:', matchesError);

  // Update URL when tournament selection changes
  useEffect(() => {
    if (selectedTournamentId) {
      setSearchParams({ tournament: selectedTournamentId });
    } else {
      setSearchParams({});
    }
  }, [selectedTournamentId, setSearchParams]);

  // Handle browser back button properly
  useEffect(() => {
    const handlePopState = () => {
      console.log('Browser popstate event detected');
      // Force a refetch when user navigates back
      refetch();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [refetch]);

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    refetch();
  };

  const isLoading = tournamentsLoading || matchesLoading;
  const error = tournamentsError || matchesError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
          <p className="text-muted-foreground">Overzicht van alle wedstrijden en resultaten</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
          <p className="text-muted-foreground">Overzicht van alle wedstrijden en resultaten</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Er is een fout opgetreden bij het laden van de wedstrijden: {error.message}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={handleRefresh}
            >
              Probeer opnieuw
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show message if no tournaments exist
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
          <p className="text-muted-foreground">Overzicht van alle wedstrijden en resultaten</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nog geen toernooien aangemaakt.{' '}
            <Button 
              variant="link" 
              className="p-0 ml-1 h-auto"
              onClick={() => navigate('/tournaments')}
            >
              Ga naar Toernooien om een toernooi aan te maken
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
          <p className="text-muted-foreground">Overzicht van alle wedstrijden en resultaten</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={editMode ? "default" : "outline"} 
            size="sm"
            disabled={!selectedTournamentId || matches.length === 0}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Bekijk Modus' : 'Bewerk Modus'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Vernieuwen
          </Button>
        </div>
      </div>

      {/* Tournament Filter */}
      <MatchesFilter
        tournaments={tournaments}
        selectedTournamentId={selectedTournamentId}
        onTournamentChange={setSelectedTournamentId}
        selectedTournament={selectedTournament}
      />

      {/* No matches alert */}
      {selectedTournamentId && matches.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nog geen wedstrijden gepland voor dit toernooi.{' '}
            <Button 
              variant="link" 
              className="p-0 ml-1 h-auto"
              onClick={() => navigate(`/schedule/${selectedTournamentId}`)}
            >
              Ga naar Planning om een schema te genereren
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Matches List */}
      <div className="grid gap-4">
        {matches.length === 0 && !selectedTournamentId ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Selecteer een toernooi om wedstrijden te bekijken.
              </p>
            </CardContent>
          </Card>
        ) : (
          matches.map((match) => (
            editMode ? (
              <SavedMatchEditor 
                key={match.id} 
                match={match} 
                tournamentId={selectedTournamentId || match.tournament_id} 
              />
            ) : (
              <MatchCard key={match.id} match={match} />
            )
          ))
        )}
      </div>

      {/* Results count */}
      {matches.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {matches.length} wedstrijd{matches.length !== 1 ? 'en' : ''} gevonden
          {selectedTournament && ` voor ${selectedTournament.name}`}
        </div>
      )}

      {/* Debug Info */}
      <MatchesDebug
        selectedTournamentId={selectedTournamentId}
        matches={matches}
        tournaments={tournaments}
        selectedTournament={selectedTournament}
      />
    </div>
  );
}
