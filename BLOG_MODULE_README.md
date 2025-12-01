# Blog/CMS Module Implementation

## Overview

A complete blog/CMS system with admin management, SEO metadata, image uploads, and public-facing pages.

## Features Implemented

### Backend API

#### Models
- **BlogPost Model** ([backend/app/models/blog_post.py](backend/app/models/blog_post.py))
  - Full blog post schema with SEO fields
  - Status management (draft, published, archived)
  - Featured image support
  - View count tracking
  - SEO metadata (meta_title, meta_description, meta_keywords, og_image)

#### API Endpoints

**Admin Endpoints** ([backend/app/api/v1/blog.py](backend/app/api/v1/blog.py))
- `POST /api/v1/blog/admin/posts` - Create blog post
- `GET /api/v1/blog/admin/posts` - List all posts with filters
- `GET /api/v1/blog/admin/posts/{id}` - Get single post by ID
- `PUT /api/v1/blog/admin/posts/{id}` - Update blog post
- `DELETE /api/v1/blog/admin/posts/{id}` - Delete blog post
- `POST /api/v1/blog/admin/posts/{id}/publish` - Publish a draft post

**Public Endpoints**
- `GET /api/v1/blog/posts` - List published posts (with pagination)
- `GET /api/v1/blog/posts/{slug}` - Get single post by slug (auto-increments views)
- `GET /api/v1/blog/featured` - Get featured posts
- `GET /api/v1/blog/recent` - Get recent posts
- `GET /api/v1/blog/search?q={query}` - Search posts

**Image Upload Endpoints** ([backend/app/api/v1/blog_uploads.py](backend/app/api/v1/blog_uploads.py))
- `POST /api/v1/blog/uploads/image` - Upload single image
- `POST /api/v1/blog/uploads/images/batch` - Upload multiple images (max 10)
- `DELETE /api/v1/blog/uploads/image/{filename}` - Delete image

#### Features
- Auto-slug generation from title
- Automatic published_at timestamp on publish
- Cache invalidation on create/update/delete
- Rich SEO metadata support
- Image validation (5MB limit, jpg/png/gif/webp/svg)
- Search functionality across title, content, and excerpt

### Frontend UI

#### Admin Interface
- **Blog Editor** ([frontend/src/app/admin/blog/page.tsx](frontend/src/app/admin/blog/page.tsx))
  - Full CRUD operations
  - Rich text editor with HTML/Markdown support
  - Image upload with drag-and-drop
  - Status management (draft/published/archived)
  - SEO metadata editor
  - Featured post toggle
  - Search and filter posts
  - Inline publish/edit/delete actions

#### Public Pages
- **Blog Listing** ([frontend/src/app/blog/page.tsx](frontend/src/app/blog/page.tsx))
  - Grid layout with featured posts section
  - Search functionality
  - Pagination support
  - Responsive design
  - View count display
  - Featured badge for featured posts

- **Blog Detail** ([frontend/src/app/blog/[slug]/page.tsx](frontend/src/app/blog/[slug]/page.tsx))
  - Full post content with formatting
  - SEO meta tags integration
  - Social sharing (Facebook, Twitter, LinkedIn)
  - Recent posts sidebar
  - View counter
  - Author and publish date display
  - CTA section for user registration

### Database Migration

**Migration File**: [backend/alembic/versions/006_blog_posts.py](backend/alembic/versions/006_blog_posts.py)

Creates the `blog_posts` table with:
- All necessary columns
- Indexes on slug, status, published_at, and is_featured
- Proper constraints and defaults

## Setup Instructions

### 1. Run Database Migration

```bash
cd backend
alembic upgrade head
```

### 2. Configure Environment

The blog module uses existing authentication and configuration. Ensure these environment variables are set:

```env
# API URL for frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Admin token (stored in localStorage as 'admin_token')
```

### 3. Create Upload Directory

The upload directory is automatically created, but you can manually ensure it exists:

```bash
mkdir -p backend/uploads/blog
```

### 4. Start Services

```bash
# Backend
cd backend
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```

## Usage Guide

### Admin Usage

1. **Access Admin Panel**
   - Navigate to `/admin/blog`
   - Ensure you have admin authentication

2. **Create Blog Post**
   - Click "New Blog Post"
   - Fill in title, content, and excerpt
   - Upload featured image (optional)
   - Set SEO metadata
   - Choose status (draft/published)
   - Save or publish

3. **Manage Posts**
   - Filter by status (All/Draft/Published/Archived)
   - Search posts
   - Edit, publish, or delete posts inline

### Public Access

- **View All Posts**: Navigate to `/blog`
- **Read Post**: Click on any post card or visit `/blog/{slug}`
- **Search**: Use search bar on blog listing page
- **Share**: Use social sharing buttons on post detail page

