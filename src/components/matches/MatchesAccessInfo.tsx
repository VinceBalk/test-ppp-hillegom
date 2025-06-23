
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface MatchesAccessInfoProps {
  isSuperAdmin: boolean;
  hasOrganizerRole: boolean;
  hasPlayerRole: boolean;
}

export default function MatchesAccessInfo({ 
  isSuperAdmin, 
  hasOrganizerRole, 
  hasPlayerRole 
}: MatchesAccessInfoProps) {
  if (isSuperAdmin) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Je bent ingelogd als super admin en kunt alle wedstrijden bekijken en bewerken.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (hasOrganizerRole) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <Info className="h-4 w-4 text-green-600" />  
        <AlertDescription className="text-green-800">
          Je bent ingelogd als organisator en kunt alle wedstrijden bekijken en bewerken.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (hasPlayerRole) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Info className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Je bent ingelogd als speler en kunt alleen wedstrijden bekijken waarin je speelt.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}
