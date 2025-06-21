
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TeamSelectorProps {
  teamLabel: string;
  teamColor: string;
  player1Id: string;
  player2Id: string;
  availablePlayers: Array<{
    player_id: string;
    player: { name: string };
  }>;
  onPlayerChange: (position: string, playerId: string) => void;
}

export default function TeamSelector({
  teamLabel,
  teamColor,
  player1Id,
  player2Id,
  availablePlayers,
  onPlayerChange
}: TeamSelectorProps) {
  return (
    <div>
      <Label className={`text-xs ${teamColor}`}>{teamLabel}</Label>
      <div className="grid grid-cols-2 gap-1">
        <Select
          value={player1Id}
          onValueChange={(value) => onPlayerChange('player1', value)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Speler 1" />
          </SelectTrigger>
          <SelectContent>
            {availablePlayers.map(tp => (
              <SelectItem key={tp.player_id} value={tp.player_id} className="text-xs">
                {tp.player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={player2Id}
          onValueChange={(value) => onPlayerChange('player2', value)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Speler 2" />
          </SelectTrigger>
          <SelectContent>
            {availablePlayers.map(tp => (
              <SelectItem key={tp.player_id} value={tp.player_id} className="text-xs">
                {tp.player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
