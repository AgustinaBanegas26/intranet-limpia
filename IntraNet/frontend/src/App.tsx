import { useEffect, useState } from "react";
import { Routes, Route } from "react-router";
import { AuthenticatedRoutes } from "./routes";
import { AuthProvider, normalizeRole, type User } from "./context/AuthContext";
import {
  clearSession,
  getSession,
  setSession,
  type Session,
} from "./services/auth";
import { isJwtExpired } from "./utils/sessionToken";
import { LoginPage } from "./pages/auth/LoginPage";
import { ChangePasswordPage } from "./pages/auth/ChangePasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";

// Gestiona la operacion App.
function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session?.token && session.user) {
      if (isJwtExpired(session.token)) {
        clearSession();
        return;
      }
      setCurrentUser(session.user);
      setToken(session.token);
    }
  }, []);

  useEffect(() => {
    // Gestiona la accion correspondiente.
    const onPasswordRequired = () => {
      setCurrentUser((prev) =>
        prev ? { ...prev, mustChangePassword: true } : prev,
      );
    };
    // Gestiona la accion correspondiente.
    const onSessionInvalid = () => {
      clearSession();
      setCurrentUser(null);
      setToken(null);
    };
    // Gestiona la accion correspondiente.
    const onUserUpdated = (event: Event) => {
      const detail = (event as CustomEvent<User>).detail;
      if (!detail) return;
      setCurrentUser((prev) => (prev ? { ...prev, ...detail } : prev));
    };
    window.addEventListener(
      "portal:password-change-required",
      onPasswordRequired,
    );
    window.addEventListener("portal:session-invalid", onSessionInvalid);
    window.addEventListener("portal:user-updated", onUserUpdated);
    return () => {
      window.removeEventListener(
        "portal:password-change-required",
        onPasswordRequired,
      );
      window.removeEventListener("portal:session-invalid", onSessionInvalid);
      window.removeEventListener("portal:user-updated", onUserUpdated);
    };
  }, []);

  // Gestiona la accion correspondiente.
  const handleLogin = (session: Session) => {
    const withDefaults: User = {
      ...session.user,
      role: normalizeRole(session.user.role),
      mustChangePassword: session.user.mustChangePassword ?? false,
    };
    setSession({ token: session.token, user: withDefaults });
    setCurrentUser(withDefaults);
    setToken(session.token);
  };

  // Gestiona la accion correspondiente.
  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setToken(null);
  };

  // Gestiona la accion correspondiente.
  const handlePasswordChanged = (newToken?: string) => {
    if (!currentUser) return;
    const nextUser = { ...currentUser, mustChangePassword: false };
    const nextToken = newToken || token;
    setCurrentUser(nextUser);
    if (nextToken) {
      setToken(nextToken);
      setSession({ token: nextToken, user: nextUser });
    }
  };

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
      </Routes>
    );
  }

  return (
    <AuthProvider
      user={currentUser}
      token={token}
      onLogout={handleLogout}
      onPasswordChanged={handlePasswordChanged}
    >
      {currentUser.mustChangePassword ? (
        <ChangePasswordPage />
      ) : (
        <AuthenticatedRoutes />
      )}
    </AuthProvider>
  );
}

export default App;
