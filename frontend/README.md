# Fullstack NiiVue project -Frontend

The frontend is built with [Vite](https://vitejs.dev/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [TanStack Query](https://tanstack.com/query), [TanStack Router](https://tanstack.com/router) and [Shadcn UI](https://ui.shadcn.com/).

## Frontend development

Before you begin, ensure that you have either the Node Version Manager (nvm)

* To install nvm, you can install it using the [official nvm guide](https://github.com/nvm-sh/nvm#installing-and-updating).

* After installing either nvm or fnm, proceed to the `frontend` directory:

```bash
cd frontend
```
* If the Node.js version specified in the `.nvmrc` file isn't installed on your system, you can install it using the appropriate command:

```bash
nvm install
```

* Once the installation is complete, switch to the installed version:

```bash
nvm use
```

* Within the `frontend` directory, install the necessary NPM packages:

```bash
npm install
```

* And start the live server with the following `npm` script:

```bash
npm run dev
```

* Then open your browser at http://localhost:5173/.

## Generate Client

### Automatically

* Activate the backend virtual environment.
* From the top level project directory, run the script:

```bash
./scripts/generate-client.sh
```

* Commit the changes.

Notice that everytime the backend changes (changing the OpenAPI schema), you should follow these steps again to update the frontend client.

## Code Structure

The frontend code is structured as follows:

* `frontend/src` - The main frontend code.
* `frontend/src/client` - The generated OpenAPI client.
* `frontend/src/components` -  The different components of the frontend.
* `frontend/src/routes` - The different routes of the frontend which include the pages.