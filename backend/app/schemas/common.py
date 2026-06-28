from pydantic import BaseModel
from typing import Generic, TypeVar, Any

T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    data: T


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    meta: "PaginationMeta"


class PaginationMeta(BaseModel):
    cursor: str | None = None
    has_more: bool = False
    total: int | None = None


class ErrorResponse(BaseModel):
    error: str
    message: str
    status: int
    trace_id: str | None = None
