
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStatsProps {
  stats: {
    activeTournaments: number;
    totalPlayers: number;
    matchesToday: number;
  };
  recentTournaments: Array<{ name: string }>;
}

export function DashboardStats({ stats, recentTournaments }: DashboardStatsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/tournaments')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Actieve Toernooien</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeTournaments}</div>
        </CardContent>
      </Card>
      
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/players')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spelers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPlayers}</div>
        </CardContent>
      </Card>
      
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/matches')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Geplande Wedstrijden</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.matchesToday}</div>
        </CardContent>
      </Card>
      
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/tournaments')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Laatste Toernooi</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium truncate">{recentTournaments[0]?.name || 'Geen recent toernooi'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
