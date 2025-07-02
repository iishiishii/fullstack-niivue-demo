import uuid
from typing import Any

from sqlmodel import Session

from app.models import Scene, SceneCreate


def create_scene(*, session: Session, scene_in: SceneCreate) -> Scene:
    print(f"Creating scene with data: {scene_in}")
    db_scene = Scene.model_validate(scene_in)
    session.add(db_scene)
    session.commit()
    session.refresh(db_scene)
    return db_scene
