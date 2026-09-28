// ============================================================================
// panel/js/vistas/construccion.js — Pantallas de módulos futuros
// ============================================================================

const MODULOS = {
  stock: {
    icono: "📉", titulo: "Stock",
    texto: "Control de inventario con baja automática por venta, mínimos y alertas de reposición. Llega con el Bloque 3 (panel PC completo).",
  },
  caja: {
    icono: "💰", titulo: "Caja",
    texto: "Apertura y cierre de caja, movimientos y arqueo — unificado con las ventas de WhatsApp y del mostrador. Llega con el Bloque 3.",
  },
  cobros: {
    icono: "💳", titulo: "Cobros",
    texto: "Pagos de Mercado Pago confirmados solos y transferencias a verificar con un clic. Llega con el Bloque 2.",
  },
  clientes: {
    icono: "👥", titulo: "Clientes",
    texto: "La memoria del recepcionista: historial, preferencias y pedidos recurrentes de cada cliente. Llega con el Bloque 6.",
  },
  empleados: {
    icono: "🪪", titulo: "Empleados",
    texto: "Usuarios con rol de empleado para que el equipo use el sistema sin tocar la configuración. Llega con el Bloque 4.",
  },
};

export function renderConstruccion(nombre) {
  const m = MODULOS[nombre] || { icono: "🚧", titulo: nombre, texto: "Este módulo está en el mapa de construcción." };
  return `
    <h1>${m.titulo}</h1>
    <div class="subtitulo">Módulo del sistema</div>
    <div class="construccion">
      <div class="icono">${m.icono}</div>
      <div class="titulo">En construcción</div>
      <div class="texto">${m.texto}</div>
    </div>`;
}
