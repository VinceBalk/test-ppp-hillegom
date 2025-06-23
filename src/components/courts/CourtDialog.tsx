
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CourtForm from './CourtForm';

interface CourtFormData {
  name: string;
  background_color: string;
  logo_url: string;
  is_active: boolean;
}

interface CourtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CourtFormData;
  setFormData: (data: CourtFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
}

export default function CourtDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isEditing
}: CourtDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Baan bewerken' : 'Nieuwe baan aanmaken'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Wijzig de gegevens van de baan.' : 'Voeg een nieuwe baan toe aan het systeem.'}
          </DialogDescription>
        </DialogHeader>
        <CourtForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  );
}
