
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CourtFormData {
  name: string;
  background_color: string;
  logo_url: string;
  is_active: boolean;
}

interface CourtFormProps {
  formData: CourtFormData;
  setFormData: (data: CourtFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export default function CourtForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  isEditing 
}: CourtFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Naam</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Baan naam"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="background_color">Achtergrondkleur</Label>
        <Input
          id="background_color"
          type="color"
          value={formData.background_color}
          onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="logo_url">Logo URL (optioneel)</Label>
        <Input
          id="logo_url"
          value={formData.logo_url}
          onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
          placeholder="https://example.com/logo.png"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Actief</Label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
        <Button type="submit">
          {isEditing ? 'Bijwerken' : 'Aanmaken'}
        </Button>
      </div>
    </form>
  );
}
