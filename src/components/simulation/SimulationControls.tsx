import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dices, PenLine, RotateCcw, Zap, FileDown, FlaskConical, CheckCircle2 } from 'lucide-react';

interface SimulationControlsProps {
  isSimulationActive: boolean;
  simulationMode: 'none' | 'random' | 'manual';
  round3Generated: boolean;
  r1r2Complete: boolean;
  r3Complete: boolean;
  onStartRandomSimulation: () => void;
  onStartManualSimulation: () => void;
  onGenerateRound3: (fillRandom: boolean) => void;
  onResetSimulation: () => void;
  onExportPdf: () => void;
  tournamentStatus?: string;
}

export default function SimulationControls({
  isSimulationActive,
  simulationMode,
  round3Generated,
  r1r2Complete,
  r3Complete,
  onStartRandomSimulation,
  onStartManualSimulation,
  onGenerateRound3,
  onResetSimulation,
  onExportPdf,
  tournamentStatus,
}: SimulationControlsProps) {
  // Alleen tonen bij 'simulation' status
  if (tournamentStatus !== 'simulation') {
    return null;
  }

  const getStatusBadge = () => {
    if (!isSimulationActive) {
      return <Badge variant="outline" className="bg-gray-100">Klaar om te starten</Badge>;
    }
    if (r3Complete) {
      return <Badge className="bg-green-600">Simulatie Compleet</Badge>;
    }
    if (round3Generated) {
      return <Badge className="bg-blue-600">R3 Gegenereerd - Scores invullen</Badge>;
    }
    if (r1r2Complete) {
      return <Badge className="bg-amber-600">R1+R2 Compleet - R3 kan gegenereerd</Badge>;
    }
    if (simulationMode === 'random') {
      return <Badge className="bg-purple-600">Random Simulatie Actief</Badge>;
    }
    if (simulationMode === 'manual') {
      return <Badge className="bg-orange-600">Handmatige Invoer - Vul scores in</Badge>;
    }
    return <Badge variant="secondary">Actief</Badge>;
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <FlaskConical className="h-5 w-5" />
            Simulatie Mode
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* Nog niet gestart */}
          {!isSimulationActive && (
            <>
              <Button 
                onClick={onStartRandomSimulation}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Dices className="h-4 w-4 mr-2" />
                Random Simulatie (R1+R2)
              </Button>
              <Button 
                onClick={onStartManualSimulation}
                variant="outline"
                className="border-orange-400 text-orange-700 hover:bg-orange-50"
              >
                <PenLine className="h-4 w-4 mr-2" />
                Handmatig Invoeren
              </Button>
            </>
          )}

          {/* R1+R2 actief maar niet compleet (handmatige mode) */}
          {isSimulationActive && simulationMode === 'manual' && !r1r2Complete && (
            <div className="flex items-center gap-2 text-orange-700 text-sm">
              <PenLine className="h-4 w-4" />
              <span>Vul alle scores in voor Ronde 1 en 2</span>
            </div>
          )}

          {/* R1+R2 compleet, R3 nog niet gegenereerd */}
          {isSimulationActive && r1r2Complete && !round3Generated && (
            <>
              <Button 
                onClick={() => onGenerateRound3(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Genereer R3 (Random Scores)
              </Button>
              <Button 
                onClick={() => onGenerateRound3(false)}
                variant="outline"
                className="border-green-400 text-green-700 hover:bg-green-50"
              >
                <PenLine className="h-4 w-4 mr-2" />
                Genereer R3 (Handmatig)
              </Button>
            </>
          )}

          {/* R3 gegenereerd maar niet compleet (handmatige mode) */}
          {isSimulationActive && round3Generated && !r3Complete && (
            <div className="flex items-center gap-2 text-blue-700 text-sm">
              <PenLine className="h-4 w-4" />
              <span>Vul alle scores in voor Ronde 3</span>
            </div>
          )}

          {/* Alles compleet - Export */}
          {isSimulationActive && r3Complete && (
            <Button 
              onClick={onExportPdf}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Exporteer naar PDF
            </Button>
          )}
          
          {/* Reset knop - altijd zichtbaar als simulatie actief */}
          {isSimulationActive && (
            <Button 
              onClick={onResetSimulation}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Simulatie
            </Button>
          )}
        </div>

        {/* Progress indicators */}
        {isSimulationActive && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-purple-200">
            <div className="flex items-center gap-1 text-sm">
              {r1r2Complete ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
              )}
              <span className={r1r2Complete ? 'text-green-700' : 'text-gray-500'}>R1+R2</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {round3Generated ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
              )}
              <span className={round3Generated ? 'text-green-700' : 'text-gray-500'}>R3 Schema</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              {r3Complete ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
              )}
              <span className={r3Complete ? 'text-green-700' : 'text-gray-500'}>R3 Scores</span>
            </div>
          </div>
        )}

        <p className="text-xs text-purple-600 mt-3">
          💡 Alle scores blijven in je browser - er wordt niets opgeslagen in de database.
        </p>
      </CardContent>
    </Card>
  );
}
