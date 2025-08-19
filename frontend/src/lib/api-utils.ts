import type { ApiError } from "../client";

export const handleError = (err: ApiError) => {
  const errDetail = (err.body as any)?.detail;
  let errorMessage = errDetail || "Something went wrong.";
  if (Array.isArray(errDetail) && errDetail.length > 0) {
    errorMessage = errDetail[0].msg;
  }
  alert(errorMessage);
};
