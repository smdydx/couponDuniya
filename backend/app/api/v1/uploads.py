from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from pathlib import Path
import uuid
import os
import shutil
from typing import Optional
import io

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

router = APIRouter(prefix="/admin/upload", tags=["Admin"])

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'}
MAX_FILE_SIZE = 2 * 1024 * 1024
UPLOAD_DIR = Path("app/images")

UPLOAD_CATEGORIES = {
    'merchants': UPLOAD_DIR / 'merchants',
    'products': UPLOAD_DIR / 'products',
    'offers': UPLOAD_DIR / 'offers',
    'banners': UPLOAD_DIR / 'banners',
    'categories': UPLOAD_DIR / 'categories',
}

for path in UPLOAD_CATEGORIES.values():
    path.mkdir(parents=True, exist_ok=True)


def validate_image(file: UploadFile) -> tuple[bool, str]:
    ext = Path(file.filename).suffix.lower() if file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"File type '{ext}' not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    return True, ""


def optimize_image(file_content: bytes, max_width: int = 1200, quality: int = 85) -> tuple[bytes, str]:
    if not PIL_AVAILABLE:
        return file_content, ''
    try:
        img = Image.open(io.BytesIO(file_content))
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        return output.getvalue(), '.jpg'
    except Exception:
        return file_content, ''


@router.post("/image")
async def upload_image(
    file: UploadFile = File(None),
    image_url: str = Form(None),
    category: str = Form("products"),
    optimize: bool = Form(True)
):
    if not file and not image_url:
        raise HTTPException(status_code=400, detail="Either file or image_url is required")
    
    if image_url:
        return {
            "success": True,
            "message": "URL accepted",
            "data": {
                "url": image_url,
                "type": "external"
            }
        }
    
    if category not in UPLOAD_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Allowed: {', '.join(UPLOAD_CATEGORIES.keys())}")
    
    valid, error = validate_image(file)
    if not valid:
        raise HTTPException(status_code=400, detail=error)
    
    content = await file.read()
    
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File size exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit")
    
    ext = Path(file.filename).suffix.lower() if file.filename else '.jpg'
    if optimize and ext in {'.jpg', '.jpeg', '.png', '.webp'} and PIL_AVAILABLE:
        optimized_content, new_ext = optimize_image(content)
        if new_ext:
            content = optimized_content
            ext = new_ext
    
    unique_id = uuid.uuid4().hex[:12]
    original_name = Path(file.filename).stem if file.filename else 'image'
    safe_name = "".join(c for c in original_name if c.isalnum() or c in '-_')[:50]
    filename = f"{safe_name}_{unique_id}{ext}"
    
    file_path = UPLOAD_CATEGORIES[category] / filename
    
    with open(file_path, 'wb') as f:
        f.write(content)
    
    relative_url = f"/images/{category}/{filename}"
    
    return {
        "success": True,
        "message": "Image uploaded successfully",
        "data": {
            "url": relative_url,
            "filename": filename,
            "category": category,
            "size": len(content),
            "type": "local"
        }
    }


@router.delete("/image/{category}/{filename}")
async def delete_image(category: str, filename: str):
    if category not in UPLOAD_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    file_path = UPLOAD_CATEGORIES[category] / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        file_path.unlink()
        return {"success": True, "message": "Image deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image: {str(e)}")


@router.get("/images/{category}")
async def list_images(category: str, limit: int = 50, offset: int = 0):
    if category not in UPLOAD_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    folder = UPLOAD_CATEGORIES[category]
    images = []
    
    for f in sorted(folder.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
        if f.is_file() and f.suffix.lower() in ALLOWED_EXTENSIONS:
            images.append({
                "filename": f.name,
                "url": f"/images/{category}/{f.name}",
                "size": f.stat().st_size,
                "modified": f.stat().st_mtime
            })
    
    total = len(images)
    images = images[offset:offset + limit]
    
    return {
        "success": True,
        "data": {
            "images": images,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    }
