from app.api.routes import scenes, upload
from fastapi import APIRouter

from app.api.routes import utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(utils.router)
api_router.include_router(scenes.router)
api_router.include_router(upload.router)
