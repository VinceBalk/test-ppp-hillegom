
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
    skill_level: player?.skill_level || 'beginner' as const,
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
            <Label htmlFor="skill_level">Niveau</Label>
            <Select value={formData.skill_level} onValueChange={(value) => setFormData({ ...formData, skill_level: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Gemiddeld</SelectItem>
                <SelectItem value="advanced">Gevorderd</SelectItem>
              </SelectContent>
            </Select>
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
