
import { useState } from 'react';
import { useCourts } from '@/hooks/useCourts';
import CourtsHeader from '@/components/courts/CourtsHeader';
import CourtCard from '@/components/courts/CourtCard';
import CourtDialog from '@/components/courts/CourtDialog';
import CourtsEmptyState from '@/components/courts/CourtsEmptyState';
import CourtsLoadingState from '@/components/courts/CourtsLoadingState';

export default function Courts() {
  const { courts, loading, createCourt, updateCourt, deleteCourt } = useCourts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    background_color: '#ffffff',
    logo_url: '',
    is_active: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingCourt) {
      await updateCourt(editingCourt.id, formData);
    } else {
      await createCourt(formData);
    }
    
    setDialogOpen(false);
    setEditingCourt(null);
    setFormData({
      name: '',
      background_color: '#ffffff',
      logo_url: '',
      is_active: true
    });
  };

  const handleEdit = (court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name,
      background_color: court.background_color || '#ffffff',
      logo_url: court.logo_url || '',
      is_active: court.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (courtId) => {
    if (confirm('Weet je zeker dat je deze baan wilt verwijderen?')) {
      await deleteCourt(courtId);
    }
  };

  const handleNewCourt = () => {
    setEditingCourt(null);
    setFormData({
      name: '',
      background_color: '#ffffff',
      logo_url: '',
      is_active: true
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <CourtsLoadingState />;
  }

  return (
    <div className="space-y-6">
      <CourtsHeader onNewCourt={handleNewCourt} />

      <CourtDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isEditing={!!editingCourt}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courts.map((court) => (
          <CourtCard
            key={court.id}
            court={court}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {courts.length === 0 && <CourtsEmptyState />}
    </div>
  );
}
