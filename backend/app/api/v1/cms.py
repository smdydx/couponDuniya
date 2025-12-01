from fastapi import APIRouter

router = APIRouter(prefix="/cms", tags=["CMS"])


@router.get("/pages/{slug}", response_model=dict)
def get_page(slug: str):
    return {
        "success": True,
        "data": {
            "slug": slug,
            "title": slug.replace("-", " ").title(),
            "content": "<p>Static page content</p>",
        },
    }
