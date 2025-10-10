import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface SpecialType {
  id: string;
  name: string;
  is_tiebreaker: boolean;
  is_active: boolean;
  created_at: string;
}

interface SpecialMobileCardProps {
  special: SpecialType;
  onEdit: (special: SpecialType) => void;
  onDelete: (id: string) => void;
}

export function SpecialMobileCard({ special, onEdit, onDelete }: SpecialMobileCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{special.name}</CardTitle>
          <div className="flex gap-2">
            {special.is_tiebreaker ? (
              <Badge variant="secondary">Tiebreaker</Badge>
            ) : (
              <Badge variant="outline">Normaal</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            {special.is_active ? (
              <Badge variant="default">Actief</Badge>
            ) : (
              <Badge variant="destructive">Inactief</Badge>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aangemaakt:</span>
            <span className="font-medium">
              {new Date(special.created_at).toLocaleDateString('nl-NL')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(special)}
            className="w-full"
          >
            <Edit className="h-4 w-4 mr-2" />
            Bewerken
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Verwijderen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Special verwijderen</AlertDialogTitle>
                <AlertDialogDescription>
                  Weet je zeker dat je "{special.name}" wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(special.id)}>
                  Verwijderen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
