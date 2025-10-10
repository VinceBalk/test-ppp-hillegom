
import { Card, CardContent } from '@/components/ui/card';
import CourtCard from './CourtCard';

interface Court {
  id: string;
  name: string;
  background_color?: string;
  logo_url?: string;
  is_active: boolean;
  menu_order: number;
  row_side?: string;
  created_at: string;
  updated_at: string;
}

interface CourtsListProps {
  courts: Court[];
  onEdit: (court: Court) => void;
  onDelete: (courtId: string) => void;
}

export default function CourtsList({ courts, onEdit, onDelete }: CourtsListProps) {
  if (courts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground">Nog geen banen aangemaakt</p>
            <p className="text-sm text-muted-foreground mt-1">
              Klik op "Nieuwe Baan" om te beginnen.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid-3">
      {courts.map((court) => (
        <CourtCard
          key={court.id}
          court={court}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
