import { useAuthStore } from "../store/authStore";

// Convenience hook exposing the auth store plus a couple of derived flags.
export function useAuth() {
  const store = useAuthStore();
  return {
    ...store,
    isAuthenticated: Boolean(store.user),
    isAdmin: store.user?.role === "admin",
  };
}

export default useAuth;
