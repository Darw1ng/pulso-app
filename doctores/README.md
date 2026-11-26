# Pulso · App para doctores (Android e iPhone)

La app es **el mismo Pulso web**, abierto dentro de una app nativa hecha con Capacitor 8. No
empaqueta el build del frontend: su WebView abre Pulso de producción (`server.url` en
`capacitor.config.ts`). Mismo molde que la app de Yo Controlo (`panel-one/movil`).

Es la app del **personal del consultorio** (doctor, asistente, administrador). La de pacientes es
otro proyecto (`../pacientes`, todavía sin empezar: hoy el paciente no tiene cuenta en Pulso).

## Cómo funciona

- **Entra por el login**, no por la portada: `https://pulso-sitirt.pages.dev/login`. Con sesión
  viva el login manda solo a Inicio. Para otro dominio: `PULSO_URL_PANEL=https://…` al armar.
- **Mismo origen que el navegador.** Las ligas que el front arma con `window.location.origin`
  (reserva en línea, invitaciones) salen igual que en la web, y cada despliegue del front llega
  a la app sin publicar versión nueva.
- **Enlaces.** Solo el host de Pulso navega dentro de la app. El PDF de una receta o de un
  estudio (URL firmada en otro dominio), Stripe, Google, `mailto:`, `tel:` y `wa.me` los abre el
  teléfono con su navegador o la app que toque.
- **Botón Atrás (Android).** Regresa en el historial de Pulso; en la raíz sale de la app
  (`NavegacionAtras.java`, probado con JUnit).
- **Sin internet.** Si Pulso no abre, se muestra `www/index.html`: "Sin conexión" y **Reintentar**.
- **Sin respaldo.** `allowBackup="false"` y `reglas_respaldo.xml`: la sesión no sale del teléfono.
- **El front sabe que está en la app.** El user agent termina en `PulsoApp/doctores`.

## Armar el APK de prueba

```bash
npm install
npm test                 # url-panel
npx cap sync android
cd android && gradlew.bat --no-daemon testDebugUnitTest assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

`android/local.properties` (no se versiona) debe apuntar al SDK:
`sdk.dir=C:/Users/<usuario>/AppData/Local/Android/Sdk` (con diagonales normales: con `\` Gradle
lee la ruta mal y falla con "la sintaxis de la etiqueta del volumen no es correcta").

Íconos y splash (Android e iOS): `npm run iconos` (Python + Pillow), solo cuando cambie la marca.

## Android de publicación (firmado)

```bash
cd android && gradlew.bat --no-daemon assembleRelease bundleRelease
# → app/build/outputs/apk/release/app-release.apk   (instalable)
# → app/build/outputs/bundle/release/app-release.aab (el que pide Play)
```

La llave de firma **no está en el repo**: `app/build.gradle` la lee de
`~/.sitirt/pulso-app/keystore.properties` (o de `PULSO_KEYSTORE_PROPERTIES`), que apunta a
`pulso-release.jks`. Sin ese archivo el release sale sin firmar. 🔑 **Respaldar esa carpeta**:
perder la llave es no poder actualizar la app ya instalada (en Play, con Play App Signing, se
puede pedir cambio de llave de subida). Para subir versión: `versionCode` y `versionName` en
`android/app/build.gradle`.

## iPhone (`ios/`) y TestFlight

El proyecto de iOS es el de Capacitor con lo mínimo propio (`VistaPanel.swift`: deslizar desde
el borde regresa en el historial). No se arma en Windows: lo firma y lo sube
`.github/workflows/ios-testflight.yml` en un runner de macOS, con cuatro secretos del repo
(`APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`). Antes de la primera subida tiene
que existir la app en App Store Connect con el identificador `mx.sitirt.pulso` (crear la app no
se puede por API). Subir: `gh workflow run ios-testflight.yml` (el número de build es el de la
corrida).

## Lo que falta antes de publicar

**Bloquea iPhone (y hoy también afecta a Safari en la web):**

- **Mismo dominio para el front y la API.** Hoy el front está en `pages.dev` y la API en
  `railway.app`: la cookie que renueva la sesión es de terceros. En Android se permite a mano
  (`MainActivity.java`); en iPhone el WebView la bloquea igual que Safari y la sesión dura 15
  minutos. Se arregla con dos registros de DNS propios de Pulso (por ejemplo `pulso.<dominio>` →
  Cloudflare Pages y `api.pulso.<dominio>` → Railway) más las variables que dependen del dominio
  (`VITE_API_BASE`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_BASE_URL`, hosts permitidos, URIs de
  Google). No requiere cambios de código.

**Del frontend de Pulso (carril front):**

- Dentro de la app, esconder el alta, la portada con precios y "Mejorar plan / contratar": una
  app de tienda no puede vender la suscripción por fuera de las compras de la tienda. La app
  queda como solo inicio de sesión.
- `viewport-fit=cover` + márgenes seguros arriba, campos a 16 px en táctil (iOS hace zoom con
  14 px) y un botón para la búsqueda global (hoy solo Ctrl/⌘+K).
- Imprimir (`window.print`: consentimientos, plan de seguridad, informes) y descargar los
  códigos de respaldo (`<a download>` de un blob) no funcionan en un WebView.

**Del backend (carril de Ricardo):**

- Borrado de cuenta desde la app (Apple lo exige si la app permite crear cuenta; si la app es
  solo inicio de sesión hay que confirmarlo con la guía vigente) y su política frente a la
  conservación de 5 años de la NOM-004.
- Cuenta demo para los revisores de las tiendas con el segundo factor resuelto.

**De este proyecto:**

- Proyecto de iPhone (`npx cap add ios`) y su armado sin Mac (CI con macOS o Codemagic).
- Llave de firma de release y AAB para Play; fichas, capturas, privacidad y formulario de datos.
- Algo nativo de verdad (notificaciones push de citas es lo natural): las tiendas rechazan apps
  que solo envuelven un sitio.
- Confirmar el identificador `mx.sitirt.pulso` y el nombre: quedan fijos al publicar.
