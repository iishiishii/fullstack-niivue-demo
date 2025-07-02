import uuid
from sqlalchemy import JSON, Column
from datetime import datetime
from typing import Dict, Any
from sqlmodel import Field, SQLModel


# Shared properties
class SceneBase(SQLModel):
    timestamp: datetime = Field(default_factory=datetime.now)
    nv_document: Dict[str, Any] = Field(sa_column=Column(JSON))
    tool_name: str = Field(min_length=1, max_length=255)
    status: str = Field(
        default="pending", min_length=1, max_length=50
    )  # e.g., pending, processing, completed, error
    result: Dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    error: str | None = Field(default=None, max_length=255)


# Properties to receive on scene creation
class SceneCreate(SceneBase):
    pass


# Properties to receive on scene update
class SceneUpdate(SceneBase):
    result: Dict[str, Any] | None = Field(sa_column=Column(JSON))


# TODO: add owner_id to link scene to user
# Database model, database table inferred from class name
class Scene(SceneBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)


# Properties to return via API, id is always required
class ScenePublic(SceneBase):
    id: uuid.UUID


class ScenesPublic(SQLModel):
    data: list[ScenePublic]
    count: int
