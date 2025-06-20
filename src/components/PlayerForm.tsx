
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Player } from '@/hooks/usePlayers';

interface PlayerFormProps {
  player?: Player;
  onSubmit: (player: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function PlayerForm({ player, onSubmit, onCancel, isSubmitting }: PlayerFormProps) {
  const [formData, setFormData] = useState({
    name: player?.name || '',
    email: player?.email || '',
    phone: player?.phone || '',
    group_side: player?.group_side || 'left' as const,
    ranking_score: player?.ranking_score || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{player ? 'Speler Bewerken' : 'Nieuwe Speler'}</CardTitle>
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefoon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group_side">Speelgroep</Label>
            <Select value={formData.group_side} onValueChange={(value) => setFormData({ ...formData, group_side: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Links</SelectItem>
                <SelectItem value="right">Rechts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ranking_score">Ranking Score</Label>
            <Input
              id="ranking_score"
              type="number"
              min="0"
              value={formData.ranking_score}
              onChange={(e) => setFormData({ ...formData, ranking_score: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? 'Bezig...' : player ? 'Bijwerken' : 'Toevoegen'}
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
