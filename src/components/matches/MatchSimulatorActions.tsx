
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Plus } from 'lucide-react';

interface MatchSimulatorActionsProps {
  onSimulate: () => void;
  onReset: () => void;
  onShowSpecials: () => void;
}

export default function MatchSimulatorActions({ 
  onSimulate, 
  onReset, 
  onShowSpecials 
}: MatchSimulatorActionsProps) {
  return (
    <>
      {/* Specials Button */}
      <Button 
        onClick={onShowSpecials} 
        variant="outline" 
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Specials Registreren
      </Button>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button onClick={onSimulate} className="flex-1">
          <Play className="h-4 w-4 mr-2" />
          Simuleren
        </Button>
        <Button onClick={onReset} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
        💡 Dit is een simulator - data wordt niet opgeslagen in de database
      </div>
    </>
  );
}
