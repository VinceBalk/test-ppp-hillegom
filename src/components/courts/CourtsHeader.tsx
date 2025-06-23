
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

export default function CourtsHeader() {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Banen</h1>
        <p className="text-muted-foreground">Beheer toernooi banen en hun kolom-indeling</p>
      </div>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Baan
        </Button>
      </DialogTrigger>
    </div>
  );
}
