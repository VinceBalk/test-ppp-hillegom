import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  id: string;
  email: string;
  role: 'speler' | 'organisator' | 'beheerder';
  created_at: string;
  updated_at: string;
}

export default function Users() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Fout bij ophalen gebruikers",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Type assertion to ensure role is one of our expected values
      setUsers((data || []) as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Fout bij ophalen gebruikers",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'speler' | 'organisator' | 'beheerder') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: "Fout bij bijwerken rol",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Rol bijgewerkt",
        description: "De gebruikersrol is succesvol bijgewerkt.",
      });

      // Refresh the users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Fout bij bijwerken rol",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'beheerder':
        return 'destructive';
      case 'organisator':
        return 'default';
      case 'speler':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gebruikers</h1>
          <p className="text-muted-foreground">
            Beheer systeem gebruikers en rechten
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <p className="text-muted-foreground">
            Gebruikers worden geladen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gebruikers</h1>
          <p className="text-muted-foreground">
            Beheer systeem gebruikers en rechten
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          Vernieuwen
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Geregistreerde Gebruikers</CardTitle>
          <CardDescription>
            Overzicht van alle gebruikers en hun rollen in het systeem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Geen gebruikers gevonden.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead>Laatst bijgewerkt</TableHead>
                  {isSuperAdmin() && <TableHead>Acties</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('nl-NL')}
                    </TableCell>
                    <TableCell>
                      {new Date(user.updated_at).toLocaleDateString('nl-NL')}
                    </TableCell>
                    {isSuperAdmin() && (
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(newRole: 'speler' | 'organisator' | 'beheerder') => 
                            updateUserRole(user.id, newRole)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="speler">Speler</SelectItem>
                            <SelectItem value="organisator">Organisator</SelectItem>
                            <SelectItem value="beheerder">Beheerder</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
