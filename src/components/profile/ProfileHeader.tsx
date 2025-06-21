
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

interface ProfileHeaderProps {
  email: string;
  role: string;
}

export function ProfileHeader({ email, role }: ProfileHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profiel Informatie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">E-mailadres</label>
          <p className="text-sm">{email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Rol</label>
          <p className="text-sm capitalize">{role}</p>
        </div>
      </CardContent>
    </Card>
  );
}
