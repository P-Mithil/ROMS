import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, LoginRequest, RoleName } from "@roms/shared";
import { ApiClientError, setAccessToken } from "../../lib/api-client.js";
import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
} from "./auth-api.js";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  login: (input: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: RoleName[]) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((token: string, nextUser: AuthUser) => {
    setAccessToken(token);
    setAccessTokenState(token);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const refreshed = await refreshRequest();
        if (cancelled) {
          return;
        }

        setAccessToken(refreshed.accessToken);
        setAccessTokenState(refreshed.accessToken);

        const me = await meRequest();
        if (!cancelled) {
          setUser(me);
        }
      } catch (error) {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(
    async (input: LoginRequest) => {
      const result = await loginRequest(input);
      applySession(result.accessToken, result.user);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      if (!(error instanceof ApiClientError) || error.status !== 401) {
        throw error;
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const hasRole = useCallback(
    (...roles: RoleName[]) => {
      if (!user) {
        return false;
      }
      return roles.includes(user.role);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      login,
      logout,
      hasRole,
    }),
    [user, accessToken, isLoading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
