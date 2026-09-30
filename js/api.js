/**
 * =====================================================================
 * CLIENTE DE API OFICIAL - DinamicaMaxRF
 * Conexión directa a Google Apps Script / Google Drive / Google Sheets
 * =====================================================================
 */
window.RifaAPI = (function () {

  function getState() {
    var url = window.RIFA_CONFIG.API_URL + '?action=getState&_t=' + Date.now();
    return fetch(url, { cache: 'no-store' })
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

  function updateConfig(configPayload) {
    // Persistir siempre en localStorage de inmediato
    try {
      var local = JSON.parse(localStorage.getItem('maxrf_custom_config') || '{}');
      Object.assign(local, configPayload);
      localStorage.setItem('maxrf_custom_config', JSON.stringify(local));
    } catch (e) {}

    var url = window.RIFA_CONFIG.API_URL;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateConfig', config: configPayload })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (res) {
        if (res && res.success) {
          return { success: true, inSheets: true, message: res.message || 'Configuración guardada en Google Sheets' };
        } else {
          return {
            success: true,
            inSheets: false,
            message: (res && res.message) ? res.message : 'Apps Script no implementó updateConfig',
            needsDeploy: true
          };
        }
      })
      .catch(function (err) {
        console.warn('Aviso al conectar con Google Apps Script:', err);
        return {
          success: true,
          inSheets: false,
          message: 'Guardado en la web. No se pudo sincronizar con Google Drive: ' + err.message,
          needsDeploy: true
        };
      });
  }

  return {
    getState: getState,
    reservar: reservar,
    enviarCorreo: enviarCorreo,
    updateConfig: updateConfig
  };
})();
