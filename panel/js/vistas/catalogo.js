// ============================================================================
// panel/js/vistas/catalogo.js — Productos activos + ingesta PDF pendiente
// ============================================================================
import { db, formatoPesos, escapar } from "../api.js";

export async function renderCatalogo(negocio) {
  const [activos, borradores] = await Promise.all([
    db.from("productos").select("*").eq("negocio_id", negocio.id).order("nombre"),
    db.from("productos_borrador").select("*").eq("negocio_id", negocio.id).order("creado_en"),
  ]);

  const lista = activos.data || [];
  const pendientes = borradores.data || [];

  return `
    <h1>Catálogo</h1>
    <div class="subtitulo">${lista.length} productos activos · el bot responde precios solo de esta lista</div>

    <div class="panel">
      <h2>Productos</h2>
      ${lista.length === 0 ? '<div class="vacio">Catálogo vacío. Cargá un PDF abajo o agregá productos a mano.</div>' : `
      <table>
        <tr><th>Producto</th><th>Categoría</th><th>Precio</th><th></th></tr>
        ${lista.map(p => `
          <tr>
            <td>${escapar(p.nombre)}</td>
            <td>${escapar(p.categoria || "—")}</td>
            <td class="mono" id="precio-txt-${p.id}">$${formatoPesos(p.precio)}</td>
            <td>
              <button class="btn chico sec" data-edit="${p.id}">Editar precio</button>
              <button class="btn chico peligro" data-off="${p.id}">Desactivar</button>
            </td>
          </tr>`).join("")}
      </table>`}
    </div>

    <div class="panel">
      <h2>Ingesta de PDF</h2>
      <div class="subtitulo">Mandame tu catálogo en PDF y lo cargo como pendiente; acá lo validás antes de publicarlo.</div>
      ${pendientes.length === 0
        ? '<div class="vacio">No hay productos pendientes de validación. 📄</div>'
        : `
        <div id="lista-borradores">
          ${pendientes.map((b, i) => `
            <div class="fila-check">
              <input type="checkbox" id="chk-${i}" checked>
              <div class="f-nombre">${escapar(b.nombre)}${b.categoria ? ` <span style="color:var(--muted);font-size:12px">· ${escapar(b.categoria)}</span>` : ""}</div>
              <input type="text" class="precio" id="precio-${i}" value="${formatoPesos(b.precio)}">
            </div>`).join("")}
        </div>
        <div class="acciones">
          <button class="btn" id="btn-aprobar">Aprobar seleccionados ✓</button>
          <button class="btn peligro" id="btn-borrar">Borrar seleccionados ✕</button>
        </div>
        <div class="error" id="borr-error"></div>
        <div class="ok" id="borr-ok"></div>`}
    </div>`;
}

/** Conecta los botones de la vista catálogo (editar/desactivar/validar). */
export function conectarCatalogo(negocio) {
  // editar precio inline
  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.edit;
      const celda = document.getElementById(`precio-txt-${id}`);
      const actual = celda.dataset.precio ?? celda.textContent.replace(/[^\d.,]/g, "");
      const nuevo = prompt("Nuevo precio (en pesos):", actual);
      if (nuevo === null) return;
      const precio = parsearPrecio(nuevo);
      if (isNaN(precio) || precio <= 0) { alert("Precio inválido."); return; }
      const { error } = await db.from("productos").update({ precio }).eq("id", id);
      if (error) { alert("No se pudo guardar: " + error.message); return; }
      celda.textContent = "$" + formatoPesos(precio);
    });
  });

  // desactivar
  document.querySelectorAll("[data-off]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.off;
      if (!confirm("¿Desactivar este producto? Deja de aparecer en el bot.")) return;
      const { error } = await db.from("productos").update({ activo: false }).eq("id", id);
      if (error) { alert("No se pudo desactivar: " + error.message); return; }
      location.reload();
    });
  });

  // validar borradores
  const btnAprobar = document.getElementById("btn-aprobar");
  const btnBorrar = document.getElementById("btn-borrar");
  if (!btnAprobar) return;

  const seleccion = () =>
    Array.from(document.querySelectorAll("#lista-borradores input[type=checkbox]"))
      .filter(c => c.checked)
      .map(c => Number(c.id.replace("chk-", "")));

  btnAprobar.addEventListener("click", async () => {
    const err = document.getElementById("borr-error");
    const ok = document.getElementById("borr-ok");
    err.style.display = "none"; ok.style.display = "none";
    const { data: pendientes } = await db.from("productos_borrador").select("*").eq("negocio_id", negocio.id).order("creado_en");
    const sel = seleccion();
    const aInsertar = [];
    for (const i of sel) {
      const b = pendientes[i];
      if (!b) continue;
      const precio = parsearPrecio(document.getElementById(`precio-${i}`).value);
      if (isNaN(precio) || precio <= 0) {
        err.textContent = `El precio de "${b.nombre}" no es válido.`;
        err.style.display = "block";
        return;
      }
      aInsertar.push({ negocio_id: b.negocio_id, nombre: b.nombre, descripcion: b.descripcion, categoria: b.categoria, precio });
    }
    if (aInsertar.length === 0) { err.textContent = "Marcá al menos un producto."; err.style.display = "block"; return; }
    const { error: e1 } = await db.from("productos").insert(aInsertar);
    if (e1) { err.textContent = "Error al aprobar: " + e1.message; err.style.display = "block"; return; }
    const ids = sel.map(i => pendientes[i]?.id).filter(Boolean);
    await db.from("productos_borrador").delete().in("id", ids);
    ok.textContent = `${aInsertar.length} productos publicados al catálogo. 🎉`;
    ok.style.display = "block";
    setTimeout(() => location.reload(), 1200);
  });

  btnBorrar.addEventListener("click", async () => {
    const { data: pendientes } = await db.from("productos_borrador").select("*").eq("negocio_id", negocio.id).order("creado_en");
    const ids = seleccion().map(i => pendientes[i]?.id).filter(Boolean);
    if (ids.length === 0) { alert("Marcá al menos un producto."); return; }
    await db.from("productos_borrador").delete().in("id", ids);
    location.reload();
  });
}

function parsearPrecio(s) {
  let t = String(s).trim().replace(/\$/g, "").replace(/\s/g, "");
  if (!/^[\d.,]+$/.test(t) || t === "") return NaN;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(/\./g, "");
  return Number(t);
}
