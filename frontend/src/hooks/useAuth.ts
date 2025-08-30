import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  type Body_login_login_access_token as AccessToken,
  type UsersVerifyEmailData as VerifyEmail,
  type ApiError,
  type UserRegister,
  type UserPublic,
  LoginService,
  UsersService,
} from "@/client";
import { handleError } from "@/lib/api-utils";

const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null;
};

const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useQuery<UserPublic | null, Error>({
    queryKey: ["currentUser"],
    queryFn: UsersService.readUserMe,
    enabled: isLoggedIn(),
  });

  const signUpMutation = useMutation({
    mutationFn: (data: UserRegister) =>
      UsersService.registerUser({ requestBody: data }),

    onSuccess: (_, variables) => {
      navigate({
        to: "/verify",
        search: {
          email: variables.email,
          mode: "verify", // to indicate we're in verification mode
        },
      });
    },
    onError: (err: ApiError) => {
      handleError(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const verifyEmail = async (data: VerifyEmail) => {
    console.log("Verifying email with data:", data);
    const response = await UsersService.verifyEmail({
      email: data.email,
      code: data.code,
    });
    console.log("Email verification successful:", response);
  };

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      navigate({ to: "/" });
    },
    onError: (err: ApiError) => {
      handleError(err);
    },
  });

  const login = async (data: AccessToken) => {
    const response = await LoginService.loginAccessToken({
      formData: data,
    });
    console.log("Login successful, received access token:", response);
    localStorage.setItem("access_token", response.access_token);
  };

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: "/" });
    },
    onError: (err: ApiError) => {
      handleError(err);
    },
  });

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate({ to: "/auth" });
  };

  return {
    loginMutation,
    verifyMutation,
    signUpMutation,
    logout,
    user,
    error,
    resetError: () => setError(null),
  };
};

export { isLoggedIn };
export default useAuth;
