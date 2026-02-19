import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { TournamentForm } from '@/components/TournamentForm';
import { Tournament } from '@/hooks/useTournaments';

interface TournamentHeaderProps {
  tournamentCount: number;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  onCreateTournament: (tournamentData: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
  isCreating: boolean;
  canManage: boolean;
}

export function TournamentHeader({
  tournamentCount,
  showForm,
  setShowForm,
  onCreateTournament,
  isCreating,
  canManage,
}: TournamentHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Toernooien</h1>
        <p className="text-muted-foreground">
          Beheer alle toernooien en competities ({tournamentCount} toernooien)
        </p>
      </div>
      {canManage && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Toernooi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <TournamentForm
              onSubmit={onCreateTournament}
              onCancel={() => setShowForm(false)}
              isSubmitting={isCreating}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
