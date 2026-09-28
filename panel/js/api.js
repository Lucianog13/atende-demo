// ============================================================================
// panel/js/api.js — Acceso a Supabase (único lugar que toca la base)
// ============================================================================
import { SUPABASE_URL, SUPABASE_ANON } from "./config.js";

export const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/** Sesión actual o null. */
export async function sesion() {
  const { data } = await db.auth.getSession();
  return data.session || null;
}

/** Negocio del usuario logueado (RLS garantiza que es el suyo). */
export async function miNegocio() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db
    .from("negocios").select("*").eq("dueno_user_id", user.id).maybeSingle();
  return data || null;
}

/** Formatea un monto en pesos argentinos. */
export function formatoPesos(n) {
  return Number(n || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  });
}

/** Fecha corta es-AR (28/9, 20:15). */
export function formatoFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) +
    " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

/** Escapa texto para meter en HTML. */
export function escapar(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
