from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import Role, Permission, RolePermission, Department, UserRole, UserDepartment, User
from ...schemas import (
    RoleRead, RoleCreate,
    PermissionRead, PermissionCreate,
    DepartmentRead, DepartmentCreate,
    AssignPermission, AssignRole, AssignDepartment
)
from jose import jwt, JWTError
from fastapi import Header
from ...config import get_settings

settings = get_settings()
router = APIRouter(prefix="/access", tags=["Access Control"])

def require_admin(db: Session = Depends(get_db), authorization: str | None = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split()[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return user

@router.get("/roles", response_model=list[RoleRead])
def list_roles(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Role).all()

@router.post("/roles", response_model=RoleRead)
def create_role(payload: RoleCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    r = Role(**payload.dict())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

@router.get("/permissions", response_model=list[PermissionRead])
def list_permissions(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Permission).all()

@router.post("/permissions", response_model=PermissionRead)
def create_permission(payload: PermissionCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    p = Permission(**payload.dict())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@router.post("/roles/assign-permission")
def assign_permission(payload: AssignPermission, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    existing = db.query(RolePermission).filter(RolePermission.role_id == payload.role_id, RolePermission.permission_id == payload.permission_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already assigned")
    rp = RolePermission(role_id=payload.role_id, permission_id=payload.permission_id)
    db.add(rp)
    db.commit()
    return {"status": "ok"}

@router.get("/departments", response_model=list[DepartmentRead])
def list_departments(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Department).all()

@router.post("/departments", response_model=DepartmentRead)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    d = Department(**payload.dict())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d

@router.post("/assign-role")
def assign_role(payload: AssignRole, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    existing = db.query(UserRole).filter(UserRole.user_id == payload.user_id, UserRole.role_id == payload.role_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already assigned")
    ur = UserRole(user_id=payload.user_id, role_id=payload.role_id)
    db.add(ur)
    db.commit()
    return {"status": "ok"}

@router.post("/assign-department")
def assign_department(payload: AssignDepartment, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    existing = db.query(UserDepartment).filter(UserDepartment.user_id == payload.user_id, UserDepartment.department_id == payload.department_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already assigned")
    ud = UserDepartment(user_id=payload.user_id, department_id=payload.department_id)
    db.add(ud)
    db.commit()
    return {"status": "ok"}
