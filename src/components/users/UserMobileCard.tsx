import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: 'speler' | 'organisator' | 'beheerder';
  created_at: string;
  updated_at: string;
}

interface UserMobileCardProps {
  user: UserProfile;
  isSuperAdmin: boolean;
  canModifyUser: boolean;
  onRoleChange: (userId: string, newRole: 'speler' | 'organisator' | 'beheerder') => void;
  getRoleBadgeVariant: (role: string) => 'default' | 'destructive' | 'secondary' | 'outline';
}

export function UserMobileCard({ 
  user, 
  isSuperAdmin, 
  canModifyUser, 
  onRoleChange, 
  getRoleBadgeVariant 
}: UserMobileCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base font-medium break-all">{user.email}</CardTitle>
          </div>
          {isSuperAdmin && (
            <Badge variant="destructive" className="text-xs shrink-0">
              Super Admin
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Rol:</span>
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {user.role}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Aangemaakt:</span>
            <span className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {new Date(user.created_at).toLocaleDateString('nl-NL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Bijgewerkt:</span>
            <span className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {new Date(user.updated_at).toLocaleDateString('nl-NL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rol wijzigen</label>
            <Select
              value={user.role}
              onValueChange={(newRole: 'speler' | 'organisator' | 'beheerder') => 
                onRoleChange(user.id, newRole)
              }
              disabled={!canModifyUser}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="speler">Speler</SelectItem>
                <SelectItem value="organisator">Organisator</SelectItem>
                <SelectItem value="beheerder">Beheerder</SelectItem>
              </SelectContent>
            </Select>
            {!canModifyUser && (
              <p className="text-xs text-muted-foreground">
                Geen toestemming
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
