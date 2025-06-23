
import { Card, CardContent } from '@/components/ui/card';

export default function CourtsEmptyState() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <p className="text-muted-foreground">Nog geen banen aangemaakt</p>
          <p className="text-sm text-muted-foreground mt-1">
            Klik op "Nieuwe Baan" om te beginnen.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
