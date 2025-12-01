"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";
import Head from "next/head";

type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  status: string;
  author: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  view_count: number;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image: string | null;
};

type RecentPost = {
  id: number;
  slug: string;
  title: string;
  published_at: string | null;
  created_at: string;
};

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost();
      fetchRecentPosts();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/blog/posts/${slug}`
      );

      if (response.ok) {
        const data = await response.json();
        setPost(data.data);
      } else if (response.status === 404) {
        setError("Blog post not found");
      } else {
        setError("Failed to load blog post");
      }
    } catch (error) {
      console.error("Failed to fetch post:", error);
      setError("Failed to load blog post");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/blog/recent?limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setRecentPosts(data.data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch recent posts:", error);
    }
  };

  const shareOnSocial = (platform: string) => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const text = post?.title || "";

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  const copyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card className="animate-pulse">
            <div className="aspect-video bg-muted" />
            <CardContent className="p-8 space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="space-y-3 pt-6">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <h1 className="text-2xl font-bold">
                {error || "Post not found"}
              </h1>
              <p className="text-muted-foreground">
                The blog post you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => router.push("/blog")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{post.meta_title || post.title}</title>
        <meta
          name="description"
          content={post.meta_description || post.excerpt || ""}
        />
        {post.meta_keywords && <meta name="keywords" content={post.meta_keywords} />}
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta
          property="og:description"
          content={post.meta_description || post.excerpt || ""}
        />
        {post.og_image && <meta property="og:image" content={post.og_image} />}
        <meta property="og:type" content="article" />
      </Head>

      <div className="min-h-screen bg-background">
        {/* Back Button */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-4 max-w-6xl">
            <Button variant="ghost" onClick={() => router.push("/blog")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <article>
                {/* Featured Image */}
                {post.featured_image && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden mb-8">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Header */}
                <div className="space-y-4 mb-8">
                  {post.is_featured && <Badge>Featured</Badge>}

                  <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                    {post.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {post.author && (
                      <span className="font-medium text-foreground">
                        By {post.author}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(
                        post.published_at || post.created_at
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.view_count} views
                    </span>
                  </div>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                </div>

                {/* Share Buttons */}
                <Card className="mb-8">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        Share this article:
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => shareOnSocial("facebook")}
                        >
                          <Facebook className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => shareOnSocial("twitter")}
                        >
                          <Twitter className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => shareOnSocial("linkedin")}
                        >
                          <Linkedin className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={copyLink}>
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content */}
                <Card>
                  <CardContent className="p-8">
                    <div
                      className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  </CardContent>
                </Card>

                {/* Updated Date */}
                {post.updated_at !== post.created_at && (
                  <p className="text-sm text-muted-foreground mt-6">
                    Last updated on{" "}
                    {new Date(post.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </article>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Recent Posts */}
                {recentPosts.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-4">Recent Posts</h3>
                      <div className="space-y-4">
                        {recentPosts
                          .filter((p) => p.slug !== post.slug)
                          .slice(0, 4)
                          .map((recentPost) => (
                            <Link
                              key={recentPost.id}
                              href={`/blog/${recentPost.slug}`}
                              className="block group"
                            >
                              <div className="space-y-1">
                                <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                                  {recentPost.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    recentPost.published_at || recentPost.created_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </Link>
                          ))}
                      </div>
                      <Button variant="outline" className="w-full mt-4" asChild>
                        <Link href="/blog">View All Posts</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* CTA Card */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardContent className="p-6 text-center space-y-4">
                    <h3 className="font-bold text-lg">Start Earning Cashback</h3>
                    <p className="text-sm text-muted-foreground">
                      Join thousands of users earning cashback on every purchase
                    </p>
                    <Button className="w-full" asChild>
                      <Link href="/register">Sign Up Now</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
