import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  created_at: string;
}

interface SecurityLogMobileCardProps {
  log: AuditLog;
  getActionBadgeVariant: (action: string) => 'default' | 'destructive' | 'secondary' | 'outline';
  formatActionName: (action: string) => string;
}

export function SecurityLogMobileCard({ 
  log, 
  getActionBadgeVariant, 
  formatActionName 
}: SecurityLogMobileCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={getActionBadgeVariant(log.action)} className="shrink-0">
            {formatActionName(log.action)}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(log.created_at).toLocaleString('nl-NL', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Gebruiker:</span>
          {log.user_id ? (
            <code className="bg-muted px-2 py-0.5 rounded text-xs">
              {log.user_id.substring(0, 8)}...
            </code>
          ) : (
            <span className="text-muted-foreground">Systeem</span>
          )}
        </div>
        
        {log.resource_type && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Resource:</span>
            <Badge variant="outline" className="text-xs">
              {log.resource_type}
            </Badge>
          </div>
        )}

        {log.details && (
          <div className="pt-2 border-t">
            <details className="cursor-pointer">
              <summary className="text-primary hover:underline text-sm">
                Details bekijken
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
