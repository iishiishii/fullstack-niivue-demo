# Fullstack NiiVue Project - Development

## URLs

The production or staging URLs would use these same paths, but with your own domain.

### Development URLs

Development URLs, for local development.

Frontend: http://localhost:5173

Backend: http://localhost:8000

Automatic Interactive Docs (Swagger UI): http://localhost:8000/docs

Automatic Alternative Docs (ReDoc): http://localhost:8000/redoc

## Local Development

## set up environments and install dependencies

Requirements:
- Node.js (for frontend environment)
- npm (for frontend environment)
- pixi (for backend environment)
- git


### frontend

```bash
cd frontend
npm install
```

### backend

```bash
cd backend
pixi install
```

## run the frontend in development mode

```bash
cd frontend
npm run dev
```

## run the backend in development mode

This hot reloads the backend when changes are made to the code.

> Note: the frontend will be "static" in this mode.

```bash
cd backend
pixi run dev
```

## build the frontend for production

```bash
cd frontend
npm run build
```