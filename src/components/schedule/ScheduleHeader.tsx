
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScheduleHeaderProps {
  tournamentName: string;
}

export default function ScheduleHeader({ tournamentName }: ScheduleHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate('/tournaments')}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar Toernooien
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schema Genereren</h1>
        <p className="text-muted-foreground">
          Genereer wedstrijdschema voor {tournamentName}
        </p>
      </div>
    </div>
  );
}
