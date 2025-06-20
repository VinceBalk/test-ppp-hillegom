
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function LoginHeader() {
  return (
    <CardHeader className="space-y-4 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-2xl font-bold text-primary">PPP</span>
      </div>
      <CardTitle className="text-2xl font-bold">PPP Hillegom</CardTitle>
      <CardDescription className="text-base">
        Padel toernooi management systeem
      </CardDescription>
    </CardHeader>
  );
}
