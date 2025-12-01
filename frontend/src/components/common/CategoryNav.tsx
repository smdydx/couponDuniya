"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { CATEGORIES, ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryNavProps {
  basePath?: string;
  showAll?: boolean;
}

function CategoryNavContent({ basePath = ROUTES.coupons, showAll = true }: CategoryNavProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
      {CATEGORIES.map((category) => (
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
          <span>{category.icon}</span>
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
