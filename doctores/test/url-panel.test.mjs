import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolverUrlPanel, rutaDeRespaldo, urlDeInicio } from '../url-panel.cjs';

test('sin PULSO_URL_PANEL usa el frontend de producción', () => {
  for (const vacio of [undefined, '', '   ']) {
    assert.equal(resolverUrlPanel(vacio), 'https://pulso-sitirt.pages.dev/');
  }
});

test('normaliza un dominio propio al origen con / final', () => {
  assert.equal(resolverUrlPanel('https://app.pulso.mx'), 'https://app.pulso.mx/');
  assert.equal(resolverUrlPanel(' https://App.Pulso.mx/ '), 'https://app.pulso.mx/');
});

test('rechaza lo que no debe armarse en una app', () => {
  for (const malo of [
    'http://app.pulso.mx', // cleartext apagado
    'app.pulso.mx',
    'https://usuario:clave@app.pulso.mx',
    'https://app.pulso.mx/?x=1',
    'https://app.pulso.mx/#x',
    'https://app.pulso.mx/inicio',
    'javascript:alert(1)',
  ]) {
    assert.throws(() => resolverUrlPanel(malo), /PULSO_URL_PANEL/, malo);
  }
});

test('la app entra por el login, no por la portada de venta', () => {
  assert.equal(urlDeInicio('https://pulso-sitirt.pages.dev/'), 'https://pulso-sitirt.pages.dev/login');
});

test('la pantalla de respaldo recibe el destino en ?panel=', () => {
  assert.equal(
    rutaDeRespaldo('https://pulso-sitirt.pages.dev/'),
    'index.html?panel=https%3A%2F%2Fpulso-sitirt.pages.dev%2Flogin',
  );
});

test('la pantalla de respaldo no carga nada externo y trae el mismo destino por defecto', () => {
  const html = readFileSync(new URL('../www/index.html', import.meta.url), 'utf8');
  assert.ok(!/<(script|link|img)[^>]+(src|href)=/i.test(html), 'todo debe ir en línea');
  assert.ok(html.includes(urlDeInicio(resolverUrlPanel(undefined))));
});
