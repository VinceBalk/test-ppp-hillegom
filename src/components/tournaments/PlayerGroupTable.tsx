
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface TournamentPlayer {
  id: string;
  player: {
    name: string;
    ranking_score?: number;
  };
}

interface PlayerGroupTableProps {
  title: string;
  players: TournamentPlayer[];
  groupName: 'left' | 'right';
  onGroupChange: (tournamentPlayerId: string, newGroup: 'left' | 'right') => void;
  onRemovePlayer: (tournamentPlayerId: string) => void;
  emptyMessage: string;
}

export default function PlayerGroupTable({ 
  title, 
  players, 
  groupName, 
  onGroupChange, 
  onRemovePlayer, 
  emptyMessage 
}: PlayerGroupTableProps) {
  const oppositeGroup = groupName === 'left' ? 'right' : 'left';
  const oppositeGroupLabel = groupName === 'left' ? 'Rechts' : 'Links';
  const moveButtonLabel = groupName === 'left' ? '→ Rechts' : '← Links';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title} ({players.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
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
              {players.map((tournamentPlayer) => (
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
                        onClick={() => onGroupChange(tournamentPlayer.id, oppositeGroup)}
                        className="text-xs"
                      >
                        {moveButtonLabel}
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
                              onClick={() => onRemovePlayer(tournamentPlayer.id)}
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
  );
}
