from pydantic import BaseModel
from pydantic import EmailStr


class RegisterRequest(BaseModel):

    full_name: str

    email: EmailStr

    password: str

    department: str


class LoginRequest(BaseModel):

    email: EmailStr

    password: str