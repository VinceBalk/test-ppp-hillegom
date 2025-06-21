
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users } from 'lucide-react';

interface Player {
  id: string;
  player_id: string;
  group: 'left' | 'right';
  player: {
    id: string;
    name: string;
    ranking_score?: number;
  };
}

interface ManualMatchBuilderProps {
  availablePlayers: Player[];
  onAddMatch: (match: {
    team1_player1_id: string;
    team1_player2_id: string;
    team2_player1_id: string;
    team2_player2_id: string;
    team1_player1_name: string;
    team1_player2_name: string;
    team2_player1_name: string;
    team2_player2_name: string;
    court_assignment?: string;
  }) => void;
  currentMatches: any[];
  onRemoveMatch: (index: number) => void;
}

export default function ManualMatchBuilder({ 
  availablePlayers, 
  onAddMatch, 
  currentMatches, 
  onRemoveMatch 
}: ManualMatchBuilderProps) {
  const [selectedGroup, setSelectedGroup] = useState<'left' | 'right'>('left');
  const [team1Player1, setTeam1Player1] = useState('');
  const [team1Player2, setTeam1Player2] = useState('');
  const [team2Player1, setTeam2Player1] = useState('');
  const [team2Player2, setTeam2Player2] = useState('');
  const [courtAssignment, setCourtAssignment] = useState('');

  const leftPlayers = availablePlayers.filter(p => p.group === 'left');
  const rightPlayers = availablePlayers.filter(p => p.group === 'right');
  const currentGroupPlayers = selectedGroup === 'left' ? leftPlayers : rightPlayers;

  const handleAddMatch = () => {
    if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
      return;
    }

    const getPlayerName = (playerId: string) => {
      return availablePlayers.find(p => p.player_id === playerId)?.player?.name || 'Onbekend';
    };

    onAddMatch({
      team1_player1_id: team1Player1,
      team1_player2_id: team1Player2,
      team2_player1_id: team2Player1,
      team2_player2_id: team2Player2,
      team1_player1_name: getPlayerName(team1Player1),
      team1_player2_name: getPlayerName(team1Player2),
      team2_player1_name: getPlayerName(team2Player1),
      team2_player2_name: getPlayerName(team2Player2),
      court_assignment: courtAssignment || undefined,
    });

    // Reset form
    setTeam1Player1('');
    setTeam1Player2('');
    setTeam2Player1('');
    setTeam2Player2('');
    setCourtAssignment('');
  };

  const canAddMatch = team1Player1 && team1Player2 && team2Player1 && team2Player2 &&
    team1Player1 !== team1Player2 && team2Player1 !== team2Player2 &&
    ![team1Player1, team1Player2].includes(team2Player1) &&
    ![team1Player1, team1Player2].includes(team2Player2);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Handmatig 2v2 Wedstrijd Toevoegen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Groep</label>
            <Select value={selectedGroup} onValueChange={(value: 'left' | 'right') => {
              setSelectedGroup(value);
              // Reset selections when switching groups
              setTeam1Player1('');
              setTeam1Player2('');
              setTeam2Player1('');
              setTeam2Player2('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Links Groep ({leftPlayers.length} spelers)</SelectItem>
                <SelectItem value="right">Rechts Groep ({rightPlayers.length} spelers)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">Team 1</h4>
              <div>
                <label className="text-sm">Speler 1</label>
                <Select value={team1Player1} onValueChange={setTeam1Player1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer speler..." />
                  </SelectTrigger>
                  <SelectContent>
                    {currentGroupPlayers.map((player) => (
                      <SelectItem key={player.player_id} value={player.player_id}>
                        {player.player?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Speler 2</label>
                <Select value={team1Player2} onValueChange={setTeam1Player2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer speler..." />
                  </SelectTrigger>
                  <SelectContent>
                    {currentGroupPlayers
                      .filter(p => p.player_id !== team1Player1)
                      .map((player) => (
                      <SelectItem key={player.player_id} value={player.player_id}>
                        {player.player?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-red-600">Team 2</h4>
              <div>
                <label className="text-sm">Speler 1</label>
                <Select value={team2Player1} onValueChange={setTeam2Player1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer speler..." />
                  </SelectTrigger>
                  <SelectContent>
                    {currentGroupPlayers
                      .filter(p => ![team1Player1, team1Player2].includes(p.player_id))
                      .map((player) => (
                      <SelectItem key={player.player_id} value={player.player_id}>
                        {player.player?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Speler 2</label>
                <Select value={team2Player2} onValueChange={setTeam2Player2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer speler..." />
                  </SelectTrigger>
                  <SelectContent>
                    {currentGroupPlayers
                      .filter(p => ![team1Player1, team1Player2, team2Player1].includes(p.player_id))
                      .map((player) => (
                      <SelectItem key={player.player_id} value={player.player_id}>
                        {player.player?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Baan (optioneel)</label>
            <Select value={courtAssignment} onValueChange={setCourtAssignment}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer baan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Geen specifieke baan</SelectItem>
                <SelectItem value="Baan 1">Baan 1</SelectItem>
                <SelectItem value="Baan 2">Baan 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAddMatch} 
            disabled={!canAddMatch}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            2v2 Wedstrijd Toevoegen
          </Button>
        </CardContent>
      </Card>

      {currentMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Huidige Wedstrijden ({currentMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentMatches.map((match, index) => (
                <div 
                  key={index}
                  className="p-3 border rounded-lg bg-muted/30 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium text-center">
                      <div className="text-blue-600">
                        {match.team1_player1_name} & {match.team1_player2_name}
                      </div>
                      <div className="text-sm text-muted-foreground my-1">vs</div>
                      <div className="text-red-600">
                        {match.team2_player1_name} & {match.team2_player2_name}
                      </div>
                    </div>
                    {match.court_assignment && (
                      <Badge variant="outline" className="mt-2">
                        {match.court_assignment}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveMatch(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
