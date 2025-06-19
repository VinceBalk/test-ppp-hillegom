
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 px-4">
      <Card className="w-full max-w-md gradient-card border-0 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">PPP</span>
          </div>
          <CardTitle className="text-2xl font-bold">Reset link valideren...</CardTitle>
          <CardDescription className="text-base">
            Even geduld terwijl we je reset link controleren
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
