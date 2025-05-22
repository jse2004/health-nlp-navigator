
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search..." }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full max-w-sm items-center">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pr-10"
      />
      <Button 
        type="submit" 
        variant="ghost" 
        size="icon" 
        className="absolute right-0 h-full"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default SearchBar;
