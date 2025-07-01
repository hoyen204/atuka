'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Clipboard } from 'lucide-react';

interface SearchFormProps {
  defaultValue: string;
  onSearch: (formData: FormData) => Promise<void>;
  onClear: () => Promise<void>;
}

export default function SearchForm({ defaultValue, onSearch, onClear }: SearchFormProps) {
  const [search, setSearch] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await onSearch(formData);
    });
  };

  const handleClear = () => {
    setSearch('');
    startTransition(async () => {
      await onClear();
    });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSearch(text);
      const formData = new FormData();
      formData.append('search', text);
      startTransition(async () => {
        await onSearch(formData);
      });
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 md:gap-4 flex-1 w-full items-center">
      <div className="flex-1 relative">
        <Input
          type="text"
          name="search"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-20 text-sm md:text-base"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
          {search && (
            <Button
              type="button"
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Xóa"
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            onClick={handlePaste}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="Dán từ clipboard"
            disabled={isPending}
          >
            <Clipboard className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={isPending} 
        className="flex-shrink-0 px-2 sm:px-3 md:px-4 text-sm md:text-base"
      >
        <span className="hidden sm:inline">Tìm Kiếm</span>
        <span className="sm:hidden">Tìm</span>
      </Button>
    </form>
  );
} 