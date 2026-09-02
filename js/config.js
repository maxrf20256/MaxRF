/**
 * =====================================================================
 * CONFIGURACIÓN DEL SITIO
 * =====================================================================
 * Pega aquí la URL de tu Web App de Google Apps Script (la que obtienes
 * al hacer "Implementar > Nueva implementación > Aplicación web").
 * Debe terminar en "/exec".
 *
 * Mientras la dejes vacía o con el valor de ejemplo, el sitio funciona
 * en MODO DEMO: usa datos falsos guardados en tu navegador (localStorage)
 * para que puedas probar visualmente todo el flujo sin backend real.
 * =====================================================================
 */
window.RIFA_CONFIG = {
  // 👉 Reemplaza esta URL por la de tu Google Apps Script Web App
  API_URL: 'https://script.google.com/macros/s/AKfycbx6IN8BHD0CrvsEuEVG5618xUTGLiJ7M5xSTPFUWyqB5U0QXqeyitCKcceksqQH-DIr/exec',

  // Nombre que se muestra si el modo demo está activo (sin backend real)
  DEMO_MODE_LABEL: 'MODO DEMO — conecta tu Google Sheet para producción'
};
