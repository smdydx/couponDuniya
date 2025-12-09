
import { Suspense } from "react";
import CouponsClient from "./CouponsClient";

function CouponsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 bg-gray-200 rounded w-32 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function CouponsPage() {
  return (
    <Suspense fallback={<CouponsSkeleton />}>
      <CouponsClient />
    </Suspense>
  );
}
