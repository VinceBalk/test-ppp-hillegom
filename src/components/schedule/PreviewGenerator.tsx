import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PreviewGeneratorProps {
  selectedRound?: number;
  onGeneratePreview: () => void;
  isGenerating: boolean;
  courtsLoading?: boolean;
}

export default function PreviewGenerator({ 
  onGeneratePreview, 
  isGenerating,
  courtsLoading = false
}: PreviewGeneratorProps) {
  const isDisabled = isGenerating || courtsLoading;
  
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
          {courtsLoading 
            ? 'Banen laden...' 
            : isGenerating 
              ? 'Preview Genereren...' 
              : 'Preview Genereren'
          }
        </Button>
      </CardContent>
    </Card>
  );
}
