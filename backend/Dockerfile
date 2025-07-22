FROM python:3.10

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Install pixi
# Ref: https://pixi.sh/latest/installation/
RUN curl -fsSL https://pixi.sh/install.sh | bash

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/root/.pixi/bin:$PATH"

# Compile bytecode
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
# ENV UV_COMPILE_BYTECODE=1

# uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
# ENV UV_LINK_MODE=copy

# Install dependencies
# Copy files needed for dependency installation first
# RUN --mount=type=bind,source=pixi.lock,target=pixi.lock \
#     --mount=type=bind,source=pixi.toml,target=pixi.toml \
#     pixi install

COPY ./pixi.toml ./pixi.lock ./alembic.ini /app/

# Install dependencies using pixi
RUN pixi install

# Verify pixi tasks are available
RUN pixi task list

# Set up environment to use pixi
# ENV PATH="/app/.pixi/envs/default/bin:$PATH"

# ENV PYTHONPATH=/app/.pixi

COPY ./scripts /app/scripts

COPY ./app /app/app

# Set environment variables for production
ENV NIIVUE_BUILD_DIR="/app/static"
ENV DATA_DIR="/app/data" 
ENV SCENE_SCHEMA_ID="niivue-fullstack-demo"
ENV PYTHONPATH="/app"

# Use the serve task for production
CMD ["pixi", "run", "serve"]
