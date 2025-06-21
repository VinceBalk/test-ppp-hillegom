import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  player_count?: number;
}

interface Player {
  id: string;
  name: string;
  ranking_score: number;
  row_side: string;
  position: number;
  rank_change: number;
}

interface PlayerWithTrend extends Player {
  trend: 'up' | 'down' | 'same';
}

export default function Dashboard() {
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [recentTournaments, setRecentTournaments] = useState<Tournament[]>([]);
  const [leftRankings, setLeftRankings] = useState<PlayerWithTrend[]>([]);
  const [rightRankings, setRightRankings] = useState<PlayerWithTrend[]>([]);
  const [stats, setStats] = useState({
    activeTournaments: 0,
    totalPlayers: 0,
    matchesToday: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tournaments, players, matchStats] = await Promise.all([
        fetchTournaments(),
        fetchPlayerRankings(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Fout bij laden dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    const { data: current } = await supabase
      .from('tournaments')
      .select('*, tournament_players(count)')
      .in('status', ['open', 'in_progress'])
      .order('start_date', { ascending: true })
      .limit(1);

    if (current && current.length > 0) {
      const t = current[0];
      setCurrentTournament({
        ...t,
        player_count: t.tournament_players?.length || 0
      });
    }

    const { data: recent } = await supabase
      .from('tournaments')
      .select('*, tournament_players(count)')
      .eq('status', 'completed')
      .order('end_date', { ascending: false })
      .limit(3);

    if (recent) {
      setRecentTournaments(
        recent.map(t => ({
          ...t,
          player_count: t.tournament_players?.length || 0
        }))
      );
    }
  };

  const fetchPlayerRankings = async () => {
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .order('ranking_score', { ascending: false });

    if (!players) return;

    const addTrend = (p: Player, index: number): PlayerWithTrend => ({
      ...p,
      position: index + 1,
      trend: p.rank_change > 0 ? 'up' : p.rank_change
