
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ScheduleErrorStateProps {
  error: Error;
}

export default function ScheduleErrorState({ error }: ScheduleErrorStateProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schema Genereren</h1>
        <p className="text-muted-foreground">Genereer wedstrijdschema's voor toernooien</p>
      </div>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Fout bij laden van toernooien: {error.message}
        </AlertDescription>
      </Alert>
    </div>
  );
}
