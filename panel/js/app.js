// ============================================================================
// panel/js/app.js — Shell del sistema: auth, navegación y vistas
// ============================================================================
import { db, sesion, miNegocio, escapar } from "./api.js";
import { renderInicio } from "./vistas/inicio.js";
import { renderCatalogo, conectarCatalogo } from "./vistas/catalogo.js";
import { renderPedidos, conectarPedidos } from "./vistas/pedidos.js";
import { renderConfiguracion, conectarConfiguracion } from "./vistas/configuracion.js";
import { renderConstruccion } from "./vistas/construccion.js";

const $ = (id) => document.getElementById(id);
let negocio = null;

// ---------------- auth ----------------

async function login() {
  const err = $("login-error");
  err.style.display = "none";
  const email = $("login-email").value.trim();
  const password = $("login-password").value;
  if (!email || !password) { err.textContent = "Completá email y contraseña."; err.style.display = "block"; return; }
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) { err.textContent = error.message; err.style.display = "block"; return; }
  await arrancar();
}

async function altaNegocio() {
  const err = $("alta-error");
  const ok = $("alta-ok");
  err.style.display = "none"; ok.style.display = "none";
  const nombre = $("alta-nombre").value.trim();
  const rubro = $("alta-rubro").value.trim();
  const numero = $("alta-numero").value.trim().replace(/[^\d+]/g, "");
  if (!nombre) { err.textContent = "El nombre es obligatorio."; err.style.display = "block"; return; }
  if (!/^54\d{10,12}$/.test(numero)) {
    err.textContent = "Número en formato E.164 argentino, ej. 543434065289 (54 + 10 dígitos).";
    err.style.display = "block";
    return;
  }
  const { data: { user } } = await db.auth.getUser();
  const slug = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) +
    "-" + Math.random().toString(36).slice(2, 6);
  const { data, error } = await db.from("negocios")
    .insert({ slug, nombre, rubro: rubro || null, tipo: "mixto", numero_whatsapp: numero, dueno_user_id: user.id, plan: "piloto" })
    .select().single();
  if (error) { err.textContent = error.message; err.style.display = "block"; return; }
  ok.textContent = `Negocio "${data.nombre}" creado. Ya sos el dueño.`;
  ok.style.display = "block";
  setTimeout(arrancar, 1300);
}

async function salir() {
  await db.auth.signOut();
  negocio = null;
  location.hash = "";
  location.reload();
}

// ---------------- shell ----------------

async function arrancar() {
  const s = await sesion();
  if (!s) {
    $("sistema").classList.add("oculto");
    $("pantalla-alta").classList.add("oculto");
    $("pantalla-login").classList.remove("oculto");
    return;
  }
  negocio = await miNegocio();
  if (!negocio) {
    $("sistema").classList.add("oculto");
    $("pantalla-login").classList.add("oculto");
    $("pantalla-alta").classList.remove("oculto");
    return;
  }

  $("pantalla-login").classList.add("oculto");
  $("pantalla-alta").classList.add("oculto");
  $("sistema").classList.remove("oculto");

  $("tb-negocio").textContent = negocio.nombre;
  $("tb-sub").textContent = `${negocio.rubro || "comercio"} · plan ${negocio.plan}`;
  $("tb-bot").textContent = negocio.activo ? "● Bot activo" : "○ Bot pausado";
  $("tb-bot").className = "pill" + (negocio.activo ? "" : " ambar");
  $("tb-usuario").textContent = s.user.email;

  navegar(location.hash.replace(/^#\//, "") || "inicio");
}

async function navegar(vista) {
  const cont = $("vista");
  document.querySelectorAll(".menu a").forEach(a =>
    a.classList.toggle("activo", a.dataset.vista === vista));

  if (vista === "inicio") cont.innerHTML = await renderInicio(negocio);
  else if (vista === "catalogo") {
    cont.innerHTML = await renderCatalogo(negocio);
    conectarCatalogo(negocio);
  } else if (vista === "pedidos") {
    cont.innerHTML = await renderPedidos(negocio);
    conectarPedidos();
  } else if (vista === "configuracion") {
    cont.innerHTML = await renderConfiguracion(negocio);
    conectarConfiguracion(negocio);
  } else if (["stock", "caja", "cobros", "clientes", "empleados"].includes(vista)) {
    cont.innerHTML = renderConstruccion(vista);
  } else {
    cont.innerHTML = renderConstruccion("desconocido");
  }
  window.scrollTo(0, 0);
}

// ---------------- eventos ----------------

$("btn-login").addEventListener("click", login);
$("login-password").addEventListener("keydown", (e) => { if (e.key === "Enter") login(); });
$("btn-alta").addEventListener("click", altaNegocio);
$("btn-alta-salir").addEventListener("click", async () => { await db.auth.signOut(); location.reload(); });
$("btn-salir").addEventListener("click", salir);
window.addEventListener("hashchange", () => {
  if (negocio) navegar(location.hash.replace(/^#\//, "") || "inicio");
});

arrancar();
