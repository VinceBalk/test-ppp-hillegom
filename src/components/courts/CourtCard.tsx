
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';

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

interface CourtCardProps {
  court: Court;
  onEdit: (court: Court) => void;
  onDelete: (courtId: string) => void;
}

const getColumnFromRowSide = (rowSide?: string) => {
  if (rowSide === 'left') {
    return { name: 'Links', color: 'bg-green-100 text-green-800' };
  } else {
    return { name: 'Rechts', color: 'bg-purple-100 text-purple-800' };
  }
};

export default function CourtCard({ court, onEdit, onDelete }: CourtCardProps) {
  const column = getColumnFromRowSide(court.row_side);

  const handleDelete = () => {
    if (confirm('Weet je zeker dat je deze baan wilt verwijderen?')) {
      onDelete(court.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {court.name}
              <Badge className={column.color}>
                {column.name}
              </Badge>
            </CardTitle>
            <CardDescription className="space-y-1">
              <div>
                {court.is_active ? (
                  <Badge variant="default">Actief</Badge>
                ) : (
                  <Badge variant="secondary">Inactief</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Volgorde: {court.menu_order}
              </div>
            </CardDescription>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(court)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: court.background_color || '#ffffff' }}
            />
            <span className="text-sm text-muted-foreground">
              {court.background_color || '#ffffff'}
            </span>
          </div>
          {court.logo_url && (
            <p className="text-sm text-muted-foreground">Logo: {court.logo_url}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
