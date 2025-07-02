from sqlmodel import Session, create_engine, select
from datetime import datetime
from app import crud
from app.core.config import settings
from app.models import Scene, SceneCreate

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)
    # Check if there are any scenes in the database
    scene = session.exec(select(Scene)).first()
    if not scene:
        # Create an empty/default scene
        scene_in = SceneCreate(
            nv_document={
                "title": "Default Scene",
                "imageOptionsArray": [],
            },
            tool_name="niimath",
        )
        scene = crud.create_scene(session=session, scene_in=scene_in)