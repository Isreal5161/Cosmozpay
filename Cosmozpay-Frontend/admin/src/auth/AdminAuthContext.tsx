import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AdminLoginCredentials,
  AdminProfile,
  clearAdminSession,
  getCurrentAdmin,
  hasAdminSession,
  loginAdmin as requestAdminLogin,
  logoutAdmin as requestAdminLogout,
  refreshAdminSession as requestAdminRefresh,
  registerSessionInvalidationHandler,
  verifyAdminMfa as requestAdminMfa,
} from '../services/adminAuth';

interface AdminAuthContextValue {
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login(credentials: AdminLoginCredentials): Promise<boolean>;
  verifyMfa(otpCode: string): Promise<void>;
  logout(): Promise<void>;
  refreshSession(): Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [mfaReferenceId, setMfaReferenceId] = useState<string | null>(null);

  useEffect(() => {
    registerSessionInvalidationHandler(() => {
      setAdmin(null);
      setMfaReferenceId(null);
      setIsInitializing(false);
    });
    return () => registerSessionInvalidationHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!hasAdminSession()) {
      setIsInitializing(false);
      return () => {
        cancelled = true;
      };
    }

    void getCurrentAdmin()
      .then((profile) => {
        if (!cancelled) setAdmin(profile);
      })
      .catch(() => {
        clearAdminSession();
        if (!cancelled) setAdmin(null);
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: AdminLoginCredentials) => {
    setAdmin(null);
    setMfaReferenceId(null);
    const result = await requestAdminLogin(credentials);
    if (result.requiresMfa) {
      setMfaReferenceId(result.referenceId);
      return true;
    }

    try {
      const profile = await getCurrentAdmin();
      setAdmin(profile);
      return false;
    } catch (error) {
      clearAdminSession();
      setAdmin(null);
      throw error;
    }
  }, []);

  const verifyMfa = useCallback(async (otpCode: string) => {
    if (!mfaReferenceId) {
      throw new Error('The verification challenge has expired. Please sign in again.');
    }

    await requestAdminMfa(mfaReferenceId, otpCode);
    try {
      const profile = await getCurrentAdmin();
      setAdmin(profile);
      setMfaReferenceId(null);
    } catch (error) {
      clearAdminSession();
      setAdmin(null);
      setMfaReferenceId(null);
      throw error;
    }
  }, [mfaReferenceId]);

  const logout = useCallback(async () => {
    try {
      await requestAdminLogout();
    } catch {
      clearAdminSession();
    } finally {
      setAdmin(null);
      setMfaReferenceId(null);
      setIsInitializing(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      await requestAdminRefresh();
      const profile = await getCurrentAdmin();
      setAdmin(profile);
    } catch (error) {
      clearAdminSession();
      setAdmin(null);
      throw error;
    }
  }, []);

  const value = useMemo<AdminAuthContextValue>(() => ({
    admin,
    isAuthenticated: admin !== null,
    isInitializing,
    login,
    verifyMfa,
    logout,
    refreshSession,
  }), [admin, isInitializing, login, verifyMfa, logout, refreshSession]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider.');
  }
  return context;
}
