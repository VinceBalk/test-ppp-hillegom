import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TournamentPlayer {
  id: string;
  player: {
    id: string; // ✅ toegevoegd voor doorklikken
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
  emptyMessage,
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
          <div className="text-gray-500 text-sm">{emptyMessage}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Ranking</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/players/${player.player.id}`}
                      className="text-blue-600 hover:text-orange-600 hover:underline transition-colors"
                    >
                      {player.player.name}
                    </Link>
                  </TableCell>
                  <TableCell>{player.player.ranking_score ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onGroupChange(player.id, oppositeGroup)}
                      >
                        {moveButtonLabel}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Speler verwijderen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Weet je zeker dat je deze speler uit groep {groupName} wilt verwijderen?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuleer</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRemovePlayer(player.id)}>
                              Verwijder
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
