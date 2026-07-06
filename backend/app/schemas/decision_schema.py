from pydantic import BaseModel


class DecisionRequest(BaseModel):

    project: str


class DecisionResponse(BaseModel):

    recommendation: str

    confidence: str