
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface MatchesHeaderProps {
  editMode: boolean;
  onEditModeToggle: () => void;
  onRefresh: () => void;
  hasMatches: boolean;
  hasSelectedTournament: boolean;
}

export default function MatchesHeader({ 
  editMode, 
  onEditModeToggle, 
  onRefresh, 
  hasMatches, 
  hasSelectedTournament 
}: MatchesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
        <p className="text-muted-foreground">Overzicht van alle wedstrijden en resultaten</p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant={editMode ? "default" : "outline"} 
          size="sm"
          disabled={!hasSelectedTournament || !hasMatches}
          onClick={onEditModeToggle}
        >
          {editMode ? 'Bekijk Modus' : 'Bewerk Modus'}
        </Button>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Vernieuwen
        </Button>
      </div>
    </div>
  );
}
