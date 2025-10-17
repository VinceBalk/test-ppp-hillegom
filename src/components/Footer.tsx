export default function Footer() {
  return (
    <footer className="border-t bg-muted/50 py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Padel Pro Hillegom. Alle rechten voorbehouden.
          </div>
          <div className="flex gap-6 text-sm">
            <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="/voorwaarden" className="text-muted-foreground hover:text-foreground transition-colors">
              Voorwaarden
            </a>
            <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
