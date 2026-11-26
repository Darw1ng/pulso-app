'use strict';

// La URL de Pulso que abre la app. Vive aparte (CommonJS sin dependencias) para que la use
// capacitor.config.ts al armar y la pruebe `node --test` sin compilar nada.
//
// Por defecto es el frontend de producción en Cloudflare Pages. Con dominio propio se arma con
// PULSO_URL_PANEL=https://app.ejemplo.mx

const URL_PANEL_POR_DEFECTO = 'https://pulso-sitirt.pages.dev';

// La app entra por el LOGIN, no por la portada: la portada es la página de venta (planes y
// precios) y eso no debe ser lo primero que ve una app de tienda. Con sesión viva, /login manda
// solo a /inicio.
const RUTA_DE_INICIO = '/login';

/**
 * Normaliza y valida el origen de Pulso: solo https, sin usuario/contraseña, sin query ni
 * fragmento y sin ruta. Lanza si no sirve: un APK que apunta a http o a una URL mal escrita no
 * debe armarse.
 *
 * @param {string | undefined} valor lo que traiga PULSO_URL_PANEL (vacío o undefined = producción)
 * @returns {string} el origen con `/` final, p. ej. "https://pulso-sitirt.pages.dev/"
 */
function resolverUrlPanel(valor) {
  const crudo = (valor ?? '').trim() || URL_PANEL_POR_DEFECTO;
  let url;
  try {
    url = new URL(crudo);
  } catch {
    throw new Error(`PULSO_URL_PANEL no es una URL válida: "${crudo}"`);
  }
  if (url.protocol !== 'https:') {
    throw new Error(`PULSO_URL_PANEL debe ser https (cleartext está apagado): "${crudo}"`);
  }
  if (url.username || url.password) {
    throw new Error('PULSO_URL_PANEL no puede llevar usuario ni contraseña');
  }
  if (url.search || url.hash) {
    throw new Error(`PULSO_URL_PANEL no puede llevar query ni fragmento: "${crudo}"`);
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new Error(`PULSO_URL_PANEL debe ser el origen de Pulso, sin ruta: "${crudo}"`);
  }
  return `${url.origin}/`;
}

/** La página que abre la app al arrancar: el login de ese origen. */
function urlDeInicio(urlPanel) {
  return new URL(RUTA_DE_INICIO, urlPanel).href;
}

/**
 * La página de respaldo (www/index.html) que Capacitor muestra cuando la carga de Pulso falla.
 * Recibe el destino en `?panel=` para que "Reintentar" sepa a dónde volver sin generar nada al armar.
 */
function rutaDeRespaldo(urlPanel) {
  return `index.html?panel=${encodeURIComponent(urlDeInicio(urlPanel))}`;
}

module.exports = { URL_PANEL_POR_DEFECTO, RUTA_DE_INICIO, resolverUrlPanel, urlDeInicio, rutaDeRespaldo };
