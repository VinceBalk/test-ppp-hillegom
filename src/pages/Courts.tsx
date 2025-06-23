
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useCourts } from '@/hooks/useCourts';

export default function Courts() {
  const { courts, loading, createCourt, updateCourt, deleteCourt } = useCourts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    background_color: '#ffffff',
    logo_url: '',
    menu_order: 0,
    is_active: true
  });

  const getColumnFromMenuOrder = (menuOrder: number) => {
    if (menuOrder % 2 === 1) {
      return { name: 'Links', color: 'bg-green-100 text-green-800' };
    } else {
      return { name: 'Rechts', color: 'bg-purple-100 text-purple-800' };
    }
  };

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
      menu_order: 0,
      is_active: true
    });
  };

  const handleEdit = (court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name,
      background_color: court.background_color || '#ffffff',
      logo_url: court.logo_url || '',
      menu_order: court.menu_order || 0,
      is_active: court.is_active
    });
    setDialogOpen(true);
  };

  const handleColumnChange = (column: string) => {
    // Get the highest menu_order for the selected column
    const courtsInColumn = courts.filter(court => {
      const isOdd = court.menu_order % 2 === 1;
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

  const handleDelete = async (courtId) => {
    if (confirm('Weet je zeker dat je deze baan wilt verwijderen?')) {
      await deleteCourt(courtId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banen</h1>
          <p className="text-muted-foreground">Beheer toernooi banen</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banen</h1>
          <p className="text-muted-foreground">Beheer toernooi banen en hun kolom-indeling</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Baan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCourt ? 'Baan bewerken' : 'Nieuwe baan aanmaken'}</DialogTitle>
              <DialogDescription>
                {editingCourt ? 'Wijzig de gegevens van de baan.' : 'Voeg een nieuwe baan toe aan het systeem.'}
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
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  {editingCourt ? 'Bijwerken' : 'Aanmaken'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courts.map((court) => {
          const column = getColumnFromMenuOrder(court.menu_order);
          return (
            <Card key={court.id}>
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
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(court)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(court.id)}>
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
        })}
      </div>

      {courts.length === 0 && (
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
      )}
    </div>
  );
}
