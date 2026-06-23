import { useQuery } from "@tanstack/react-query";

interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

async function fetchAuthUser(): Promise<{ user: AuthUser | null }> {
  const res = await fetch("/api/auth/user");
  if (!res.ok) return { user: null };
  return res.json() as Promise<{ user: AuthUser | null }>;
}

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchAuthUser,
    retry: false,
    staleTime: 60_000,
  });

  return {
    user: data?.user ?? null,
    isAuthenticated: !!data?.user,
    isLoading,
    login: () => {
      window.location.href = "/api/login";
    },
    logout: () => {
      window.location.href = "/api/logout";
    },
  };
}
