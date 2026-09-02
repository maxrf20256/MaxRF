/**
 * =====================================================================
 * CLIENTE DE API
 * =====================================================================
 * Capa única que el resto del frontend usa para hablar con el backend.
 * Detecta automáticamente si hay una URL real de Google Apps Script
 * configurada en config.js; si no, usa el backend simulado (demo-backend.js).
 * =====================================================================
 */
window.RifaAPI = (function () {

  function getState() {
    if (window.RIFA_DEMO && window.RIFA_DEMO.esModoDemo()) {
      return Promise.resolve(window.RIFA_DEMO.getState());
    }
    var url = window.RIFA_CONFIG.API_URL + '?action=getState';
    return fetch(url)
      .then(function (r) { return r.json(); })
      .catch(function (err) {
        return { success: false, message: 'No se pudo conectar con el servidor: ' + err.message };
      });
  }

  function reservar(payload) {
    if (window.RIFA_DEMO && window.RIFA_DEMO.esModoDemo()) {
      return Promise.resolve(window.RIFA_DEMO.reservar(payload));
    }
    var url = window.RIFA_CONFIG.API_URL;
    return fetch(url, {
      method: 'POST',
      // Nota: Apps Script Web Apps no requieren cabeceras CORS especiales
      // cuando se envían como "text/plain" desde fetch; el propio script
      // parsea el JSON desde e.postData.contents.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: 'reservar' }, payload))
    })
      .then(function (r) { return r.json(); })
      .catch(function (err) {
        return { success: false, message: 'No se pudo conectar con el servidor: ' + err.message };
      });
  }

  return { getState: getState, reservar: reservar };
})();
