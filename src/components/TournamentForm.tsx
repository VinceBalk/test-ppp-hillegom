
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tournament } from '@/hooks/useTournaments';

interface TournamentFormProps {
  tournament?: Tournament;
  onSubmit: (tournamentData: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TournamentForm({ 
  tournament, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: TournamentFormProps) {
  const [formData, setFormData] = useState({
    name: tournament?.name || '',
    description: tournament?.description || '',
    start_date: tournament?.start_date || new Date().toISOString().split('T')[0],
    end_date: tournament?.end_date || new Date().toISOString().split('T')[0],
    max_players: tournament?.max_players || 16,
    entry_fee: tournament?.entry_fee || 0,
    status: tournament?.status || 'draft'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {tournament ? 'Toernooi Bewerken' : 'Nieuw Toernooi'}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Naam *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="description">Beschrijving</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Startdatum *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="end_date">Einddatum *</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="max_players">Max Spelers</Label>
            <Input
              id="max_players"
              type="number"
              min="4"
              max="64"
              value={formData.max_players}
              onChange={(e) => handleInputChange('max_players', parseInt(e.target.value) || 16)}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="entry_fee">Inschrijfgeld (€)</Label>
            <Input
              id="entry_fee"
              type="number"
              min="0"
              step="0.01"
              value={formData.entry_fee}
              onChange={(e) => handleInputChange('entry_fee', parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleInputChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Concept</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">Bezig</SelectItem>
              <SelectItem value="completed">Voltooid</SelectItem>
              <SelectItem value="cancelled">Geannuleerd</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuleren
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (tournament ? 'Bijwerken...' : 'Aanmaken...') 
              : (tournament ? 'Bijwerken' : 'Aanmaken')
            }
          </Button>
        </div>
      </form>
    </>
  );
}
