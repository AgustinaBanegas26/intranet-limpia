import type { User } from "../context/AuthContext";

type AuthUserLike = User & {
  nombreCompleto?: string;
  workMode?: string;
};

export type Session = {
  token: string;
  user: User;
};

const TOKEN_KEY = "gn_token";
const USER_KEY = "gn_user";
const LEGACY_USER_KEY = "currentUser";

export function getBackendUrl() {
  const envUrl = String(
    (import.meta as any).env?.VITE_BACKEND_URL || "",
  ).trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    return "http://localhost:4000";
  }

  if (import.meta.env.PROD) {
    return "/api";
  }

  return "http://localhost:4000";
}

function normalizeUser(user: AuthUserLike): User {
  const normalizedName = user.name || user.nombreCompleto || user.email || "";
  return {
    ...user,
    name: normalizedName,
  };
}

export function getSession(): Session | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    const rawUser = localStorage.getItem(USER_KEY);
    if (token && rawUser) {
      const parsed = JSON.parse(rawUser) as User;
      return { token, user: normalizeUser(parsed) };
    }
  } catch {}
  return null;
}

export function setSession(session: Session) {
  try {
    const normalized = { ...session, user: normalizeUser(session.user) };
    localStorage.setItem(TOKEN_KEY, normalized.token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized.user));
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {}
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {}
}

export function getLegacyUser(): User | null {
  try {
    const raw = localStorage.getItem(LEGACY_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<Session> {
  console.debug("[Auth] login payload", {
    email: input.email,
    passwordSet: Boolean(input.password),
  });

  const url = `${getBackendUrl()}/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });

  if (!res.ok) {
    let code = "login_failed";
    let message = "No se pudo iniciar sesión. Revisá el servidor.";

    try {
      const data = (await res.json()) as { error?: string; message?: string };
      if (data?.error) code = String(data.error);
      if (data?.message) message = String(data.message);
    } catch {
      // ignore
    }

    if (message.includes("Invalid login credentials")) {
      code = "invalid_credentials";
    }

    throw new Error(`${code}:${message}`);
  }

  const data = (await res.json()) as { token: string; user: AuthUserLike };
  if (!data?.token || !data?.user) {
    throw new Error(
      "login_failed:Respuesta inválida del servidor de autenticación",
    );
  }

  const user = {
    ...data.user,
    email: data.user.email || input.email,
    name:
      data.user.name ||
      data.user.nombreCompleto ||
      data.user.email ||
      input.email,
  };

  return {
    token: data.token,
    user,
  };
}

export type ChangePasswordResult = {
  token: string;
  mustChangePassword: false;
};

export async function changePassword(input: {
  password: string;
  currentPassword?: string;
}): Promise<ChangePasswordResult> {
  const session = getSession();
  if (!session?.token) {
    throw new Error("not_authenticated");
  }

  const url = `${getBackendUrl()}/auth/change-password`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({
      password: input.password,
      ...(input.currentPassword
        ? { currentPassword: input.currentPassword }
        : {}),
    }),
  });

  if (!res.ok) {
    let code = "failed_to_change_password";
    let message = "No se pudo cambiar la contraseña.";

    try {
      const data = (await res.json()) as { error?: string; message?: string };
      if (data?.error) code = String(data.error);
      if (data?.message) message = String(data.message);
    } catch {
      // ignore
    }

    throw new Error(`${code}:${message}`);
  }

  const data = (await res.json()) as { token?: string };
  const newToken = data?.token || session.token;

  return { token: newToken, mustChangePassword: false };
}
