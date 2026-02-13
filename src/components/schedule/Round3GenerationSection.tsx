import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Play, XCircle } from 'lucide-react';
import { useRound3Readiness } from '@/hooks/useRound3Readiness';
import { useSchedulePreview } from '@/hooks/useSchedulePreview';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';

interface Round3GenerationSectionProps {
  tournamentId?: string;
}

export default function Round3GenerationSection({ tournamentId }: Round3GenerationSectionProps) {
  const { readiness, isLoading: readinessLoading } = useRound3Readiness(tournamentId);
  const { generatePreview, isGenerating: previewGenerating, preview } = useSchedulePreview(tournamentId);
  const { generateSchedule, isGenerating: scheduleGenerating } = useScheduleGeneration();
  
  const [showPreview, setShowPreview] = useState(false);

  const handleGeneratePreview = async () => {
    if (!tournamentId) return;
    
    try {
      await generatePreview(3);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating Round 3 preview:', error);
    }
  };

  const handleApproveSchedule = async () => {
    if (!tournamentId || !preview) return;

    try {
      await generateSchedule({
        tournamentId,
        roundNumber: 3,
        preview
      });
      setShowPreview(false);
    } catch (error) {
      console.error('Error approving Round 3 schedule:', error);
    }
  };

  if (readinessLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ronde 3 Genereren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Status controleren...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (!readiness) return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    if (readiness.isReady) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (readiness.r3AlreadyGenerated) return <XCircle className="h-5 w-5 text-orange-600" />;
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusVariant = (): "default" | "destructive" | "secondary" => {
    if (!readiness) return "secondary";
    if (readiness.isReady) return "default";
    if (readiness.r3AlreadyGenerated) return "secondary";
    return "destructive";
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Ronde 3 Genereren
            </CardTitle>
            <CardDescription>
              Genereer Ronde 3 schema op basis van prestaties in Ronde 1 en 2
            </CardDescription>
          </div>
          
          {readiness && (
            <Badge variant={getStatusVariant()}>
              {readiness.isReady ? 'Klaar voor generatie' : 
               readiness.r3AlreadyGenerated ? 'Al gegenereerd' : 'Niet beschikbaar'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Ronde 1 Status</div>
            <div className="flex items-center gap-2">
              {readiness?.r1Complete ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                {readiness?.r1CompletedWithScores || 0}/{readiness?.r1MatchesCount || 0} compleet
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Ronde 2 Status</div>
            <div className="flex items-center gap-2">
              {readiness?.r2Complete ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                {readiness?.r2CompletedWithScores || 0}/{readiness?.r2MatchesCount || 0} compleet
              </span>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {readiness?.message && (
          <Alert variant={readiness.isReady ? "default" : "destructive"}>
            <AlertDescription>{readiness.message}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGeneratePreview}
            disabled={!readiness?.isReady || previewGenerating || scheduleGenerating}
            className="flex-1"
          >
            {previewGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Genereren...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Preview Genereren
              </>
            )}
          </Button>

          {showPreview && preview && (
            <Button
              onClick={handleApproveSchedule}
              disabled={scheduleGenerating}
              variant="default"
              className="flex-1"
            >
              {scheduleGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Schema Goedkeuren
                </>
              )}
            </Button>
          )}
        </div>

        {/* Preview Info */}
        {showPreview && preview && (
          <Alert>
            <AlertDescription>
              Preview gegenereerd: {preview.matches.length} wedstrijden klaar voor goedkeuring
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
