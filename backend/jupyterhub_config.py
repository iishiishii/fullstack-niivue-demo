import os
import warnings
import sys
from pathlib import Path
from base64 import b64encode
from secrets import token_bytes

def _create_token_for_service():
    # Use the one from environment if available
    if os.environ.get("JHUB_APP_JWT_SECRET_KEY"):
        return os.environ["JHUB_APP_JWT_SECRET_KEY"]
    return b64encode(token_bytes(32))

# When Swagger performs OAuth2 in the browser, it will set
# the request host + relative path as the redirect uri, causing a
# uri mismatch if the oauth_redirect_uri is just the relative path
# is set in the c.JupyterHub.services entry (as per default).
# Therefore need to know the request host ahead of time.
if "PUBLIC_HOST" not in os.environ:
    msg = (
        "env PUBLIC_HOST is not set, defaulting to http://127.0.0.1:8000.  "
        "This can cause problems with OAuth.  "
        "Set PUBLIC_HOST to your public (browser accessible) host."
    )
    warnings.warn(msg)
    public_host = "http://127.0.0.1:8000"
else:
    public_host = os.environ["PUBLIC_HOST"].rstrip('/')
service_name = "fastapi"
# public_host = c.JupyterHub.bind_url
oauth_redirect_uri = f"{public_host}/services/{service_name}/oauth_callback"
print(f"oauth_redirect_uri: {oauth_redirect_uri}, public_host: {public_host}, service_name: {service_name}")
jwt_token = _create_token_for_service()
print(f"Using JWT token for service: {jwt_token}")
c = get_config()  # noqa
c.JupyterHub.services = [
    {
        "name": service_name,
        "url": "http://127.0.0.1:10202",
        "command": ["fastapi", "run", "--host=0.0.0.0", "--port=10202", "app/main.py"],
        "oauth_redirect_uri": oauth_redirect_uri,
        "oauth_no_confirm": True,
        "display": False,
        "environment": {
            "PUBLIC_HOST": public_host,
            # JupyterHub service configuration
            "JUPYTERHUB_SERVICE_PREFIX": f"/services/{service_name}",
            # Required settings for FastAPI service
            "PROJECT_NAME": os.environ.get("PROJECT_NAME", "Full Stack NiiVue"),
            "POSTGRES_SERVER": os.environ.get("POSTGRES_SERVER", "127.0.0.1"),
            "POSTGRES_PORT": os.environ.get("POSTGRES_PORT", "5432"),
            "POSTGRES_DB": os.environ.get("POSTGRES_DB", "app"),
            "POSTGRES_USER": os.environ.get("POSTGRES_USER", "postgres"),
            "POSTGRES_PASSWORD": os.environ.get("POSTGRES_PASSWORD", "changethis"),
            "FIRST_SUPERUSER": os.environ.get("FIRST_SUPERUSER", "admin@example.com"),
            "FIRST_SUPERUSER_PASSWORD": os.environ.get("FIRST_SUPERUSER_PASSWORD", "changethis"),
            "SECRET_KEY": os.environ.get("SECRET_KEY", "changethis"),
            "BACKEND_CORS_ORIGINS": os.environ.get("BACKEND_CORS_ORIGINS", "http://localhost:5173"),
            "ENVIRONMENT": os.environ.get("ENVIRONMENT", "local"),
            "FRONTEND_HOST": os.environ.get("FRONTEND_HOST", "http://localhost:5173"),
            "JHUB_APP_JWT_SECRET_KEY": jwt_token.decode(),
        },
    }
]

c.JupyterHub.load_roles = [
    {
        "name": "user",
        # grant all users access to services
        "scopes": ["self", "access:services"],
    },
]


# dummy for testing, create test-user
c.Authenticator.allowed_users = {"test-user"}
c.JupyterHub.authenticator_class = "dummy"
c.JupyterHub.spawner_class = "simple"
# c.JupyterHub.redirect_to_server = False
# c.JupyterHub.default_url = os.environ.get("FRONTEND_HOST", "http://localhost:5173")
c.JupyterHub.template_paths = ["templates"]
c.JupyterHub.template_vars = {
    "hub_title": "Welcome to Niivue Full Stack",
    "hub_subtitle": "this is a neuroimage processing platform",
    "welcome": "Running in dev mode",
    "display_version": True,
}
c.JupyterHub.allow_named_servers = True
c.JupyterHub.default_url = "/hub/home"

# hub_url = "http://127.0.0.1:8000"

# if running from Docker 
hub_url = "http://0.0.0.0:8000"
c.JupyterHub.bind_url = hub_url

# don't cache static files
c.JupyterHub.tornado_settings = {
    "no_cache_static": True,
    "slow_spawn_timeout": 0,
}

# Persist hub data on volume mounted inside container
c.JupyterHub.cookie_secret = jwt_token
c.JupyterHub.cookie_secret_file = "/data/jupyterhub_cookie_secret"
c.JupyterHub.db_url = "sqlite:////data/jupyterhub.sqlite"