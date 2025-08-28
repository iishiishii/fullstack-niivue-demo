import os
from datetime import timedelta
from fastapi import APIRouter, Depends, Form, Request
from starlette.responses import RedirectResponse

from app.api.deps import CurrentUser, SessionDep
from app.client import get_client
from app.models import AuthorizationError, HubApiError, User
from app.core.security import create_access_token, get_current_user

# APIRouter prefix cannot end in /
# service_prefix = os.getenv("JUPYTERHUB_SERVICE_PREFIX", "").rstrip("/")
router = APIRouter(tags=["hub"])

# Expires in 7 days
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

@router.get("/jhub-login", description="Login via OAuth2")
async def login(request: Request):
    authorization_url = (
        os.environ["PUBLIC_HOST"]
        + "/hub/api/oauth2/authorize?response_type=code&client_id=" + os.environ["JUPYTERHUB_CLIENT_ID"]
    )
    print("Redirecting to:", authorization_url, os.environ["JUPYTERHUB_API_TOKEN"])
    return RedirectResponse(authorization_url, status_code=302)


@router.get("/oauth_callback")
async def get_token(code: str):
    "Callback function for OAuth2AuthorizationCodeBearer scheme"
    # The only thing we need in this form post is the code
    # Everything else we can hardcode / pull from env
    print(f"get_token called with code: {code}")
    async with get_client() as client:
        redirect_uri = (
            os.environ["PUBLIC_HOST"] + os.environ["JUPYTERHUB_OAUTH_CALLBACK_URL"],
        )
        data = {
            "client_id": os.environ["JUPYTERHUB_CLIENT_ID"],
            "client_secret": os.environ["JUPYTERHUB_API_TOKEN"],
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        }
        resp = await client.post("/oauth2/token", data=data)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        resp.json(), expires_delta=access_token_expires
    )
    ### resp.json() is {'access_token': <token>, 'token_type': 'Bearer'}
    response = RedirectResponse(
        os.environ["PUBLIC_HOST"] + "/hub/home", status_code=302
    )
    response.set_cookie(key="access_token", value=access_token, httponly=True)
    return response



@router.get("/")
async def index():
    "Non-authenticated function that returns {'Hello': 'World'}"
    return {"Hello": "World"}


# response_model and responses dict translate to OpenAPI (Swagger) hints
# compare and contrast what the /me endpoint looks like in Swagger vs /debug
@router.get(
    "/me",
    response_model=User,
    responses={401: {'model': AuthorizationError}, 400: {'model': HubApiError}},
)
async def me(user: User = Depends(get_current_user)):
    "Authenticated function that returns the User model"
    return user


@router.get("/debug")
async def debug(request: Request, user: User = Depends(get_current_user)):
    """
    Authenticated function that returns a few pieces of debug
     * Environ of the service process
     * Request headers
     * User model
    """
    return {
        "env": dict(os.environ),
        "headers": dict(request.headers),
        "user": user,
    }
