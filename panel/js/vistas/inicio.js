// ============================================================================
// panel/js/vistas/inicio.js — Resumen del negocio (números reales)
// ============================================================================
import { db, formatoPesos, formatoFecha, escapar } from "../api.js";

export async function renderInicio(negocio) {
  const hoy = new Date().toISOString().slice(0, 10);

  const [nProductos, pedidos, ventasHoy] = await Promise.all([
    db.from("productos").select("id", { count: "exact", head: true })
      .eq("negocio_id", negocio.id).eq("activo", true),
    db.from("pedidos").select("id,estado,total,items,creado_en")
      .eq("negocio_id", negocio.id).order("creado_en", { ascending: false }).limit(6),
    db.from("pedidos").select("total,estado")
      .eq("negocio_id", negocio.id).gte("creado_en", hoy),
  ]);

  const lista = pedidos.data || [];
  const pedidosHoy = (ventasHoy.data || []).filter(p => p.estado !== "cancelado");
  const montoHoy = pedidosHoy.reduce((s, p) => s + Number(p.total || 0), 0);

  return `
    <h1>Inicio</h1>
    <div class="subtitulo">Resumen de hoy para ${escapar(negocio.nombre)}</div>

    <div class="grid-tarjetas">
      <div class="tarjeta">
        <div class="k-titulo">Productos activos</div>
        <div class="k-valor">${nProductos.count ?? 0}</div>
        <div class="k-nota">en el catálogo</div>
      </div>
      <div class="tarjeta">
        <div class="k-titulo">Pedidos de hoy</div>
        <div class="k-valor">${pedidosHoy.length}</div>
        <div class="k-nota">por WhatsApp</div>
      </div>
      <div class="tarjeta">
        <div class="k-titulo">Ventas de hoy</div>
        <div class="k-valor moneda">$${formatoPesos(montoHoy)}</div>
        <div class="k-nota">sin cancelados</div>
      </div>
      <div class="tarjeta">
        <div class="k-titulo">Bot</div>
        <div class="k-valor">${negocio.activo ? "● Activo" : "○ Pausado"}</div>
        <div class="k-nota">${escapar(negocio.numero_whatsapp)}</div>
      </div>
    </div>

    <div class="panel">
      <h2>Últimos pedidos</h2>
      ${lista.length === 0 ? '<div class="vacio">Todavía no hay pedidos. Cuando un cliente encargue por WhatsApp, aparece acá.</div>' : `
      <table>
        <tr><th>Fecha</th><th>Items</th><th>Total</th><th>Estado</th></tr>
        ${lista.map(p => `
          <tr>
            <td class="mono">${formatoFecha(p.creado_en)}</td>
            <td>${escapar(resumirItems(p.items))}</td>
            <td class="mono">$${formatoPesos(p.total)}</td>
            <td><span class="est-${p.estado}">${p.estado}</span></td>
          </tr>`).join("")}
      </table>`}
    </div>`;
}

function resumirItems(items) {
  const arr = Array.isArray(items) ? items : [];
  if (arr.length === 0) return "—";
  const texto = arr.map(i => `${i.nombre} ×${i.cantidad}`).join(", ");
  return texto.length > 60 ? texto.slice(0, 57) + "…" : texto;
}
