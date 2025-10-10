import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
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

interface TournamentPlayer {
  id: string;
  player: {
    id: string;
    name: string;
    ranking_score?: number;
  };
}

interface PlayerGroupMobileCardProps {
  player: TournamentPlayer;
  groupName: 'left' | 'right';
  onGroupChange: (tournamentPlayerId: string, newGroup: 'left' | 'right') => void;
  onRemovePlayer: (tournamentPlayerId: string) => void;
}

export function PlayerGroupMobileCard({
  player,
  groupName,
  onGroupChange,
  onRemovePlayer,
}: PlayerGroupMobileCardProps) {
  const oppositeGroup = groupName === 'left' ? 'right' : 'left';
  const MoveIcon = groupName === 'left' ? ArrowRight : ArrowLeft;
  const moveButtonLabel = groupName === 'left' ? 'Naar Rechts' : 'Naar Links';

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          <Link
            to={`/players/${player.player.id}`}
            className="text-primary hover:underline"
          >
            {player.player.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Ranking:</span>
          <Badge variant="secondary">
            {player.player.ranking_score ?? '-'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGroupChange(player.id, oppositeGroup)}
            className="w-full"
          >
            <MoveIcon className="h-4 w-4 mr-2" />
            {moveButtonLabel}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Verwijder
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Speler verwijderen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Weet je zeker dat je deze speler uit groep {groupName === 'left' ? 'links' : 'rechts'} wilt verwijderen?
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
      </CardContent>
    </Card>
  );
}
