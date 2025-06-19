
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tournament } from '@/hooks/useTournaments';

interface TournamentFormProps {
  tournament?: Tournament;
  onSubmit: (tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function TournamentForm({ tournament, onSubmit, onCancel, isSubmitting }: TournamentFormProps) {
  const [formData, setFormData] = useState({
    name: tournament?.name || '',
    description: tournament?.description || '',
    start_date: tournament?.start_date || '',
    end_date: tournament?.end_date || '',
    max_players: tournament?.max_players || 16,
    entry_fee: tournament?.entry_fee || 0,
    status: tournament?.status || 'draft' as const,
    tournament_type: tournament?.tournament_type || 'single_elimination' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{tournament ? 'Toernooi Bewerken' : 'Nieuw Toernooi'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdatum *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Einddatum *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_players">Max Spelers</Label>
              <Input
                id="max_players"
                type="number"
                min="2"
                value={formData.max_players}
                onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) || 16 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry_fee">Inschrijfgeld (€)</Label>
              <Input
                id="entry_fee"
                type="number"
                min="0"
                step="0.01"
                value={formData.entry_fee}
                onChange={(e) => setFormData({ ...formData, entry_fee: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tournament_type">Type Toernooi</Label>
            <Select value={formData.tournament_type} onValueChange={(value) => setFormData({ ...formData, tournament_type: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_elimination">Enkele Eliminatie</SelectItem>
                <SelectItem value="double_elimination">Dubbele Eliminatie</SelectItem>
                <SelectItem value="round_robin">Round Robin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Concept</SelectItem>
                <SelectItem value="open">Open voor inschrijving</SelectItem>
                <SelectItem value="in_progress">Bezig</SelectItem>
                <SelectItem value="completed">Voltooid</SelectItem>
                <SelectItem value="cancelled">Geannuleerd</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting || !formData.name.trim() || !formData.start_date || !formData.end_date}>
              {isSubmitting ? 'Bezig...' : tournament ? 'Bijwerken' : 'Toevoegen'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuleren
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
