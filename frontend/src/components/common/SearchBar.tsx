"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Store, Tag, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { debounce } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface SearchResult {
  type: "merchant" | "offer" | "product";
  id: number;
  title: string;
  subtitle?: string;
  slug?: string;
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const performSearch = debounce(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      // Mock results for now - replace with actual API calls
      const mockResults: SearchResult[] = [
        { type: "merchant" as const, id: 1, title: "Amazon", subtitle: "Up to 10% cashback", slug: "amazon" },
        { type: "merchant" as const, id: 2, title: "Flipkart", subtitle: "Up to 8% cashback", slug: "flipkart" },
        { type: "offer" as const, id: 1, title: "50% off on Electronics", subtitle: "Amazon" },
        { type: "product" as const, id: 1, title: "Amazon Gift Card", subtitle: "From ₹100", slug: "amazon-gift-card" },
      ].filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults(mockResults);
      setIsOpen(mockResults.length > 0);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    performSearch(value);
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    switch (result.type) {
      case "merchant":
        router.push(ROUTES.merchantDetail(result.slug || String(result.id)));
        break;
      case "offer":
        router.push(`${ROUTES.coupons}?offer=${result.id}`);
        break;
      case "product":
        router.push(ROUTES.productDetail(result.slug || String(result.id)));
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`${ROUTES.coupons}?search=${encodeURIComponent(query)}`);
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "merchant":
        return <Store className="h-4 w-4" />;
      case "offer":
        return <Tag className="h-4 w-4" />;
      case "product":
        return <Gift className="h-4 w-4" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search stores, coupons, gift cards..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={() => {
                setQuery("");
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-md border bg-background shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => handleResultClick(result)}
                >
                  <span className="text-muted-foreground">{getIcon(result.type)}</span>
                  <div>
                    <div className="font-medium">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                    )}
                  </div>
                </button>
              ))}
              <button
                className="flex w-full items-center gap-3 border-t px-4 py-2 text-left text-sm text-primary hover:bg-accent"
                onClick={handleSubmit}
              >
                <Search className="h-4 w-4" />
                <span>Search for &quot;{query}&quot;</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
