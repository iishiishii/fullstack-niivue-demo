import uuid
from enum import Enum
from sqlalchemy import JSON, Column
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlmodel import Field, Relationship, SQLModel

class UserBase(SQLModel):
    name: str = Field(default=None, max_length=255)
    admin: bool = False
    groups: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    # server: Optional[str] = Field(default=None)
    pending: Optional[str] = Field(default=None)
    last_activity: datetime = Field(default=None)
    scopes: List[str] = Field(default_factory=list, sa_column=Column(JSON))

# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    scenes: list["Scene"] = Relationship(back_populates="owner", cascade_delete=True)

# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID

class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int

# https://stackoverflow.com/questions/64501193/fastapi-how-to-use-httpexception-in-responses
class AuthorizationError(SQLModel):
    detail: str


class HubResponse(SQLModel):
    msg: str
    request_url: str
    token: str
    response_code: int
    hub_response: dict


class HubApiError(SQLModel):
    detail: HubResponse


class ProcessingStatus(str, Enum):
    """Enum for scene processing status values."""
    PENDING = "pending"
    PROCESSING = "processing" 
    COMPLETED = "completed"
    FAILED = "failed"


# Shared properties
class SceneBase(SQLModel):
    timestamp: datetime = Field(default_factory=datetime.now)
    nv_document: Dict[str, Any] = Field(sa_column=Column(JSON))
    tool_name: str | None = Field(default=None, max_length=255)
    status: ProcessingStatus = Field(
        default=ProcessingStatus.PENDING
    )  # Uses enum for type safety
    result: Dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    error: str | None = Field(default=None, max_length=255)


# Properties to receive on scene creation
class SceneCreate(SceneBase):
    pass


# Properties to receive on scene update
class SceneUpdate(SceneBase):
    nv_document: Dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON)
    )  # Optional update to nv_document
    tool_name: str | None = Field(
        default=None, min_length=1, max_length=255
    )  # Optional update to tool name
    status: ProcessingStatus | None = Field(
        default=None
    )  # Optional update to status using enum


# Database model, database table inferred from class name
class Scene(SceneBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="scenes")


# Properties to return via API, id is always required
class ScenePublic(SceneBase):
    id: uuid.UUID
    owner_id: uuid.UUID

class ScenesPublic(SQLModel):
    data: list[ScenePublic]
    count: int

# Generic message
class Message(SQLModel):
    message: str

