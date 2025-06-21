
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSpecialTypes } from '@/hooks/useSpecialTypes';

export default function Specials() {
  const { specialTypes, loading, createSpecialType, updateSpecialType, deleteSpecialType } = useSpecialTypes();
  const [showForm, setShowForm] = useState(false);
  const [editingSpecial, setEditingSpecial] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    is_tiebreaker: false,
    is_active: true
  });

  const filteredSpecials = specialTypes.filter(special =>
    special.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSpecial) {
      await updateSpecialType(editingSpecial.id, formData);
      setEditingSpecial(null);
    } else {
      await createSpecialType(formData);
    }
    
    setFormData({ name: '', is_tiebreaker: false, is_active: true });
    setShowForm(false);
  };

  const handleEdit = (special: any) => {
    setEditingSpecial(special);
    setFormData({
      name: special.name,
      is_tiebreaker: special.is_tiebreaker,
      is_active: special.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteSpecialType(id);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSpecial(null);
    setFormData({ name: '', is_tiebreaker: false, is_active: true });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Specials</h1>
          <p className="text-muted-foreground">
            Beheer special types en tiebreakers
          </p>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Specials</h1>
          <p className="text-muted-foreground">
            Beheer special types en tiebreakers ({specialTypes.length} specials)
          </p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Special
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSpecial ? 'Special Bewerken' : 'Nieuwe Special Toevoegen'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Bijv. Hattrick, Zes op een rij..."
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_tiebreaker"
                  checked={formData.is_tiebreaker}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_tiebreaker: checked })}
                />
                <Label htmlFor="is_tiebreaker">Is Tiebreaker</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Actief</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Annuleren
                </Button>
                <Button type="submit">
                  {editingSpecial ? 'Bijwerken' : 'Toevoegen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Specials Overzicht</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek specials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aangemaakt</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSpecials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Geen specials gevonden die voldoen aan de zoekterm.' : 'Nog geen specials toegevoegd.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSpecials.map((special) => (
                  <TableRow key={special.id}>
                    <TableCell className="font-medium">{special.name}</TableCell>
                    <TableCell>
                      {special.is_tiebreaker ? (
                        <Badge variant="secondary">Tiebreaker</Badge>
                      ) : (
                        <Badge variant="outline">Normaal</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {special.is_active ? (
                        <Badge variant="default">Actief</Badge>
                      ) : (
                        <Badge variant="destructive">Inactief</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(special.created_at).toLocaleDateString('nl-NL')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(special)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
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
                              <AlertDialogAction onClick={() => handleDelete(special.id)}>
                                Verwijderen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
