import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, delete, func, select

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
)
from app.core.config import settings
from app.models import (
    AuthorizationError,
    HubApiError,
    Message,
    Scene,
    User,
    UserPublic,
    UsersPublic
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic, responses={401: {"model": AuthorizationError}, 400: {"model": HubApiError}})
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
    return user