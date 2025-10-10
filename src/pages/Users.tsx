
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Activity, AlertTriangle, UserCheck, Clock, Loader2 } from 'lucide-react';
import { useSecurityValidation } from '@/hooks/useSecurityValidation';
import { UserMobileCard } from '@/components/users/UserMobileCard';
import { SecurityLogMobileCard } from '@/components/users/SecurityLogMobileCard';

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
  const { isSuperAdmin, logSecurityEvent, hasRole, user } = useAuth();
  const { validateRoleChange } = useSecurityValidation();
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
      
      // Log user management access for security monitoring
      await logSecurityEvent('user_management_accessed', 'admin', null, {
        total_users: data?.length || 0
      });
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
        .limit(100);

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
      const oldUser = users.find(u => u.id === userId);
      if (!oldUser) {
        toast({
          title: "Fout bij bijwerken rol",
          description: "Gebruiker niet gevonden.",
          variant: "destructive",
        });
        return;
      }

      // Security validation before attempting role change
      if (!validateRoleChange(userId, oldUser.role, newRole)) {
        toast({
          title: "Niet geautoriseerd",
          description: "Je hebt geen toestemming om deze rolwijziging uit te voeren.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        
        // Enhanced error handling
        let errorMessage = error.message;
        if (error.message?.includes('row-level security')) {
          errorMessage = "Geen toestemming om deze gebruiker te wijzigen.";
        } else if (error.message?.includes('foreign key')) {
          errorMessage = "Ongeldige rolwijziging.";
        }
        
        toast({
          title: "Fout bij bijwerken rol",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Log the role change with detailed information
      await logSecurityEvent('user_role_updated', 'profile', userId, { 
        old_role: oldUser?.role,
        new_role: newRole,
        target_user_email: oldUser?.email
      });

      toast({
        title: "Rol bijgewerkt",
        description: `Gebruikersrol is succesvol bijgewerkt naar ${newRole}.`,
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
    
    // Only load data if user is authenticated
    if (user) {
      loadData();
    }
  }, [user, isSuperAdmin]);

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
    if (action.includes('failed') || action.includes('error') || action.includes('suspicious')) {
      return 'destructive';
    }
    if (action.includes('sign_in') || action.includes('sign_up') || action.includes('access')) {
      return 'default';
    }
    if (action.includes('role_updated') || action.includes('admin')) {
      return 'secondary';
    }
    return 'outline';
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Inloggen vereist</h3>
              <p className="text-muted-foreground">
                Je moet ingelogd zijn om gebruikersbeheer te bekijken.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasRole('beheerder')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Toegang geweigerd</h3>
              <p className="text-muted-foreground">
                Je hebt geen toestemming om gebruikersbeheer te bekijken.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-muted-foreground">
              Gegevens worden geladen...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gebruikersbeheer</h1>
          <p className="text-muted-foreground">
            Beheer systeem gebruikers en beveiligingsmonitoring
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row w-full md:w-auto">
          {isSuperAdmin() && (
            <div className="flex rounded-lg bg-muted p-1 w-full md:w-auto">
              <Button
                variant={activeTab === 'users' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('users')}
                className="h-8 flex-1 md:flex-none"
              >
                <Shield className="mr-2 h-4 w-4" />
                Gebruikers
              </Button>
              <Button
                variant={activeTab === 'security' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('security')}
                className="h-8 flex-1 md:flex-none"
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
          }} variant="outline" className="w-full md:w-auto">
            Vernieuwen
          </Button>
        </div>
      </div>
      
      {activeTab === 'users' && (
        <>
          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {users.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    Geen gebruikers gevonden.
                  </p>
                </CardContent>
              </Card>
            ) : (
              users.map((user) => {
                const isAdmin = adminUsers.find(admin => admin.email === user.email);
                const canModifyUser = hasRole('beheerder') && (!isAdmin?.is_super_admin || isSuperAdmin());
                
                return (
                  <UserMobileCard
                    key={user.id}
                    user={user}
                    isSuperAdmin={!!isAdmin?.is_super_admin}
                    canModifyUser={canModifyUser}
                    onRoleChange={updateUserRole}
                    getRoleBadgeVariant={getRoleBadgeVariant}
                  />
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Geregistreerde Gebruikers
                </CardTitle>
                <CardDescription>
                  Overzicht van alle gebruikers en hun rollen in het systeem. Alleen beheerders kunnen gebruikersrollen wijzigen.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[100px]">Rol</TableHead>
                        <TableHead className="min-w-[120px]">Aangemaakt</TableHead>
                        <TableHead className="min-w-[120px]">Laatst bijgewerkt</TableHead>
                        {hasRole('beheerder') && <TableHead className="min-w-[140px]">Acties</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Geen gebruikers gevonden.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => {
                          const isAdmin = adminUsers.find(admin => admin.email === user.email);
                          const canModifyUser = hasRole('beheerder') && (!isAdmin?.is_super_admin || isSuperAdmin());
                          
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
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  {new Date(user.created_at).toLocaleDateString('nl-NL', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  {new Date(user.updated_at).toLocaleDateString('nl-NL', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </div>
                              </TableCell>
                              {hasRole('beheerder') && (
                                <TableCell>
                                  <Select
                                    value={user.role}
                                    onValueChange={(newRole: 'speler' | 'organisator' | 'beheerder') => 
                                      updateUserRole(user.id, newRole)
                                    }
                                    disabled={!canModifyUser}
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
                                  {!canModifyUser && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Geen toestemming
                                    </div>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'security' && isSuperAdmin() && (
        <>
          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {auditLogs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    Geen beveiligingslogboeken gevonden.
                  </p>
                </CardContent>
              </Card>
            ) : (
              auditLogs.map((log) => (
                <SecurityLogMobileCard
                  key={log.id}
                  log={log}
                  getActionBadgeVariant={getActionBadgeVariant}
                  formatActionName={formatActionName}
                />
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Beveiligingslogboek
                </CardTitle>
                <CardDescription>
                  Recente beveiligingsgebeurtenissen en gebruikersactiviteiten. Alleen super admins kunnen deze informatie bekijken.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[160px]">Tijdstip</TableHead>
                        <TableHead className="min-w-[140px]">Actie</TableHead>
                        <TableHead className="min-w-[120px]">Gebruiker</TableHead>
                        <TableHead className="min-w-[100px]">Resource</TableHead>
                        <TableHead className="min-w-[140px]">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Geen beveiligingslogboeken gevonden.
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {new Date(log.created_at).toLocaleString('nl-NL', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getActionBadgeVariant(log.action)}>
                                {formatActionName(log.action)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.user_id ? (
                                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                                  {log.user_id.substring(0, 8)}...
                                </code>
                              ) : (
                                <span className="text-muted-foreground">Systeem</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.resource_type ? (
                                <Badge variant="outline" className="text-xs">
                                  {log.resource_type}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm max-w-xs">
                              {log.details ? (
                                <details className="cursor-pointer">
                                  <summary className="text-blue-600 hover:text-blue-800">
                                    Details bekijken
                                  </summary>
                                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </details>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
