
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Court {
  id: string;
  name: string;
  background_color?: string;
  logo_url?: string;
  is_active: boolean;
  menu_order: number;
  created_at: string;
  updated_at: string;
}

interface CourtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  court: Court | null;
  courts: Court[];
  onSubmit: (formData: any) => Promise<void>;
}

export default function CourtDialog({ open, onOpenChange, court, courts, onSubmit }: CourtDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    background_color: '#ffffff',
    logo_url: '',
    menu_order: 0,
    is_active: true
  });

  useEffect(() => {
    if (court) {
      setFormData({
        name: court.name,
        background_color: court.background_color || '#ffffff',
        logo_url: court.logo_url || '',
        menu_order: court.menu_order || 0,
        is_active: court.is_active
      });
    } else {
      setFormData({
        name: '',
        background_color: '#ffffff',
        logo_url: '',
        menu_order: 0,
        is_active: true
      });
    }
  }, [court]);

  const handleColumnChange = (column: string) => {
    // Get the highest menu_order for the selected column
    const courtsInColumn = courts.filter(c => {
      const isOdd = c.menu_order % 2 === 1;
      return column === 'left' ? isOdd : !isOdd;
    });
    
    let newMenuOrder;
    if (courtsInColumn.length === 0) {
      // First court in this column
      newMenuOrder = column === 'left' ? 1 : 2;
    } else {
      // Find the highest menu_order in this column and add 2
      const maxOrder = Math.max(...courtsInColumn.map(c => c.menu_order));
      newMenuOrder = maxOrder + 2;
    }
    
    setFormData(prev => ({
      ...prev,
      menu_order: newMenuOrder
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{court ? 'Baan bewerken' : 'Nieuwe baan aanmaken'}</DialogTitle>
          <DialogDescription>
            {court ? 'Wijzig de gegevens van de baan.' : 'Voeg een nieuwe baan toe aan het systeem.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Baan naam"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="column">Kolom</Label>
            <Select
              value={formData.menu_order % 2 === 1 ? 'left' : 'right'}
              onValueChange={handleColumnChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer kolom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Links (Groene kolom)</SelectItem>
                <SelectItem value="right">Rechts (Paarse kolom)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Menu volgorde wordt automatisch ingesteld: {formData.menu_order}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="menu_order">Menu volgorde (handmatig)</Label>
            <Input
              id="menu_order"
              type="number"
              value={formData.menu_order}
              onChange={(e) => setFormData(prev => ({ ...prev, menu_order: parseInt(e.target.value) || 0 }))}
              placeholder="Volgorde nummer"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Oneven nummers = Links, Even nummers = Rechts
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="background_color">Achtergrondkleur</Label>
            <Input
              id="background_color"
              type="color"
              value={formData.background_color}
              onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL (optioneel)</Label>
            <Input
              id="logo_url"
              value={formData.logo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Actief</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit">
              {court ? 'Bijwerken' : 'Aanmaken'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
