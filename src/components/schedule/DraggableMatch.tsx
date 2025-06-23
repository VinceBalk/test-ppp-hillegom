
import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';
import { ScheduleMatch } from '@/hooks/useSchedulePreview';

interface DraggableMatchProps {
  match: ScheduleMatch;
  index: number;
  courtName: string;
  onUpdateMatch: (matchId: string, updates: Partial<ScheduleMatch>) => void;
}

export default function DraggableMatch({ 
  match, 
  index, 
  courtName,
  onUpdateMatch 
}: DraggableMatchProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'match',
    item: { 
      match, 
      sourceCourtName: courtName, 
      sourceIndex: index 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag}
      className={`cursor-move ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {match.team1_player1_name}
                  {match.team1_player2_name && ` & ${match.team1_player2_name}`}
                  {' vs '}
                  {match.team2_player1_name}
                  {match.team2_player2_name && ` & ${match.team2_player2_name}`}
                </div>
                <Badge variant="outline" className="text-xs">
                  Ronde {match.round_within_group}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {courtName}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
