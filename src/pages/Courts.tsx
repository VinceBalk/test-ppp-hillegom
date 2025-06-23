
import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { useCourts } from '@/hooks/useCourts';
import CourtsHeader from '@/components/courts/CourtsHeader';
import CourtsList from '@/components/courts/CourtsList';
import CourtDialog from '@/components/courts/CourtDialog';
import CourtsLoading from '@/components/courts/CourtsLoading';

export default function Courts() {
  const { courts, loading, createCourt, updateCourt, deleteCourt } = useCourts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);

  const handleSubmit = async (formData) => {
    if (editingCourt) {
      await updateCourt(editingCourt.id, formData);
    } else {
      await createCourt(formData);
    }
    
    setDialogOpen(false);
    setEditingCourt(null);
  };

  const handleEdit = (court) => {
    setEditingCourt(court);
    setDialogOpen(true);
  };

  const handleDelete = async (courtId) => {
    await deleteCourt(courtId);
  };

  if (loading) {
    return <CourtsLoading />;
  }

  return (
    <div className="space-y-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <CourtsHeader />
        <CourtDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          court={editingCourt}
          courts={courts}
          onSubmit={handleSubmit}
        />
      </Dialog>

      <CourtsList
        courts={courts}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
