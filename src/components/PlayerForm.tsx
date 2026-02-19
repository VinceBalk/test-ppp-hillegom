import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Player } from '@/hooks/usePlayers';
import { supabase } from '@/integrations/supabase/client';

interface AuthUser {
  id: string;
  email: string;
}

interface PlayerFormProps {
  player?: Player;
  onSubmit: (player: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isSuperAdmin?: boolean;
}

export function PlayerForm({ player, onSubmit, onCancel, isSubmitting, isSuperAdmin = false }: PlayerFormProps) {
  const [formData, setFormData] = useState({
    name: player?.name || '',
    email: player?.email || '',
    phone: player?.phone || '',
    group_side: player?.group_side || 'left' as const,
    ranking_score: player?.ranking_score || 0,
    user_id: player?.user_id || null as string | null,
  });

  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);

  // Laad auth users voor superadmin koppeling
  useEffect(() => {
    if (!isSuperAdmin) return;
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .order('email');
      if (!error && data) {
        setAuthUsers(data as AuthUser[]);
      }
    };
    fetchUsers();
  }, [isSuperAdmin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Naam — altijd zichtbaar */}
      <div className="space-y-2">
        <Label htmlFor="name">Naam *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      {/* Email — altijd zichtbaar (eigen speler of superadmin) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      {/* Telefoon — altijd zichtbaar */}
      <div className="space-y-2">
        <Label htmlFor="phone">Telefoon</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      {/* Speelgroep — alleen superadmin */}
      {isSuperAdmin && (
        <div className="space-y-2">
          <Label htmlFor="group_side">Speelgroep</Label>
          <Select
            value={formData.group_side}
            onValueChange={(value) => setFormData({ ...formData, group_side: value as 'left' | 'right' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Links</SelectItem>
              <SelectItem value="right">Rechts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Ranking score — alleen superadmin */}
      {isSuperAdmin && (
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
      )}

      {/* User koppeling — alleen superadmin */}
      {isSuperAdmin && (
        <div className="space-y-2">
          <Label htmlFor="user_id">Gekoppeld account</Label>
          <Select
            value={formData.user_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, user_id: value === 'none' ? null : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Geen account gekoppeld" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground italic">Geen koppeling</span>
              </SelectItem>
              {authUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
  );
}
