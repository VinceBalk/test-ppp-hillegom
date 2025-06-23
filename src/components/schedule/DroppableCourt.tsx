
import React from 'react';
import { useDrop } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduleMatch } from '@/hooks/useSchedulePreview';
import DraggableMatch from './DraggableMatch';

interface DroppableCourtProps {
  courtName: string;
  matches: ScheduleMatch[];
  onUpdateMatch: (matchId: string, updates: Partial<ScheduleMatch>) => void;
  onMoveMatch: (draggedMatch: ScheduleMatch, targetCourtName: string, targetIndex?: number) => void;
}

export default function DroppableCourt({ 
  courtName, 
  matches, 
  onUpdateMatch,
  onMoveMatch 
}: DroppableCourtProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'match',
    drop: (item: { match: ScheduleMatch; sourceCourtName: string; sourceIndex: number }) => {
      if (item.sourceCourtName !== courtName) {
        onMoveMatch(item.match, courtName);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop}>
      <Card className={`transition-colors ${isOver ? 'bg-blue-50 border-blue-200' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{courtName}</CardTitle>
            <Badge variant="outline">{matches.length} wedstrijden</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 min-h-[100px]">
            {matches.map((match, index) => (
              <DraggableMatch
                key={match.id}
                match={match}
                index={index}
                courtName={courtName}
                onUpdateMatch={onUpdateMatch}
              />
            ))}
            {matches.length === 0 && (
              <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                Sleep wedstrijden hierheen
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
