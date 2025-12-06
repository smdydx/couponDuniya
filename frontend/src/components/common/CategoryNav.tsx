"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { Folder } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon_url?: string;
  products_count?: number;
}

interface CategoryNavProps {
  basePath?: string;
  showAll?: boolean;
}

function CategoryNavContent({ basePath = ROUTES.coupons, showAll = true }: CategoryNavProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/api/v1/categories?is_active=true&limit=20');
        setCategories(response.data?.data?.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3 pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-20 rounded-lg flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 pb-2 overflow-x-auto scrollbar-hide">
      {showAll && (
        <Link
          href={basePath}
          className={cn(
            "inline-flex items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            !currentCategory
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-accent"
          )}
        >
          All
        </Link>
      )}
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`${basePath}?category=${category.slug}`}
          className={cn(
            "inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            currentCategory === category.slug
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-accent"
          )}
        >
          {category.icon_url ? (
            <div className="w-8 h-8 mb-1 flex items-center justify-center">
              <img
                src={category.icon_url}
                alt={category.name}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="w-8 h-8 flex items-center justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg></div>';
                }}
              />
            </div>
          ) : (
            <div className="w-8 h-8 mb-1 flex items-center justify-center">
              <Folder className="w-6 h-6" />
            </div>
          )}
          {category.name}
        </Link>
      ))}
    </div>
  );
}

function CategoryNavSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-24 rounded-full" />
      ))}
    </div>
  );
}

export function CategoryNav(props: CategoryNavProps) {
  return (
    <Suspense fallback={<CategoryNavSkeleton />}>
      <CategoryNavContent {...props} />
    </Suspense>
  );
}