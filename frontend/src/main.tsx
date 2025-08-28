import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import "./index.css";
import MedicalImageProcessor from "./components/image-processor.tsx";
import { ApiError, OpenAPI } from "./client";
import { routeTree } from "./routeTree.gen";

const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL || "/";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/";
OpenAPI.BASE = import.meta.env.VITE_API_URL;
OpenAPI.TOKEN = async () => {
  const token = localStorage.getItem("access_token") || "";
  console.log(
    "🔑 TOKEN being sent:",
    token ? `${token.substring(0, 20)}...` : "NO TOKEN"
  );
  return token;
};

const handleApiError = (error: Error) => {
  if (error instanceof ApiError && [401, 403].includes(error.status)) {
    localStorage.removeItem("access_token");
    window.location.href = "http://127.0.0.1:8000/hub/login";
  }
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
});

const currentUrl = new URL(window.location.href);
const isHubRoute = currentUrl.pathname.indexOf("hub") !== -1;
const basepath = isHubRoute ? APP_BASE_URL : API_BASE_URL;

const router = createRouter({
  routeTree,
  basepath: basepath,
});
console.log("Router created with basepath:", router.basepath);
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  // disable strict mode for for better niivue development experience
  // <StrictMode>
  <div className="app-container">
    <div className="main-content">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {/* <MedicalImageProcessor /> */}
      </QueryClientProvider>
    </div>
  </div>
  // </StrictMode>,
);
