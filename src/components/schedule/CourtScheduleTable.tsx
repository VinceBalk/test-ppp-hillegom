
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';
import { ScheduleMatch } from '@/types/schedule';
import { CourtScheduleMobileCard } from './CourtScheduleMobileCard';

interface CourtScheduleTableProps {
  courtName: string;
  matches: ScheduleMatch[];
  onEditMatch: (match: ScheduleMatch) => void;
}

export default function CourtScheduleTable({ 
  courtName, 
  matches, 
  onEditMatch 
}: CourtScheduleTableProps) {
  const sortedMatches = [...matches].sort((a, b) => a.round_within_group - b.round_within_group);

  return (
    <>
      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900">
            {courtName}
          </h3>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {matches.length} wedstrijden
          </Badge>
        </div>
        {sortedMatches.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Geen wedstrijden op deze baan
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sortedMatches.map((match) => (
              <CourtScheduleMobileCard
                key={match.id}
                match={match}
                onEditMatch={onEditMatch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-blue-900">
              {courtName}
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {matches.length} wedstrijden
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {sortedMatches.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
              <p>Geen wedstrijden op deze baan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 min-w-[60px]">Ronde</TableHead>
                    <TableHead className="min-w-[180px]">Team 1</TableHead>
                    <TableHead className="text-center w-16 min-w-[50px]">vs</TableHead>
                    <TableHead className="min-w-[180px]">Team 2</TableHead>
                    <TableHead className="w-16 min-w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMatches.map((match, index) => (
                    <TableRow key={match.id} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="text-xs">
                          {match.round_within_group}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-blue-600 font-medium">
                          {match.team1_player1_name} & {match.team1_player2_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground text-sm">
                        vs
                      </TableCell>
                      <TableCell>
                        <div className="text-red-600 font-medium">
                          {match.team2_player1_name} & {match.team2_player2_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditMatch(match)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
