from pydantic import BaseModel

class RoleRead(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    is_system: bool
    class Config:
        from_attributes = True

class RoleCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None

class PermissionRead(BaseModel):
    id: int
    code: str
    description: str | None
    class Config:
        from_attributes = True

class PermissionCreate(BaseModel):
    code: str
    description: str | None = None

class DepartmentRead(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    is_active: bool
    class Config:
        from_attributes = True

class DepartmentCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None

class AssignPermission(BaseModel):
    role_id: int
    permission_id: int

class AssignRole(BaseModel):
    user_id: int
    role_id: int

class AssignDepartment(BaseModel):
    user_id: int
    department_id: int
