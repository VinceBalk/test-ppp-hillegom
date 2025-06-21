
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PreviewGeneratorProps {
  selectedRound: number;
  onGeneratePreview: () => void;
  isGenerating: boolean;
}

export default function PreviewGenerator({ 
  selectedRound, 
  onGeneratePreview, 
  isGenerating 
}: PreviewGeneratorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2v2 Schema Genereren</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={onGeneratePreview} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? 'Preview Genereren...' : `Preview Genereren voor Ronde ${selectedRound}`}
        </Button>
      </CardContent>
    </Card>
  );
}
