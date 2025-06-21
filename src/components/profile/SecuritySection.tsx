
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

export function SecuritySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Beveiliging
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Beveiligingstips</h4>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Gebruik een sterk, uniek wachtwoord</li>
              <li>• Log altijd uit na gebruik op gedeelde computers</li>
              <li>• Meld verdachte activiteit direct</li>
            </ul>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900">Wachtwoord Vereisten</h4>
            <ul className="text-sm text-amber-700 mt-1 space-y-1">
              <li>• Minimaal 8 karakters lang</li>
              <li>• Bevat hoofdletters en kleine letters</li>
              <li>• Bevat cijfers en speciale tekens</li>
              <li>• Vermijd persoonlijke informatie</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
