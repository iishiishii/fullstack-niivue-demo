import uuid
from typing import Any

from sqlmodel import Session

from app.models import Scene, SceneCreate


def create_scene(*, session: Session, scene_in: SceneCreate, owner_id: uuid.UUID) -> Scene:
    print(f"Creating scene with data: {scene_in}")
    db_scene = Scene.model_validate(scene_in, update={"owner_id": owner_id})
    session.add(db_scene)
    session.commit()
    session.refresh(db_scene)
    return db_scene
