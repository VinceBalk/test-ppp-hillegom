import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Activity, AlertTriangle, UserCheck, Clock, Loader2, Link, Unlink } from 'lucide-react';
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

interface Player {
  id: string;
  name: string;
  user_id: string | null;
}

export default function Users() {
  const { isSuperAdmin, logSecurityEvent, hasRole, user } = useAuth();
  const { validateRoleChange } = useSecurityValidation();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
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

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, user_id')
        .order('name');

      if (error) {
        console.error('Error fetching players:', error);
        return;
      }
      setPlayers((data || []) as Player[]);
    } catch (error) {
      console.error('Error fetching players:', error);
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
        toast({ title: "Fout bij bijwerken rol", description: "Gebruiker niet gevonden.", variant: "destructive" });
        return;
      }

      if (!validateRoleChange(userId, oldUser.role, newRole)) {
        toast({ title: "Niet geautoriseerd", description: "Je hebt geen toestemming om deze rolwijziging uit te voeren.", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        let errorMessage = error.message;
        if (error.message?.includes('row-level security')) {
          errorMessage = "Geen toestemming om deze gebruiker te wijzigen.";
        } else if (error.message?.includes('foreign key')) {
          errorMessage = "Ongeldige rolwijziging.";
        }
        toast({ title: "Fout bij bijwerken rol", description: errorMessage, variant: "destructive" });
        return;
      }

      await logSecurityEvent('user_role_updated', 'profile', userId, {
        old_role: oldUser?.role,
        new_role: newRole,
        target_user_email: oldUser?.email
      });

      toast({ title: "Rol bijgewerkt", description: `Gebruikersrol is succesvol bijgewerkt naar ${newRole}.` });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({ title: "Fout bij bijwerken rol", description: "Er is een onverwachte fout opgetreden.", variant: "destructive" });
    }
  };

  /**
   * Koppel een speler aan een user_id.
   * - Eerst de eventuele vorige koppeling van deze user verwijderen (set null)
   * - Dan de nieuwe koppeling leggen
   */
  const linkPlayerToUser = async (userId: string, playerId: string | null) => {
    setLinkingUserId(userId);
    try {
      // Verwijder bestaande koppeling van deze user (mocht die ergens anders staan)
      const { error: clearError } = await supabase
        .from('players')
        .update({ user_id: null })
        .eq('user_id', userId);

      if (clearError) {
        console.error('Error clearing existing player link:', clearError);
        // Niet fataal, doorgaan
      }

      if (playerId) {
        // Nieuwe koppeling leggen
        const { error: linkError } = await supabase
          .from('players')
          .update({ user_id: userId })
          .eq('id', playerId);

        if (linkError) {
          console.error('Error linking player to user:', linkError);
          toast({
            title: "Fout bij koppelen",
            description: linkError.message,
            variant: "destructive",
          });
          return;
        }

        const playerName = players.find(p => p.id === playerId)?.name;
        const userEmail = users.find(u => u.id === userId)?.email;
        toast({
          title: "Koppeling opgeslagen",
          description: `${playerName} is gekoppeld aan ${userEmail}.`,
        });
      } else {
        toast({
          title: "Koppeling verwijderd",
          description: "De spelerkoppeling is verwijderd.",
        });
      }

      await fetchPlayers();
    } catch (error) {
      console.error('Error in linkPlayerToUser:', error);
      toast({ title: "Fout bij koppelen", description: "Er is een onverwachte fout opgetreden.", variant: "destructive" });
    } finally {
      setLinkingUserId(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchPlayers(),
        isSuperAdmin() ? fetchAdminUsers() : Promise.resolve(),
        isSuperAdmin() ? fetchAuditLogs() : Promise.resolve(),
      ]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Geeft de speler terug die gekoppeld is aan een bepaalde user_id
  const getLinkedPlayer = (userId: string): Player | undefined => {
    return players.find(p => p.user_id === userId);
  };

  // Spelers die nog niet gekoppeld zijn (beschikbaar voor dropdown), plus de huidige koppeling
  const getAvailablePlayers = (userId: string): Player[] => {
    const linked = getLinkedPlayer(userId);
    return players.filter(p => p.user_id === null || p.id === linked?.id);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'beheerder': return 'destructive';
      case 'organisator': return 'default';
      case 'speler': return 'secondary';
      default: return 'outline';
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('failed') || action.includes('error') || action.includes('suspicious')) return 'destructive';
    if (action.includes('sign_in') || action.includes('sign_up') || action.includes('access')) return 'default';
    if (action.includes('role_updated') || action.includes('admin')) return 'secondary';
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
              <p className="text-muted-foreground">Je moet ingelogd zijn om gebruikersbeheer te bekijken.</p>
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
              <p className="text-muted-foreground">Je hebt geen toestemming om gebruikersbeheer te bekijken.</p>
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
          <p className="text-muted-foreground">Beheer systeem gebruikers en beveiligingsmonitoring</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-muted-foreground">Gegevens worden geladen...</p>
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
          <p className="text-muted-foreground">Beheer systeem gebruikers en beveiligingsmonitoring</p>
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
          <Button
            onClick={() => {
              fetchUsers();
              fetchPlayers();
              if (isSuperAdmin()) {
                fetchAdminUsers();
                fetchAuditLogs();
              }
            }}
            variant="outline"
            className="w-full md:w-auto"
          >
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
                  <p className="text-muted-foreground text-center">Geen gebruikers gevonden.</p>
                </CardContent>
              </Card>
            ) : (
              users.map((u) => {
                const isAdmin = adminUsers.find(admin => admin.email === u.email);
                const canModifyUser = hasRole('beheerder') && (!isAdmin?.is_super_admin || isSuperAdmin());
                const linkedPlayer = getLinkedPlayer(u.id);

                return (
                  <Card key={u.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.id.slice(0, 8)}…</p>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={getRoleBadgeVariant(u.role) as any}>{u.role}</Badge>
                        {isAdmin?.is_super_admin && <Badge variant="outline">Super Admin</Badge>}
                      </div>
                    </div>

                    {/* Speler koppeling — mobiel */}
                    {isSuperAdmin() && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Link className="h-3 w-3" /> Gekoppelde speler
                        </p>
                        <Select
                          value={linkedPlayer?.id || 'none'}
                          onValueChange={(val) => linkPlayerToUser(u.id, val === 'none' ? null : val)}
                          disabled={linkingUserId === u.id}
                        >
                          <SelectTrigger className="w-full h-8 text-sm">
                            <SelectValue placeholder="Geen speler gekoppeld" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground italic">Geen koppeling</span>
                            </SelectItem>
                            {getAvailablePlayers(u.id).map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {canModifyUser && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Rol wijzigen</p>
                        <Select
                          value={u.role}
                          onValueChange={(newRole: 'speler' | 'organisator' | 'beheerder') => updateUserRole(u.id, newRole)}
                          disabled={!canModifyUser}
                        >
                          <SelectTrigger className="w-full h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="speler">Speler</SelectItem>
                            <SelectItem value="organisator">Organisator</SelectItem>
                            <SelectItem value="beheerder">Beheerder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </Card>
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
                  Overzicht van alle gebruikers, hun rollen en gekoppelde spelerprofielen.
                  {isSuperAdmin() && ' Als superadmin kun je spelers koppelen aan loginaccounts.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        {isSuperAdmin() && <TableHead>Gekoppelde speler</TableHead>}
                        <TableHead>Aangemaakt</TableHead>
                        <TableHead>Bijgewerkt</TableHead>
                        {hasRole('beheerder') && <TableHead>Rol wijzigen</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isSuperAdmin() ? 6 : 5} className="text-center text-muted-foreground py-8">
                            Geen gebruikers gevonden.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => {
                          const isAdmin = adminUsers.find(admin => admin.email === u.email);
                          const canModifyUser = hasRole('beheerder') && (!isAdmin?.is_super_admin || isSuperAdmin());
                          const linkedPlayer = getLinkedPlayer(u.id);

                          return (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div className="space-y-0.5">
                                  <p className="font-medium text-sm">{u.email}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}…</p>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  <Badge variant={getRoleBadgeVariant(u.role) as any}>{u.role}</Badge>
                                  {isAdmin?.is_super_admin && <Badge variant="outline">Super Admin</Badge>}
                                </div>
                              </TableCell>

                              {/* Speler koppeling kolom — alleen superadmin */}
                              {isSuperAdmin() && (
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {linkedPlayer ? (
                                      <Link className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                    ) : (
                                      <Unlink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    )}
                                    <Select
                                      value={linkedPlayer?.id || 'none'}
                                      onValueChange={(val) => linkPlayerToUser(u.id, val === 'none' ? null : val)}
                                      disabled={linkingUserId === u.id}
                                    >
                                      <SelectTrigger className="w-44 h-8 text-sm">
                                        {linkingUserId === u.id ? (
                                          <div className="flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span>Opslaan…</span>
                                          </div>
                                        ) : (
                                          <SelectValue placeholder="Geen koppeling" />
                                        )}
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          <span className="text-muted-foreground italic">Geen koppeling</span>
                                        </SelectItem>
                                        {getAvailablePlayers(u.id).map(p => (
                                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TableCell>
                              )}

                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(u.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(u.updated_at).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </div>
                              </TableCell>

                              {hasRole('beheerder') && (
                                <TableCell>
                                  <Select
                                    value={u.role}
                                    onValueChange={(newRole: 'speler' | 'organisator' | 'beheerder') => updateUserRole(u.id, newRole)}
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
                                    <div className="text-xs text-muted-foreground mt-1">Geen toestemming</div>
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
                  <p className="text-muted-foreground text-center">Geen beveiligingslogboek gevonden.</p>
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
                  <Activity className="h-5 w-5" />
                  Beveiligingslogboek
                </CardTitle>
                <CardDescription>
                  Laatste 100 beveiligingsgebeurtenissen in het systeem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Actie</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Gebruiker</TableHead>
                        <TableHead>Tijdstip</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Geen logboek gevonden.
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge variant={getActionBadgeVariant(log.action) as any}>
                                {formatActionName(log.action)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {log.resource_type || '—'}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {log.user_id ? `${log.user_id.slice(0, 8)}…` : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(log.created_at).toLocaleString('nl-NL')}
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
