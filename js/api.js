/**
 * =====================================================================
 * CLIENTE DE API OFICIAL - DinamicaMaxRF
 * Conexión directa a Google Apps Script / Google Drive / Google Sheets
 * =====================================================================
 */
window.RifaAPI = (function () {

  function getState() {
    var url = window.RIFA_CONFIG.API_URL + '?action=getState';
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function (err) {
        console.error('Error al consultar estado en Google Apps Script:', err);
        return { success: false, message: 'No se pudo conectar con el servidor: ' + err.message };
      });
  }

  function reservar(payload) {
    var url = window.RIFA_CONFIG.API_URL;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: 'reservar' }, payload))
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function (err) {
        console.error('Error al procesar reserva en Google Apps Script:', err);
        return { success: false, message: 'Error de conexión con el servidor: ' + err.message };
      });
  }

  function enviarCorreo(payload) {
    var url = window.RIFA_CONFIG.API_URL;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: 'enviarCorreo' }, payload))
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function (err) {
        console.warn('Aviso al enviar correo:', err);
        return { success: true, message: 'Solicitud procesada.' };
      });
  }

  return {
    getState: getState,
    reservar: reservar,
    enviarCorreo: enviarCorreo
  };
})();
