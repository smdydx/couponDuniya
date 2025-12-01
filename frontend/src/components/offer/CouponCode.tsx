"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CouponCodeProps {
  code: string;
  onClick?: () => void;
  affiliateUrl?: string;
  className?: string;
}

export function CouponCode({ code, onClick, affiliateUrl, className }: CouponCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onClick?.();
      setTimeout(() => setCopied(false), 2000);

      // Open affiliate URL in new tab if provided
      if (affiliateUrl) {
        window.open(affiliateUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 border-dashed border-primary bg-primary/5 p-3",
        className
      )}
    >
      <code className="flex-1 font-mono text-lg font-bold text-primary">{code}</code>
      <Button
        variant={copied ? "success" : "default"}
        size="sm"
        onClick={handleCopy}
        className="min-w-[100px]"
      >
        {copied ? (
          <>
            <Check className="mr-1 h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="mr-1 h-4 w-4" />
            Copy Code
          </>
        )}
      </Button>
    </div>
  );
}
