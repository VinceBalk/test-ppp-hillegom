
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
}

export function TournamentHeader({ 
  tournamentCount, 
  showForm, 
  setShowForm, 
  onCreateTournament, 
  isCreating 
}: TournamentHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Toernooien</h1>
        <p className="text-muted-foreground">
          Beheer alle toernooien en competities ({tournamentCount} toernooien)
        </p>
      </div>
      
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogTrigger asChild>
          <Button>
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
    </div>
  );
}
