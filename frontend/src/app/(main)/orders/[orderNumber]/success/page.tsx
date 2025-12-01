import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";

export default function OrderSuccessPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-green-600">Order Placed Successfully!</h1>
          <p className="mt-2 text-muted-foreground">
            Thank you for your purchase. Your order is being processed.
          </p>

          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="text-lg font-semibold">{params.orderNumber}</p>
          </div>

          <div className="mt-6 rounded-lg border border-dashed p-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Package className="h-4 w-4 text-primary" />
              <span>
                Gift card codes will be sent to your email within a few minutes.
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <Link href={ROUTES.orderDetail(params.orderNumber)}>
              <Button className="w-full gap-2">
                View Order Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={ROUTES.products}>
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
