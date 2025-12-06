"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Upload, X, Link as LinkIcon, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  category?: "merchants" | "products" | "offers" | "banners" | "categories";
  label?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "banner";
}

function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('replit') || hostname.includes('pike.replit.dev')) {
      return `https://${hostname.replace('-00-', '-8000-00-')}`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function ImageUploader({
  value,
  onChange,
  category = "products",
  label = "Image",
  className,
  aspectRatio = "square",
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    banner: "aspect-[3/1]",
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        await uploadFile(file);
      }
    },
    [category]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setIsUploading(true);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Allowed: JPG, PNG, WebP, GIF, SVG");
      setIsUploading(false);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File size exceeds 2MB limit");
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const response = await fetch(`${API_BASE}/admin/upload/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Upload failed");
      }

      const data = await response.json();
      const backendUrl = getBackendUrl();
      const imageUrl = data.data.type === "local" 
        ? `${backendUrl}${data.data.url}` 
        : data.data.url;
      onChange(imageUrl);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image_url", urlInput.trim());
      formData.append("category", category);

      const response = await fetch(`${API_BASE}/admin/upload/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "URL validation failed");
      }

      const data = await response.json();
      onChange(data.data.url);
      setUrlInput("");
    } catch (err: any) {
      setError(err.message || "Failed to validate URL");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    setUrlInput("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      {value ? (
        <div className="relative group">
          <div className={cn("relative overflow-hidden rounded-lg border bg-muted", aspectClasses[aspectRatio])}>
            <img
              src={value}
              alt="Uploaded image"
              className={`h-full w-full rounded-lg ${
                aspectRatio === "banner" ? "object-cover" : "object-contain"
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3EError%3C/text%3E%3C/svg%3E";
              }}
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground truncate flex-1">
              {value.length > 50 ? `${value.substring(0, 50)}...` : value}
            </span>
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                isUploading && "pointer-events-none opacity-50",
                aspectRatio === "banner" && "aspect-[21/9] h-32"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {isDragging ? "Drop image here" : "Click or drag image"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP, GIF, SVG up to 2MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={isUploading || !urlInput.trim()}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a direct URL to an image file
              </p>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}