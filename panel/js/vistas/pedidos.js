// ============================================================================
// panel/js/vistas/pedidos.js — Pedidos del negocio + cambio de estado
// ============================================================================
import { db, formatoPesos, formatoFecha, escapar } from "../api.js";

export async function renderPedidos(negocio) {
  const { data } = await db
    .from("pedidos").select("*").eq("negocio_id", negocio.id)
    .order("creado_en", { ascending: false }).limit(60);
  const pedidos = data || [];

  return `
    <h1>Pedidos</h1>
    <div class="subtitulo">Los que entran por WhatsApp, acá. Cambiá el estado a medida que los preparás.</div>
    <div class="panel">
      ${pedidos.length === 0 ? '<div class="vacio">Todavía no hay pedidos.</div>' : `
      <table>
        <tr><th>Fecha</th><th>Cliente</th><th>Items</th><th>Total</th><th>Pago</th><th>Estado</th></tr>
        ${pedidos.map(p => `
          <tr>
            <td class="mono">${formatoFecha(p.creado_en)}</td>
            <td>${escapar(p.cliente_nombre || p.cliente_telefono || "—")}</td>
            <td>${escapar(resumirItems(p.items))}</td>
            <td class="mono">$${formatoPesos(p.total)}</td>
            <td>${escapar(p.metodo_pago || "—")}</td>
            <td>
              <select class="estado" data-pedido="${p.id}">
                ${["pendiente", "confirmado", "pagado", "entregado", "cancelado"]
                  .map(e => `<option value="${e}" ${e === p.estado ? "selected" : ""}>${e}</option>`).join("")}
              </select>
            </td>
          </tr>`).join("")}
      </table>`}
    </div>`;
}

export function conectarPedidos() {
  document.querySelectorAll("select[data-pedido]").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const { error } = await db.from("pedidos").update({ estado: sel.value }).eq("id", sel.dataset.pedido);
      if (error) {
        alert("No se pudo actualizar: " + error.message);
        location.reload();
      }
    });
  });
}

function resumirItems(items) {
  const arr = Array.isArray(items) ? items : [];
  if (arr.length === 0) return "—";
  const texto = arr.map(i => `${i.nombre} ×${i.cantidad}`).join(", ");
  return texto.length > 70 ? texto.slice(0, 67) + "…" : texto;
}
