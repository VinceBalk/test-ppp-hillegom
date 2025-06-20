
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface TournamentSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function TournamentSearch({ searchTerm, onSearchChange }: TournamentSearchProps) {
  return (
    <div className="flex items-center space-x-2">
      <Search className="h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Zoek toernooien..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
    </div>
  );
}
