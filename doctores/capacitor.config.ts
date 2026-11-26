import type { CapacitorConfig } from '@capacitor/cli';
import { resolverUrlPanel, rutaDeRespaldo, urlDeInicio } from './url-panel.cjs';

// La app NO empaqueta el build del frontend: abre Pulso de producción en su WebView (mismo molde
// que la app de Yo Controlo). Así el front queda en el MISMO origen que en el navegador: las ligas
// que arma con `window.location.origin` (reserva en línea, invitaciones) salen bien, no hay que
// tocar CORS, y cada despliegue del front llega a la app sin publicar una versión nueva.
//
// www/ solo trae la pantalla de respaldo "Sin conexión" (server.errorPath).
//
// 🚨 PENDIENTE QUE NO ES DE ESTE PROYECTO: hoy el front (pages.dev) y la API (railway.app) viven
// en sitios distintos, así que la cookie que renueva la sesión es de terceros. En Android se
// permite a mano (MainActivity). En iPhone el WebView la bloquea igual que Safari: hasta que el
// front y la API compartan dominio (p. ej. pulso.<dominio> y api.pulso.<dominio>), la sesión en
// iPhone dura 15 minutos. Ver README.
const urlPanel = resolverUrlPanel(process.env.PULSO_URL_PANEL);
const hostPanel = new URL(urlPanel).host;

const config: CapacitorConfig = {
  // PROVISIONAL: el identificador queda fijo para siempre al publicar en las tiendas. Confirmar
  // con Erick antes de la primera subida.
  appId: 'mx.sitirt.pulso',
  appName: 'Pulso',
  webDir: 'www',
  // Turquesa de la marca detrás del WebView: es lo que se ve mientras carga, en vez de un
  // destello blanco.
  backgroundColor: '#0E9498',
  // El front puede saber que corre dentro de la app (para esconder el alta y los planes, que en
  // una app de tienda no deben ofrecerse) leyendo esto del user agent.
  appendUserAgent: 'PulsoApp/doctores',
  server: {
    url: urlDeInicio(urlPanel),
    // Solo el host de Pulso navega DENTRO de la app. Lo demás (el PDF de una receta o un estudio
    // en su URL firmada, Stripe, Google, mailto:, tel:, wa.me) lo abre el teléfono con su
    // navegador o la app que corresponda.
    allowNavigation: [hostPanel],
    androidScheme: 'https',
    cleartext: false,
    errorPath: rutaDeRespaldo(urlPanel),
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'never',
    allowsLinkPreview: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    // SystemBars viene en @capacitor/android 8. `native` respeta el viewport del front (que hoy
    // no trae viewport-fit=cover): el WebView queda debajo de la barra de estado. LIGHT = íconos
    // oscuros, porque la barra superior de Pulso es clara.
    SystemBars: {
      insetsHandling: 'native',
      style: 'LIGHT',
    },
  },
};

export default config;
