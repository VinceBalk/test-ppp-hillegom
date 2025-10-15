
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PreviewGeneratorProps {
  selectedRound: number;
  onGeneratePreview: () => void;
  isGenerating: boolean;
  courtsLoading?: boolean;
}

export default function PreviewGenerator({ 
  selectedRound, 
  onGeneratePreview, 
  isGenerating,
  courtsLoading = false
}: PreviewGeneratorProps) {
  const isDisabled = isGenerating || (selectedRound === 3 && courtsLoading);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>2v2 Schema Genereren</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={onGeneratePreview} 
          disabled={isDisabled}
          className="w-full"
        >
          {courtsLoading && selectedRound === 3 
            ? 'Banen laden...' 
            : isGenerating 
              ? 'Preview Genereren...' 
              : `Preview Genereren voor Ronde ${selectedRound}`
          }
        </Button>
        {courtsLoading && selectedRound === 3 && (
          <p className="text-sm text-muted-foreground mt-2">
            Wacht tot de banen zijn geladen voordat je Ronde 3 genereert.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
