"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Store, Tag, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { debounce } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

import Fuse from "fuse.js";
import { apiClient } from "@/lib/api";

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
  const [fuse, setFuse] = useState<Fuse<SearchResult> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize search index on mount
  useEffect(() => {
    const initSearch = async () => {
      try {
        const response = await apiClient.get('/merchants/?limit=100');
        if (response.data?.success) {
          const merchants = response.data.data.merchants.map((m: any) => ({
            type: "merchant" as const,
            id: m.id,
            title: m.name,
            subtitle: m.description ? m.description.substring(0, 60) + "..." : "Exclusive deals & coupons",
            slug: m.slug,
          }));

          // Add some static popular categories/terms if needed, or just merchants for now using Fuse
          const searchData = [...merchants];

          const fuseInstance = new Fuse(searchData, {
            keys: ["title", "subtitle", "slug"],
            threshold: 0.4, // Fuzzy matching threshold (0.0 = exact, 1.0 = match anything)
            distance: 100,
            ignoreLocation: true,
            minMatchCharLength: 2,
          });

          setFuse(fuseInstance);
        }
      } catch (error) {
        console.error("Failed to initialize search:", error);
      }
    };

    initSearch();
  }, []);

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
      if (fuse) {
        const fuseResults = fuse.search(searchQuery);
        const formattedResults = fuseResults.map((result) => result.item).slice(0, 8);
        setResults(formattedResults);
        setIsOpen(formattedResults.length > 0);
      } else {
        // Fallback if fuse isn't ready (should rarely happen if data loads fast)
        // Or if we want to fallback to API search for backend results:
        // const res = await apiClient.get(`/search/autocomplete?q=${searchQuery}`);
      }
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
            onFocus={() => {
              if (query.length >= 2 && results.length > 0) {
                setIsOpen(true);
              }
            }}
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
