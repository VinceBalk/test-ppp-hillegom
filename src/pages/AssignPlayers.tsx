
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { usePlayers } from '@/hooks/usePlayers';
import { useTournamentPlayers } from '@/hooks/useTournamentPlayers';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AssignPlayers() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<'left' | 'right'>('left');

  const { tournaments } = useTournaments();
  const { players } = usePlayers();
  const { 
    tournamentPlayers, 
    isLoading, 
    addPlayer, 
    removePlayer, 
    updatePlayerGroup,
    isAddingPlayer 
  } = useTournamentPlayers(tournamentId);

  const tournament = tournaments.find(t => t.id === tournamentId);

  const availablePlayers = players.filter(player => 
    !tournamentPlayers.some(tp => tp.player_id === player.id)
  );

  const handleAddPlayer = () => {
    if (!selectedPlayerId || !tournamentId) return;
    
    addPlayer({
      playerId: selectedPlayerId,
      tournamentId,
      group: selectedGroup
    });
    
    setSelectedPlayerId('');
    setSelectedGroup('left');
  };

  const handleRemovePlayer = (tournamentPlayerId: string) => {
    removePlayer(tournamentPlayerId);
  };

  const handleGroupChange = (tournamentPlayerId: string, newGroup: 'left' | 'right') => {
    updatePlayerGroup({ tournamentPlayerId, group: newGroup });
  };

  const getGroupBadge = (group: string) => {
    return (
      <Badge variant={group === 'left' ? 'default' : 'secondary'}>
        {group === 'left' ? 'Links' : 'Rechts'}
      </Badge>
    );
  };

  // Sort players by group, then by ranking, then by first name
  const sortedTournamentPlayers = [...tournamentPlayers].sort((a, b) => {
    // First sort by group
    if (a.group !== b.group) {
      return a.group === 'left' ? -1 : 1;
    }
    
    // Then by ranking score (higher first)
    const aRanking = a.player?.ranking_score || 0;
    const bRanking = b.player?.ranking_score || 0;
    if (aRanking !== bRanking) {
      return bRanking - aRanking;
    }
    
    // Finally by first name
    const aFirstName = a.player?.name?.split(' ')[0] || '';
    const bFirstName = b.player?.name?.split(' ')[0] || '';
    return aFirstName.localeCompare(bFirstName);
  });

  const leftPlayers = sortedTournamentPlayers.filter(tp => tp.group === 'left');
  const rightPlayers = sortedTournamentPlayers.filter(tp => tp.group === 'right');

  if (isLoading || !tournament) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/tournaments')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar Toernooien
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spelers Toewijzen</h1>
          <p className="text-muted-foreground">
            Toernooi: {tournament.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Player Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Speler Toevoegen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-select">Selecteer Speler</Label>
              <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies een speler..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePlayers.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Groep</Label>
              <RadioGroup 
                value={selectedGroup} 
                onValueChange={(value) => setSelectedGroup(value as 'left' | 'right')}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="left" />
                  <Label htmlFor="left">Links</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="right" />
                  <Label htmlFor="right">Rechts</Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              onClick={handleAddPlayer}
              disabled={!selectedPlayerId || isAddingPlayer}
              className="w-full"
            >
              {isAddingPlayer ? 'Toevoegen...' : 'Speler Toevoegen'}
            </Button>
          </CardContent>
        </Card>

        {/* Tournament Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Toernooi Statistieken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{leftPlayers.length}</div>
                <div className="text-sm text-muted-foreground">Links Groep</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{rightPlayers.length}</div>
                <div className="text-sm text-muted-foreground">Rechts Groep</div>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg col-span-2">
                <div className="text-2xl font-bold text-primary">{tournamentPlayers.length}</div>
                <div className="text-sm text-muted-foreground">Totaal Spelers</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Max: {tournament.max_players || 'Onbeperkt'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Players in Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Links Groep ({leftPlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leftPlayers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nog geen spelers in de linker groep.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Ranking</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leftPlayers.map((tournamentPlayer) => (
                    <TableRow key={tournamentPlayer.id}>
                      <TableCell className="font-medium">
                        {tournamentPlayer.player.name}
                      </TableCell>
                      <TableCell>{tournamentPlayer.player.ranking_score || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGroupChange(
                              tournamentPlayer.id, 
                              'right'
                            )}
                            className="text-xs"
                          >
                            → Rechts
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Speler verwijderen</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Weet je zeker dat je {tournamentPlayer.player.name} wilt verwijderen uit dit toernooi?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleRemovePlayer(tournamentPlayer.id)}
                                >
                                  Verwijderen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Rechts Groep ({rightPlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rightPlayers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nog geen spelers in de rechter groep.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Ranking</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rightPlayers.map((tournamentPlayer) => (
                    <TableRow key={tournamentPlayer.id}>
                      <TableCell className="font-medium">
                        {tournamentPlayer.player.name}
                      </TableCell>
                      <TableCell>{tournamentPlayer.player.ranking_score || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGroupChange(
                              tournamentPlayer.id, 
                              'left'
                            )}
                            className="text-xs"
                          >
                            ← Links
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Speler verwijderen</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Weet je zeker dat je {tournamentPlayer.player.name} wilt verwijderen uit dit toernooi?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleRemovePlayer(tournamentPlayer.id)}
                                >
                                  Verwijderen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
