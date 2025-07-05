import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function LoginHeader() {
  return (
    <CardHeader className="space-y-4 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
        <img
          src="/PPP_beeldmerk.webp"
          alt="PPP Hillegom beeldmerk"
          className="h-full w-full object-contain"
        />
      </div>
      <CardTitle className="text-2xl font-bold">PPP Hillegom</CardTitle>
      <CardDescription className="text-base">
        Padel Toernooi Management Systeem
      </CardDescription>
    </CardHeader>
    );
}
