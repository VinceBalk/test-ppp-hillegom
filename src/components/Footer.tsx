export default function Footer() {
  return (
    <footer className="border-t bg-muted/50 py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Padel Pro Hillegom. Alle rechten voorbehouden.
          </div>
          <div>
            Ontwikkeld door{' '}
            <a 
              href="https://vincebalk.nl" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:underline font-medium"
            >
              Vince Balk
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
