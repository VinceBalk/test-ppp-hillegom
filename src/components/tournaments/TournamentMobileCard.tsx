import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tournament } from '@/hooks/useTournaments';
import { Pencil, Trash2, Users, TrendingUp, PlayCircle, CheckCircle } from 'lucide-react';
import { TournamentStatusBadge } from './TournamentStatusBadge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface TournamentMobileCardProps {
  tournament: Tournament;
  onEdit: (tournament: Tournament) => void;
  onDelete: (id: string) => void;
  onAssignPlayers: (id: string) => void;
  onViewStandings: (id: string) => void;
  isDeleting: boolean;
}

export function TournamentMobileCard({
  tournament,
  onEdit,
  onDelete,
  onAssignPlayers,
  onViewStandings,
  isDeleting
}: TournamentMobileCardProps) {
  const { toast } = useToast();
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleToggleStatus = async () => {
    const newStatus = tournament.status === 'completed' ? 'in_progress' : 'completed';
    setIsTogglingStatus(true);

    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: newStatus })
        .eq('id', tournament.id);

      if (error) throw error;

      toast({
        title: 'Status gewijzigd',
        description: `Toernooi status is gewijzigd naar ${newStatus === 'completed' ? 'Voltooid' : 'Bezig'}`,
      });

      // Reload to refresh data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Kon status niet wijzigen',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{tournament.name}</CardTitle>
            {tournament.description && (
              <CardDescription className="mt-1">{tournament.description}</CardDescription>
            )}
          </div>
          <TournamentStatusBadge status={tournament.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Datums:</span>
            <span className="font-medium">
              {format(new Date(tournament.start_date), 'dd-MM-yyyy')} - {format(new Date(tournament.end_date), 'dd-MM-yyyy')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Spelers:</span>
            <span className="font-medium">{tournament.max_players}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inschrijfgeld:</span>
            <span className="font-medium">€{tournament.entry_fee?.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewStandings(tournament.id)}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Stand
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAssignPlayers(tournament.id)}
            >
              <Users className="h-4 w-4 mr-2" />
              Spelers
            </Button>
          </div>
          
          {(tournament.status === 'completed' || tournament.status === 'in_progress') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              className="w-full"
            >
              {tournament.status === 'completed' ? (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Zet op Bezig (om scores in te voeren)
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Zet op Voltooid
                </>
              )}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(tournament)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Bewerken
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDelete(tournament.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Verwijderen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
