
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Match } from '@/hooks/useMatches';
import { useSpecialTypes } from '@/hooks/useSpecialTypes';
import { getShortTeamName } from '@/utils/matchUtils';
import { ArrowLeft, Plus, Minus, Star } from 'lucide-react';

interface SpecialsManagerProps {
  match: Match;
  onClose: () => void;
  onBack: () => void;
}

interface PlayerSpecial {
  playerId: string;
  playerName: string;
  specialTypeId: string;
  specialName: string;
  count: number;
}

export default function SpecialsManager({ match, onClose, onBack }: SpecialsManagerProps) {
  const { specialTypes, loading } = useSpecialTypes();
  const [playerSpecials, setPlayerSpecials] = useState<PlayerSpecial[]>([]);

  const is2v2 = !!(match.team1_player1 && match.team2_player1);
  
  // Get all players in this match
  const getAllPlayers = () => {
    const players = [];
    
    if (is2v2) {
      if (match.team1_player1) {
        players.push({
          id: match.team1_player1_id || '',
          name: match.team1_player1.name,
          team: 'Team 1'
        });
      }
      if (match.team1_player2) {
        players.push({
          id: match.team1_player2_id || '',
          name: match.team1_player2.name,
          team: 'Team 1'
        });
      }
      if (match.team2_player1) {
        players.push({
          id: match.team2_player1_id || '',
          name: match.team2_player1.name,
          team: 'Team 2'
        });
      }
      if (match.team2_player2) {
        players.push({
          id: match.team2_player2_id || '',
          name: match.team2_player2.name,
          team: 'Team 2'
        });
      }
    } else {
      if (match.player1) {
        players.push({
          id: match.player1_id || '',
          name: match.player1.name,
          team: 'Speler 1'
        });
      }
      if (match.player2) {
        players.push({
          id: match.player2_id || '',
          name: match.player2.name,
          team: 'Speler 2'
        });
      }
    }
    
    return players;
  };

  const players = getAllPlayers();

  const addSpecial = (playerId: string, playerName: string, specialTypeId: string, specialName: string) => {
    setPlayerSpecials(prev => {
      const existing = prev.find(ps => ps.playerId === playerId && ps.specialTypeId === specialTypeId);
      
      if (existing) {
        return prev.map(ps => 
          ps.playerId === playerId && ps.specialTypeId === specialTypeId
            ? { ...ps, count: ps.count + 1 }
            : ps
        );
      } else {
        return [...prev, {
          playerId,
          playerName,
          specialTypeId,
          specialName,
          count: 1
        }];
      }
    });
  };

  const removeSpecial = (playerId: string, specialTypeId: string) => {
    setPlayerSpecials(prev => {
      return prev.map(ps => 
        ps.playerId === playerId && ps.specialTypeId === specialTypeId
          ? { ...ps, count: Math.max(0, ps.count - 1) }
          : ps
      ).filter(ps => ps.count > 0);
    });
  };

  const getPlayerSpecialCount = (playerId: string, specialTypeId: string) => {
    const special = playerSpecials.find(ps => ps.playerId === playerId && ps.specialTypeId === specialTypeId);
    return special?.count || 0;
  };

  const handleSave = () => {
    console.log('=== SPECIALS SAVE ===');
    console.log('Match ID:', match.id);
    console.log('Player Specials:', playerSpecials);
    console.log('=== SPECIALS SAVED (NOT IN DATABASE) ===');
    
    // Show confirmation
    alert(`Specials geregistreerd!\n\n${playerSpecials.map(ps => 
      `${ps.playerName}: ${ps.count}x ${ps.specialName}`
    ).join('\n')}\n\n(Niet opgeslagen in database)`);
    
    onBack();
  };

  if (loading) {
    return (
      <Card className="border-2 border-purple-200 bg-purple-50/50">
        <CardContent className="p-8 text-center">
          <div>Specials laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200 bg-purple-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              Specials Registreren
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Sluiten
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {is2v2 
            ? `${getShortTeamName(match.team1_player1, match.team1_player2)} vs ${getShortTeamName(match.team2_player1, match.team2_player2)}`
            : `${getShortTeamName(match.player1)} vs ${getShortTeamName(match.player2)}`
          }
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Available Special Types */}
        {specialTypes.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            Geen specials beschikbaar. Voeg eerst specials toe in de instellingen.
          </div>
        ) : (
          <div>
            <Label className="text-sm font-medium">Beschikbare Specials</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {specialTypes.filter(st => st.is_active).map(specialType => (
                <Badge key={specialType.id} variant="outline" className="text-xs">
                  {specialType.name} {specialType.is_tiebreaker && '(TB)'}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Players and their specials */}
        {players.map(player => (
          <div key={player.id} className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium">{getShortTeamName({ name: player.name })}</div>
                <div className="text-xs text-muted-foreground">{player.team}</div>
              </div>
            </div>
            
            {/* Special buttons for this player */}
            <div className="space-y-2">
              {specialTypes.filter(st => st.is_active).map(specialType => {
                const count = getPlayerSpecialCount(player.id, specialType.id);
                return (
                  <div key={specialType.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{specialType.name}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeSpecial(player.id, specialType.id)}
                        disabled={count === 0}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{count}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addSpecial(player.id, player.name, specialType.id, specialType.name)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Summary */}
        {playerSpecials.length > 0 && (
          <div className="bg-purple-100 p-3 rounded-lg">
            <div className="text-sm font-medium mb-2">Overzicht:</div>
            {playerSpecials.map((ps, index) => (
              <div key={index} className="text-xs">
                {ps.playerName}: {ps.count}x {ps.specialName}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1">
            <Star className="h-4 w-4 mr-2" />
            Specials Opslaan
          </Button>
          <Button onClick={onBack} variant="outline">
            Terug
          </Button>
        </div>

        <div className="text-xs text-purple-600 bg-purple-100 p-2 rounded">
          💡 Specials worden per speler geregistreerd - data wordt niet opgeslagen in de database
        </div>
      </CardContent>
    </Card>
  );
}
