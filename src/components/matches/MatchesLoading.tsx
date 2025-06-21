
export default function MatchesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wedstrijden</h1>
        <p className="text-muted-foreground">Overzicht van alle wedstrijden en resultaten</p>
      </div>
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  );
}
