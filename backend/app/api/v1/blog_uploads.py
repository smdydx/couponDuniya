from fastapi import APIRouter, HTTPException, Depends, Request, File, UploadFile
from pathlib import Path
import uuid
import os
from typing import List

router = APIRouter(prefix="/blog/uploads", tags=["Blog Uploads"])


def require_admin(request: Request):
    """Simple admin check - enhance with proper JWT verification"""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    return True


# Configure upload directory
UPLOAD_DIR = Path("uploads/blog")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file"""

    # Check file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check file size (FastAPI doesn't provide size directly, so we'll check during read)


@router.post("/image", response_model=dict)
async def upload_blog_image(
    file: UploadFile = File(...),
    _: bool = Depends(require_admin)
):
    """Upload an image for blog posts (Admin only)"""

    validate_image_file(file)

    # Generate unique filename
    ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / unique_filename

    # Read and validate file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )

    # Write file to disk
    with open(file_path, "wb") as f:
        f.write(contents)

    # Return URL (adjust based on your static file serving setup)
    file_url = f"/uploads/blog/{unique_filename}"

    return {
        "success": True,
        "message": "Image uploaded successfully",
        "data": {
            "url": file_url,
            "filename": unique_filename,
            "original_filename": file.filename,
            "size": len(contents)
        }
    }


@router.post("/images/batch", response_model=dict)
async def upload_multiple_blog_images(
    files: List[UploadFile] = File(...),
    _: bool = Depends(require_admin)
):
    """Upload multiple images for blog posts (Admin only)"""

    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed per batch")

    uploaded_files = []
    errors = []

    for file in files:
        try:
            validate_image_file(file)

            # Generate unique filename
            ext = Path(file.filename).suffix.lower()
            unique_filename = f"{uuid.uuid4()}{ext}"
            file_path = UPLOAD_DIR / unique_filename

            # Read and validate file size
            contents = await file.read()
            if len(contents) > MAX_FILE_SIZE:
                errors.append({
                    "filename": file.filename,
                    "error": f"File size exceeds {MAX_FILE_SIZE // (1024 * 1024)}MB"
                })
                continue

            # Write file to disk
            with open(file_path, "wb") as f:
                f.write(contents)

            file_url = f"/uploads/blog/{unique_filename}"

            uploaded_files.append({
                "url": file_url,
                "filename": unique_filename,
                "original_filename": file.filename,
                "size": len(contents)
            })

        except HTTPException as e:
            errors.append({
                "filename": file.filename,
                "error": e.detail
            })
        except Exception as e:
            errors.append({
                "filename": file.filename,
                "error": str(e)
            })

    return {
        "success": len(uploaded_files) > 0,
        "message": f"Uploaded {len(uploaded_files)} files successfully",
        "data": {
            "uploaded": uploaded_files,
            "errors": errors
        }
    }


@router.delete("/image/{filename}", response_model=dict)
def delete_blog_image(
    filename: str,
    _: bool = Depends(require_admin)
):
    """Delete a blog image (Admin only)"""

    # Validate filename to prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        os.remove(file_path)
        return {
            "success": True,
            "message": "Image deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image: {str(e)}")
