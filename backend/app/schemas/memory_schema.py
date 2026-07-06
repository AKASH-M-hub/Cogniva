from pydantic import BaseModel


class MemoryCreate(BaseModel):

    department: str

    title: str

    decision: str

    reason: str

    priority: str


class MemoryResponse(BaseModel):

    success: bool

    message: str