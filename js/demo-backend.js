/**
 * =====================================================================
 * BACKEND SIMULADO (MODO DEMO)
 * =====================================================================
 * Si config.js todavía tiene la URL de ejemplo (o está vacía), el sitio
 * usa este módulo para simular las respuestas del Google Apps Script,
 * guardando todo en localStorage del navegador. Así puedes ver y probar
 * el talonario, las reservas y el formulario ANTES de conectar tu
 * Google Sheet real.
 *
 * Nada de lo que pasa aquí se sincroniza entre usuarios ni dispositivos:
 * es solo para previsualización local.
 * =====================================================================
 */
(function () {
  var DEMO_KEY = 'rifa_demo_state_v1';

  function esModoDemo() {
    var url = (window.RIFA_CONFIG && window.RIFA_CONFIG.API_URL) || '';
    return !url || url.indexOf('TU_ID_DE_IMPLEMENTACION') !== -1;
  }

  function estadoInicial() {
    var max = 99;
    var pad = 2;
    var numeros = [];
    for (var i = 0; i <= max; i++) {
      numeros.push({ numero: String(i).padStart(pad, '0'), estado: 'disponible' });
    }
    // Simulamos algunos ya vendidos/reservados para que se vea realista
    [3, 7, 12, 45, 68, 71, 88].forEach(function (i) { numeros[i].estado = 'vendido'; });
    [15, 22, 50].forEach(function (i) { numeros[i].estado = 'reservado'; });

    return {
      config: {
        nombre_rifa: 'Rifa del iPhone 16 Pro (demo)',
        premio: 'iPhone 16 Pro 256GB',
        rango: '99',
        precio_numero: 5,
        moneda: 'USD',
        fecha_sorteo: '2026-12-24',
        metodos_pago: 'Pago Móvil, Binance, Zelle',
        whatsapp_contacto: '584247064335',
        estado_rifa: 'activa'
      },
      numeros: numeros,
      participantes: []
    };
  }

  function leerEstado() {
    var raw = localStorage.getItem(DEMO_KEY);
    if (!raw) {
      var inicial = estadoInicial();
      localStorage.setItem(DEMO_KEY, JSON.stringify(inicial));
      return inicial;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      var inicial2 = estadoInicial();
      localStorage.setItem(DEMO_KEY, JSON.stringify(inicial2));
      return inicial2;
    }
  }

  function guardarEstado(estado) {
    localStorage.setItem(DEMO_KEY, JSON.stringify(estado));
  }

  function getState() {
    var estado = leerEstado();
    return {
      success: true,
      config: estado.config,
      numeros: estado.numeros
    };
  }

  function reservar(body) {
    var estado = leerEstado();

    if (String(estado.config.estado_rifa) !== 'activa') {
      return { success: false, message: 'Esta rifa no está aceptando participaciones en este momento.' };
    }

    var numerosSolicitados = body.numeros || [];
    if (!body.nombre || !body.correo || !body.telefono || !body.metodo_pago || !body.referencia_pago) {
      return { success: false, message: 'Faltan datos obligatorios.' };
    }
    if (numerosSolicitados.length === 0) {
      return { success: false, message: 'Debes seleccionar al menos un número.' };
    }
    if (!body.comprobante_base64) {
      return { success: false, message: 'Debes adjuntar el comprobante de pago.' };
    }

    var noDisponibles = [];
    numerosSolicitados.forEach(function (num) {
      var item = estado.numeros.find(function (n) { return n.numero === num; });
      if (!item || item.estado !== 'disponible') noDisponibles.push(num);
    });

    if (noDisponibles.length > 0) {
      return {
        success: false,
        message: 'Los siguientes números ya no están disponibles: ' + noDisponibles.join(', '),
        numeros_no_disponibles: noDisponibles
      };
    }

    var idParticipante = 'DEMO-' + new Date().getTime();
    numerosSolicitados.forEach(function (num) {
      var item = estado.numeros.find(function (n) { return n.numero === num; });
      item.estado = 'reservado';
    });

    estado.participantes.push({
      id: idParticipante,
      fecha: new Date().toISOString(),
      nombre: body.nombre,
      correo: body.correo,
      telefono: body.telefono,
      numeros: numerosSolicitados.join(', '),
      metodo_pago: body.metodo_pago,
      referencia_pago: body.referencia_pago,
      estado: 'pendiente'
    });

    guardarEstado(estado);

    return {
      success: true,
      message: '¡Participación registrada en modo demo! (esto no se guarda en un servidor real)',
      id_participante: idParticipante,
      numeros_reservados: numerosSolicitados
    };
  }

  window.RIFA_DEMO = {
    esModoDemo: esModoDemo,
    getState: getState,
    reservar: reservar,
    reiniciar: function () { localStorage.removeItem(DEMO_KEY); }
  };
})();
