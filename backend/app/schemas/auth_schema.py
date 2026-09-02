from pydantic import BaseModel, EmailStr
from typing import Optional

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    department: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OrgRegisterRequest(BaseModel):
    org_name: str
    industry: str
    admin_name: str
    admin_email: EmailStr
    admin_password: str

class EmployeeRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    department: str
    role: str
    org_id: int