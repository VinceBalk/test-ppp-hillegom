
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Activity, AlertTriangle } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: 'speler' | 'organisator' | 'beheerder';
  created_at: string;
  updated_at: string;
}

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  is_super_admin: boolean;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  created_at: string;
}

export default function Users() {
  const { isSuperAdmin, logSecurityEvent } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'security'>('users');

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

      setUsers((data || []) as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Fout bij ophalen gebruikers",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    }
  };

  const fetchAdminUsers = async () => {
    if (!isSuperAdmin()) return;
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin users:', error);
        return;
      }

      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const fetchAuditLogs = async () => {
    if (!isSuperAdmin()) return;
    
    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return;
      }

      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
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

      // Log the role change
      await logSecurityEvent('user_role_updated', 'profile', userId, { 
        new_role: newRole 
      });

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
    const loadData = async () => {
      setLoading(true);
      await fetchUsers();
      if (isSuperAdmin()) {
        await fetchAdminUsers();
        await fetchAuditLogs();
      }
      setLoading(false);
    };
    
    loadData();
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

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('failed') || action.includes('error')) {
      return 'destructive';
    }
    if (action.includes('sign_in') || action.includes('sign_up')) {
      return 'default';
    }
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gebruikersbeheer</h1>
          <p className="text-muted-foreground">
            Beheer systeem gebruikers en beveiligingsmonitoring
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <p className="text-muted-foreground">
            Gegevens worden geladen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gebruikersbeheer</h1>
          <p className="text-muted-foreground">
            Beheer systeem gebruikers en beveiligingsmonitoring
          </p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin() && (
            <div className="flex rounded-lg bg-muted p-1">
              <Button
                variant={activeTab === 'users' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('users')}
                className="h-8"
              >
                <Shield className="mr-2 h-4 w-4" />
                Gebruikers
              </Button>
              <Button
                variant={activeTab === 'security' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('security')}
                className="h-8"
              >
                <Activity className="mr-2 h-4 w-4" />
                Beveiliging
              </Button>
            </div>
          )}
          <Button onClick={() => {
            fetchUsers();
            if (isSuperAdmin()) {
              fetchAdminUsers();
              fetchAuditLogs();
            }
          }} variant="outline">
            Vernieuwen
          </Button>
        </div>
      </div>
      
      {activeTab === 'users' && (
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
                  {users.map((user) => {
                    const isAdmin = adminUsers.find(admin => admin.user_id === user.id);
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.email}
                            {isAdmin?.is_super_admin && (
                              <Badge variant="destructive" className="text-xs">
                                Super Admin
                              </Badge>
                            )}
                          </div>
                        </TableCell>
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
                              disabled={isAdmin?.is_super_admin}
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
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && isSuperAdmin() && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Beveiligingslogboek
              </CardTitle>
              <CardDescription>
                Recente beveiligingsgebeurtenissen en gebruikersactiviteiten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Geen beveiligingslogboeken gevonden.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tijdstip</TableHead>
                      <TableHead>Actie</TableHead>
                      <TableHead>Gebruiker</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString('nl-NL')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.user_id ? log.user_id.substring(0, 8) + '...' : 'Systeem'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.resource_type || '-'}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
