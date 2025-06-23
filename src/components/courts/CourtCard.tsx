
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';

interface Court {
  id: string;
  name: string;
  background_color?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CourtCardProps {
  court: Court;
  onEdit: (court: Court) => void;
  onDelete: (courtId: string) => void;
}

export default function CourtCard({ court, onEdit, onDelete }: CourtCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{court.name}</CardTitle>
            <CardDescription>
              {court.is_active ? (
                <Badge variant="default">Actief</Badge>
              ) : (
                <Badge variant="secondary">Inactief</Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(court)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(court.id)}>
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
