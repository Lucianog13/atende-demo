// ============================================================================
// panel/js/vistas/configuracion.js — Datos del negocio
// ============================================================================
import { db, escapar } from "../api.js";

export async function renderConfiguracion(negocio) {
  return `
    <h1>Configuración</h1>
    <div class="subtitulo">Datos de tu negocio</div>
    <div class="panel" style="max-width:520px">
      <label style="display:block;font-size:13px;color:var(--muted);margin:14px 0 6px">Nombre</label>
      <input class="campo" id="cfg-nombre" type="text" value="${escapar(negocio.nombre)}" style="width:100%">
      <label style="display:block;font-size:13px;color:var(--muted);margin:14px 0 6px">Rubro</label>
      <input class="campo" id="cfg-rubro" type="text" value="${escapar(negocio.rubro || "")}" style="width:100%">
      <label style="display:block;font-size:13px;color:var(--muted);margin:14px 0 6px">WhatsApp del negocio</label>
      <input class="campo" id="cfg-numero" type="text" value="${escapar(negocio.numero_whatsapp)}" style="width:100%">
      <div class="acciones">
        <button class="btn" id="btn-guardar-cfg">Guardar</button>
      </div>
      <div class="error" id="cfg-error"></div>
      <div class="ok" id="cfg-ok"></div>
    </div>`;
}

export function conectarConfiguracion(negocio) {
  document.getElementById("btn-guardar-cfg").addEventListener("click", async () => {
    const err = document.getElementById("cfg-error");
    const ok = document.getElementById("cfg-ok");
    err.style.display = "none"; ok.style.display = "none";
    const nombre = document.getElementById("cfg-nombre").value.trim();
    const numero = document.getElementById("cfg-numero").value.trim().replace(/[^\d+]/g, "");
    if (!nombre) { err.textContent = "El nombre no puede quedar vacío."; err.style.display = "block"; return; }
    if (!/^54\d{10,12}$/.test(numero)) {
      err.textContent = "Número en formato E.164 argentino (54 + 10 dígitos).";
      err.style.display = "block";
      return;
    }
    const { error } = await db.from("negocios")
      .update({ nombre, rubro: document.getElementById("cfg-rubro").value.trim() || null, numero_whatsapp: numero })
      .eq("id", negocio.id);
    if (error) { err.textContent = error.message; err.style.display = "block"; return; }
    ok.textContent = "Guardado. ✅";
    ok.style.display = "block";
    setTimeout(() => location.reload(), 900);
  });
}