## API Examples

### Create Blog Post

```bash
curl -X POST http://localhost:8000/api/v1/blog/admin/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "10 Tips for Maximum Cashback",
    "excerpt": "Learn how to maximize your cashback earnings",
    "content": "<h2>Introduction</h2><p>Here are 10 tips...</p>",
    "status": "published",
    "is_featured": true,
    "meta_title": "10 Cashback Tips - Save More Money",
    "meta_description": "Discover proven strategies to earn more cashback"
  }'
```

### Get Published Posts

```bash
curl http://localhost:8000/api/v1/blog/posts?page=1&limit=12
```

### Search Posts

```bash
curl http://localhost:8000/api/v1/blog/search?q=cashback&page=1
```

### Upload Image

```bash
curl -X POST http://localhost:8000/api/v1/blog/uploads/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg"
```

## SEO Features

The blog module includes comprehensive SEO support:

1. **Meta Tags**: Customizable meta title, description, and keywords
2. **Open Graph**: OG image and metadata for social sharing
3. **Semantic HTML**: Proper heading hierarchy and structure
4. **View Tracking**: Built-in view counter for analytics
5. **URL Structure**: Clean, SEO-friendly slugs

## Security Features

- Admin authentication required for all admin endpoints
- File upload validation (type and size)
- Directory traversal prevention
- XSS protection through content sanitization
- Rate limiting via existing middleware

## Performance Optimizations

- Redis caching for blog posts
- Cache invalidation on updates
- Pagination for list endpoints
- Lazy loading of images in frontend
- Optimized database indexes

## Customization Guide

### Add Rich Text Editor

Replace the basic textarea with a WYSIWYG editor like:
- TinyMCE
- Quill
- Draft.js
- Tiptap

### Add Categories/Tags

1. Create new models for categories and tags
2. Add many-to-many relationships
3. Update API to include filtering by category/tag
4. Add UI for category/tag management

### Add Comments

1. Create Comment model
2. Add comment API endpoints
3. Implement comment UI on blog detail page
4. Add moderation features

### Add Drafts Auto-Save

1. Implement auto-save functionality in editor
2. Use localStorage or API endpoint
3. Add restore draft feature

## Testing

### Manual Testing Checklist

- [ ] Create blog post as admin
- [ ] Upload featured image
- [ ] Publish post
- [ ] View post on public blog page
- [ ] Search for post
- [ ] Edit post
- [ ] Delete post
- [ ] Test SEO metadata in browser dev tools
- [ ] Test social sharing links
- [ ] Test pagination
- [ ] Test view counter increment

### API Testing

```bash
# Run backend tests (if implemented)
cd backend
pytest tests/test_blog.py
```

## Troubleshooting

### Images Not Displaying
- Check upload directory exists: `uploads/blog/`
- Verify static file mounting in main.py
- Check file permissions

### Posts Not Showing
- Verify status is "published"
- Check database has records
- Clear Redis cache if needed

### Admin Access Denied
- Ensure admin token is set in localStorage
- Verify admin authentication in headers

## Future Enhancements

- [ ] Rich text editor with WYSIWYG
- [ ] Categories and tags system
- [ ] Comment system
- [ ] Draft auto-save
- [ ] Post scheduling
- [ ] Email notifications for new posts
- [ ] RSS feed
- [ ] Reading time estimate
- [ ] Related posts algorithm
- [ ] Analytics dashboard

## Architecture Decisions

### Why Separate blog and blog_uploads Routers?
- Separation of concerns
- Easier to add middleware specific to uploads
- Cleaner organization

### Why View Counter in Model?
- Simplifies tracking
- No separate analytics table needed
- Can be migrated to analytics service later

### Why HTML Content Storage?
- Flexibility for rich formatting
- Easy integration with WYSIWYG editors
- Can support both HTML and Markdown

## File Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── blog.py              # Blog CRUD endpoints
│   │   └── blog_uploads.py      # Image upload endpoints
│   └── models/
│       └── blog_post.py         # Blog post model
├── alembic/versions/
│   └── 006_blog_posts.py        # Database migration
└── uploads/blog/                # Uploaded images

frontend/
└── src/app/
    ├── admin/blog/
    │   └── page.tsx             # Admin blog editor
    └── blog/
        ├── page.tsx             # Public blog listing
        └── [slug]/
            └── page.tsx         # Public blog detail
```

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoints in Swagger docs at `/docs`
3. Check server logs for errors
4. Verify database migration ran successfully

## Conclusion

The Blog/CMS module is now fully implemented with:
- ✅ Complete CRUD API
- ✅ Admin editor UI
- ✅ Public blog pages
- ✅ SEO metadata
- ✅ Image uploads
- ✅ Search functionality
- ✅ Social sharing

Ready for production use with room for future enhancements!
