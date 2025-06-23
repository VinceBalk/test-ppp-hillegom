
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CourtsHeaderProps {
  onNewCourt: () => void;
}

export default function CourtsHeader({ onNewCourt }: CourtsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Banen</h1>
        <p className="text-muted-foreground">Beheer toernooi banen</p>
      </div>
      <Button onClick={onNewCourt}>
        <Plus className="h-4 w-4 mr-2" />
        Nieuwe Baan
      </Button>
    </div>
  );
}
