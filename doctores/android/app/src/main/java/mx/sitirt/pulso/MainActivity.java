package mx.sitirt.pulso;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/**
 * La app es un WebView (Capacitor) sobre Pulso de producción; ver capacitor.config.ts.
 *
 * <p>Lo nativo propio son dos cosas:
 *
 * <ul>
 *   <li>El botón Atrás: sin esto Android cerraría la app al primer Atrás. Regresa en el historial
 *       de Pulso y en la raíz sale (ver {@link NavegacionAtras}).</li>
 *   <li>La cookie de la sesión: el front (pages.dev) y la API (railway.app) viven hoy en sitios
 *       distintos, así que la cookie HttpOnly que renueva la sesión es "de terceros" y el WebView
 *       de Android las rechaza por defecto. Sin permitirlas, la sesión duraría los 15 minutos del
 *       access y se perdería al reabrir la app. Cuando el front y la API compartan dominio esto
 *       deja de hacer falta (y no estorba).</li>
 * </ul>
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView vista = bridge != null ? bridge.getWebView() : null;
        if (vista != null) {
            CookieManager cookies = CookieManager.getInstance();
            cookies.setAcceptCookie(true);
            cookies.setAcceptThirdPartyCookies(vista, true);
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = bridge != null ? bridge.getWebView() : null;
                NavegacionAtras.Accion accion = webView == null
                    ? NavegacionAtras.Accion.SALIR
                    : NavegacionAtras.decidir(webView.canGoBack(), webView.getUrl(), bridge.getErrorUrl());
                if (accion == NavegacionAtras.Accion.ATRAS_EN_EL_PANEL) {
                    webView.goBack();
                    return;
                }
                // En la raíz: lo que Android haga por defecto (salir / mandar al fondo).
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });
    }

    @Override
    public void onPause() {
        super.onPause();
        // Las cookies del WebView se escriben a disco con retraso: se fuerza al salir de la app
        // para que la sesión sobreviva si Android la mata en segundo plano.
        CookieManager.getInstance().flush();
    }
}
