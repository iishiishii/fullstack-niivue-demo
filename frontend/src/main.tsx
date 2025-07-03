import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import MedicalImageProcessor from "./components/image-processor.tsx";
import { ApiError, OpenAPI } from "./client";

OpenAPI.BASE = import.meta.env.VITE_API_URL;
OpenAPI.TOKEN = async () => {
  return localStorage.getItem("access_token") || "";
};

const handleApiError = (error: Error) => {
  if (error instanceof ApiError && [401, 403].includes(error.status)) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
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

createRoot(document.getElementById("root")!).render(
  // disable strict mode for for better niivue development experience
  // <StrictMode>
  <div className="app-container">
    <div className="main-content">
      <QueryClientProvider client={queryClient}>
        <MedicalImageProcessor />
      </QueryClientProvider>
    </div>
  </div>
  // </StrictMode>,
);
