import json
import os

from fastapi import HTTPException, Security, status, Request
from fastapi.security import OAuth2AuthorizationCodeBearer, APIKeyCookie
from fastapi.security.api_key import APIKeyQuery

from ..client import get_client
from ..models import User
from app.core.config import settings
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
# from passlib.context import CryptContext

from app.core.config import settings

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


ALGORITHM = "HS256"

JHUB_APPS_AUTH_COOKIE_NAME = "jhub_apps_access_token"

def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def _get_jhub_token_from_jwt_token(token):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "msg": "Could not validate credentials"
        },
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"Decoding JWT token: {token}, os.environ['JHUB_APP_JWT_SECRET_KEY']: {os.environ['JHUB_APP_JWT_SECRET_KEY']}")
        payload = jwt.decode(token, os.environ["JHUB_APP_JWT_SECRET_KEY"], algorithms=["HS256"])
        print(f"Decoded JWT payload: {payload}")
        access_token_data: dict = payload.get("sub")
        print(f"Access token data: {access_token_data}")
        if access_token_data is None:
            raise credentials_exception
    except jwt.PyJWTError as e:
        print("Authentication failed for token")
        print(e)
        raise credentials_exception
    print("Fetched access token from JWT Token")
    return access_token_data["access_token"]


# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     return pwd_context.verify(plain_password, hashed_password)


# def get_password_hash(password: str) -> str:
#     return pwd_context.hash(password)

### Endpoints can require authentication using Depends(get_current_user)
### get_current_user will look for a token in url params or
### Authorization: bearer token (header).
### Hub technically supports cookie auth too, but it is deprecated so
### not being included here.
auth_by_param = APIKeyQuery(name="login_token", auto_error=False)
auth_url = os.environ["PUBLIC_HOST"] + "/hub/api/oauth2/authorize"
auth_by_header = OAuth2AuthorizationCodeBearer(
    authorizationUrl=auth_url, tokenUrl="oauth_callback", auto_error=False
)
auth_by_cookie = APIKeyCookie(name=JHUB_APPS_AUTH_COOKIE_NAME, auto_error=False)

print(f"auth_url: {auth_url}, PUBLIC_HOST: {os.getenv('PUBLIC_HOST', 'http://127.0.0.1:8000')}, auth_by_cookie: {auth_by_cookie}, JUPYTERHUB_API_TOKEN: {os.getenv('JUPYTERHUB_API_TOKEN')}")
### ^^ The flow for OAuth2 in Swagger is that the "authorize" button
### will redirect user (browser) to "auth_url", which is the Hub login page.
### After logging in, the browser will POST to our internal /get_token endpoint
### with the auth code.  That endpoint POST's to Hub /oauth2/token with
### our client_secret (JUPYTERHUB_API_TOKEN) and that code to get an
### access_token, which it returns to browser, which places in Authorization header.

if os.environ.get("JUPYTERHUB_OAUTH_SCOPES"):
    # typically ["access:services", "access:services!service=$service_name"]
    access_scopes = json.loads(os.environ["JUPYTERHUB_OAUTH_SCOPES"])
else:
    access_scopes = ["access:services"]


### For consideration: optimize performance with a cache instead of
### always hitting the Hub api?
async def get_current_user(
    request: Request,
    auth_param: str = Security(auth_by_param),
    auth_header: str = Security(auth_by_header),
    auth_cookie: str = Security(auth_by_cookie),
) -> User:
    print(f"🚀 get_current_user called!")
    print(f"🍪 All cookies: {dict(request.cookies)}")
    print(f"🔍 Auth sources - param: {bool(auth_param)}, header: {bool(auth_header)}, cookie: {bool(auth_cookie)}")
    print(f"📝 Values - param: {auth_param}, header: {auth_header}, cookie: {auth_cookie}")
    token = auth_param or auth_header or auth_cookie
    print(f"get_current_user: token={token}")
    if token is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Must login with token parameter or Authorization bearer header",
        )
    token = _get_jhub_token_from_jwt_token(token)

    async with get_client() as client:
        endpoint = "/user"
        # normally we auth to Hub API with service api token,
        # but this time auth as the user token to get user model
        headers = {"Authorization": f"Bearer {token}"}
        print(f"Getting user info from Hub: {os.environ['PUBLIC_HOST']}{endpoint}, {headers}")
        resp = await client.get(endpoint, headers=headers)
        print(f"Response from Hub: {resp.status_code}")
        if resp.is_error:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail={
                    "msg": "Error getting user info from token",
                    "request_url": str(resp.request.url),
                    "token": token,
                    "response_code": resp.status_code,
                    "hub_response": resp.json(),
                },
            )
    user = User(**resp.json())
    print(f"User info from Hub: {resp.json()}")
    # user = session.get(User, resp.json().get("id"))
    if any(scope in user.scopes for scope in access_scopes):
        return user
    else:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail={
                "msg": f"User not authorized: {user.name}",
                "request_url": str(resp.request.url),
                "token": token,
                "user": resp.json(),
            },
        )


# def get_current_user(session: SessionDep, token: TokenDep) -> User:
#     try:
#         payload = jwt.decode(
#             token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
#         )
#         token_data = TokenPayload(**payload)
#     except (InvalidTokenError, ValidationError):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Could not validate credentials",
#         )
#     user = session.get(User, token_data.sub)
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#     if not user.is_active:
#         raise HTTPException(status_code=400, detail="Inactive user")
#     return user