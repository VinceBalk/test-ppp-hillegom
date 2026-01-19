import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { TournamentPlayer } from '@/hooks/useTournamentPlayers';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {players.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {emptyMessage}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead className="text-center">Ranking</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player, index) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {player.player.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono">
                        {player.player.ranking_score?.toFixed(1) || '0.0'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onGroupChange(player.id, oppositeGroup)}
                          className="text-xs"
                        >
                          → {oppositeGroup === 'left' ? 'Links' : 'Rechts'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onRemovePlayer(player.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
  );
}
