from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine, Base
from app.models import BlogPost

client = TestClient(app)

# Ensure tables exist for sqlite ephemeral test DB
Base.metadata.create_all(bind=engine)

ADMIN_HEADERS = {"Authorization": "Bearer faketoken"}

def test_blog_create_list_update_delete_flow():
    payload = {
        "title": "Test Post",
        "content": "Hello World",
        "excerpt": "Hello",
        "status": "draft"
    }
    create = client.post("/api/v1/blog/admin/posts", json=payload, headers=ADMIN_HEADERS)
    assert create.status_code == 200
    post_id = create.json()["data"]["id"]

    listing = client.get("/api/v1/blog/admin/posts", headers=ADMIN_HEADERS)
    assert listing.status_code == 200
    assert any(p["id"] == post_id for p in listing.json()["data"]["posts"])

    update = client.put(f"/api/v1/blog/admin/posts/{post_id}", json={"status": "published"}, headers=ADMIN_HEADERS)
    assert update.status_code == 200
    assert update.json()["data"]["status"] == "published"

    # Public fetch by slug
    slug = update.json()["data"]["slug"]
    public = client.get(f"/api/v1/blog/posts/{slug}")
    assert public.status_code == 200

    delete = client.delete(f"/api/v1/blog/admin/posts/{post_id}", headers=ADMIN_HEADERS)
    assert delete.status_code == 200
    gone = client.get(f"/api/v1/blog/posts/{slug}")
    assert gone.status_code == 404
