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
import { PlayerGroupMobileCard } from './PlayerGroupMobileCard';

interface TournamentPlayer {
  id: string;
  player: {
    id: string;
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
    <>
      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {title} ({players.length})
          </h3>
        </div>
        {players.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm text-center">{emptyMessage}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {players.map((player) => (
              <PlayerGroupMobileCard
                key={player.id}
                player={player}
                groupName={groupName}
                onGroupChange={onGroupChange}
                onRemovePlayer={onRemovePlayer}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title} ({players.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {players.length === 0 ? (
            <div className="text-gray-500 text-sm p-6">{emptyMessage}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Naam</TableHead>
                    <TableHead className="min-w-[100px]">Ranking</TableHead>
                    <TableHead className="text-right min-w-[200px]">Acties</TableHead>
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
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
