import { getBackendUrl, getSession } from "./auth";

export type ProfileData = {
  nombreCompleto?: string;
  fechaNac?: string;
  tel?: string;
  celPersonal?: string;
  emailEmpresa?: string;
  emailPersonal?: string;
  estadoCivil?: string;
  domicilio?: string;
  documento?: string;
  hijos?: string;
  cuil?: string;
  sector?: string;
  sucursal?: string;
  legajo?: string | null;
  fechaIngreso?: string | null;
  foto?: string | null;
};

export type ProfileUpdatePayload = Pick<
  ProfileData,
  | "nombreCompleto"
  | "tel"
  | "celPersonal"
  | "emailEmpresa"
  | "emailPersonal"
  | "estadoCivil"
  | "domicilio"
  | "hijos"
  | "fechaNac"
  | "documento"
  | "cuil"
  | "sector"
  | "sucursal"
  | "legajo"
  | "fechaIngreso"
  | "foto"
>;

// Procesa los elementos de la coleccion.
export function mapProfileToApi(data: ProfileData): ProfileUpdatePayload {
  const payload: ProfileUpdatePayload = {};

  if (data.nombreCompleto !== undefined)
    payload.nombreCompleto = data.nombreCompleto;
  if (data.tel !== undefined) payload.tel = data.tel;
  if (data.celPersonal !== undefined) payload.celPersonal = data.celPersonal;
  if (data.emailEmpresa !== undefined) payload.emailEmpresa = data.emailEmpresa;
  if (data.emailPersonal !== undefined)
    payload.emailPersonal = data.emailPersonal;
  if (data.estadoCivil !== undefined) payload.estadoCivil = data.estadoCivil;
  if (data.domicilio !== undefined) payload.domicilio = data.domicilio;
  if (data.hijos !== undefined) payload.hijos = data.hijos;
  if (data.fechaNac !== undefined) payload.fechaNac = data.fechaNac;
  if (data.documento !== undefined) payload.documento = data.documento;
  if (data.cuil !== undefined) payload.cuil = data.cuil;
  if (data.sector !== undefined) payload.sector = data.sector;
  if (data.sucursal !== undefined) payload.sucursal = data.sucursal;
  if (data.legajo !== undefined) payload.legajo = data.legajo;
  if (data.fechaIngreso !== undefined) payload.fechaIngreso = data.fechaIngreso;
  if (data.foto !== undefined) payload.foto = data.foto;

  return payload;
}

// Obtiene los datos necesarios.
export async function getProfile(token: string): Promise<ProfileData> {
  const url = `${getBackendUrl()}/profile`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let code = "profile_fetch_failed";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) code = data.error;
    } catch {
      // ignore
    }
    if (code === "password_change_required") {
      window.dispatchEvent(new CustomEvent("portal:password-change-required"));
    }
    throw new Error(code);
  }
  return res.json() as Promise<ProfileData>;
}

// Actualiza los datos correspondientes.
export async function updateProfile(
  token: string,
  data: ProfileData,
): Promise<ProfileData> {
  const url = `${getBackendUrl()}/profile`;
  const body = mapProfileToApi(data);
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let code = "profile_update_failed";
    let message: string | undefined;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body?.error) code = body.error;
      if (body?.message) message = body.message;
    } catch {
      // ignore
    }
    const err = new Error(code);
    if (message)
      (err as Error & { userMessage?: string }).userMessage = message;
    throw err;
  }
  return res.json() as Promise<ProfileData>;
}

// Gestiona la operacion requireToken.
export function requireToken(): string {
  const session = getSession();
  if (!session?.token) throw new Error("not_authenticated");
  return session.token;
}
