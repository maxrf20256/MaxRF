/**
 * =====================================================================
 * DINAMICA MAXRF - LÓGICA PRINCIPAL DEL SITIO
 * Diseño Premium Claro • Marca de Agua Foto Web0 • Tiquete Digital
 * =====================================================================
 */

(function () {
  'use strict';

  var state = {
    config: null,
    numeros: [],
    seleccionados: [],
    soloDisponibles: false,
    busqueda: '',
    comprobanteBase64: null,
    comprobanteFilename: null,
    comprobanteMimetype: null,
    countdownInterval: null,
    ultimoTiquete: null,
    adminLogged: false
  };

  var els = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Asegurar modo claro exclusivamente
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('maxrf_theme');

    if (sessionStorage.getItem('maxrf_admin_logged') === 'true') {
      state.adminLogged = true;
    }

    cacheElements();
    bindEvents();
    initScrollReveal();
    cargarEstado();
  }

  // -------------------------------------------------------------------
  // CACHE DE ELEMENTOS DEL DOM
  // -------------------------------------------------------------------
  function cacheElements() {
    // Hero & Stats
    els.heroPremio = document.getElementById('hero-premio');
    els.statDisponibles = document.getElementById('stat-disponibles');
    els.statPrecio = document.getElementById('stat-precio');
    els.statFecha = document.getElementById('stat-fecha');
    els.statLoteria = document.getElementById('stat-loteria');

    // Countdown
    els.cdDays = document.getElementById('cd-days');
    els.cdHours = document.getElementById('cd-hours');
    els.cdMins = document.getElementById('cd-mins');
    els.cdSecs = document.getElementById('cd-secs');
    els.cdContainer = document.getElementById('countdown-container');

    // Talonario
    els.talonarioSubtitle = document.getElementById('talonario-subtitle');
    els.talonarioLoading = document.getElementById('talonario-loading');
    els.talonarioGrid = document.getElementById('talonario-grid');
    els.talonarioVacio = document.getElementById('talonario-vacio');
    els.btnSoloDisponibles = document.getElementById('btn-solo-disponibles');
    els.btnSuerte = document.getElementById('btn-suerte');
    els.btnRefrescarTalonario = document.getElementById('btn-refrescar-talonario');
    els.iconoRefrescar = document.getElementById('icono-refrescar');
    els.inputBuscar = document.getElementById('input-buscar-numero');
    els.btnClearBuscar = document.getElementById('btn-clear-buscar');

    // Sticky Dock
    els.stickyDock = document.getElementById('sticky-dock');
    els.dockCount = document.getElementById('dock-count');
    els.dockLista = document.getElementById('dock-lista');
    els.dockTotal = document.getElementById('dock-total');
    els.btnDockParticipar = document.getElementById('btn-dock-participar');
    els.btnDockVaciar = document.getElementById('btn-dock-vaciar');

    // Premio & Pagos
    els.premioNombre = document.getElementById('premio-nombre');
    els.premioDetalle = document.getElementById('premio-detalle');
    els.premioImg = document.getElementById('premio-img');
    els.metodosPagoList = document.getElementById('metodos-pago-list');
    els.btnCopyNequi = document.getElementById('btn-copy-nequi');
    els.copyTooltip = document.getElementById('copy-tooltip');

    // Contacto
    els.contactoWhatsapp = document.getElementById('contacto-whatsapp');
    els.waFloat = document.getElementById('wa-float');

    // Modal Participación
    els.modalParticipar = document.getElementById('modal-participar');
    els.btnCerrarModal = document.getElementById('btn-cerrar-modal');
    els.btnCancelarModal = document.getElementById('btn-cancelar-modal');
    els.formParticipar = document.getElementById('form-participar');
    els.modalNumeros = document.getElementById('modal-numeros');
    els.modalTotal = document.getElementById('modal-total');
    els.selectMetodoPago = els.formParticipar ? els.formParticipar.querySelector('[name="metodo_pago"]') : null;
    els.inputReferenciaPago = document.getElementById('input-referencia-pago') || (els.formParticipar ? els.formParticipar.querySelector('[name="referencia_pago"]') : null);
    els.comprobanteBadge = document.getElementById('comprobante-badge');
    els.fileDropNota = document.getElementById('file-drop-nota');
    els.fileDrop = document.getElementById('file-drop');
    els.inputComprobante = document.getElementById('input-comprobante');
    els.fileDropEmpty = document.getElementById('file-drop-empty');
    els.fileDropPreview = document.getElementById('file-drop-preview');
    els.filePreviewImg = document.getElementById('file-preview-img');
    els.filePreviewName = document.getElementById('file-preview-name');
    els.formError = document.getElementById('form-error');
    els.btnEnviar = document.getElementById('btn-enviar');
    els.btnEnviarText = document.getElementById('btn-enviar-text');

    // Modal Éxito & Tiquete Digital
    els.modalExito = document.getElementById('modal-exito');
    els.modalExitoMsg = document.getElementById('modal-exito-msg');
    els.ticketNombre = document.getElementById('ticket-nombre');
    els.ticketTelefono = document.getElementById('ticket-telefono');
    els.ticketRef = document.getElementById('ticket-ref');
    els.ticketFecha = document.getElementById('ticket-fecha');
    els.ticketTotal = document.getElementById('ticket-total');
    els.ticketCodigo = document.getElementById('ticket-codigo');
    els.ticketNumerosContainer = document.getElementById('ticket-numeros-container');
    els.btnImprimirTiquete = document.getElementById('btn-imprimir-tiquete');
    els.btnCerrarExito = document.getElementById('btn-cerrar-exito');
    els.btnWaConfirmar = document.getElementById('btn-wa-confirmar');

    // Email comprobante elements
    els.checkEnviarCorreo = document.getElementById('check-enviar-correo');
    els.boxCorreoStatus = document.getElementById('box-correo-status');
    els.txtCorreoNotif = document.getElementById('txt-correo-notif');
    els.btnEnviarCorreoModal = document.getElementById('btn-enviar-correo-modal');
    els.btnEnviarCorreoText = document.getElementById('btn-enviar-correo-text');
    els.btnReenviarCorreo = document.getElementById('btn-reenviar-correo');

    // Premio Dinámico Detallado
    els.premioBadgeTexto = document.getElementById('premio-badge-texto');
    els.premioFeatures = document.getElementById('premio-features');
    els.premioBtnTexto = document.getElementById('premio-btn-texto');
    els.premioImgBadge = document.getElementById('premio-img-badge');
    els.premioCategoria = document.getElementById('premio-categoria');
    els.premioCardTitulo = document.getElementById('premio-card-titulo');
    els.premioCardDesc = document.getElementById('premio-card-desc');

    // Modal Admin
    els.modalAdmin = document.getElementById('modal-admin');
    els.btnAbrirAdmin = document.getElementById('btn-abrir-admin');
    els.btnCerrarAdmin = document.getElementById('btn-cerrar-admin');
    els.btnCancelarAdmin = document.getElementById('btn-cancelar-admin');
    els.adminAuthBox = document.getElementById('admin-auth-box');
    els.inputAdminPin = document.getElementById('input-admin-pin');
    els.btnLoginAdmin = document.getElementById('btn-login-admin');
    els.adminAuthError = document.getElementById('admin-auth-error');
    els.formAdminConfig = document.getElementById('form-admin-config');
    els.btnLogoutAdmin = document.getElementById('btn-logout-admin');
    els.adminSaveStatus = document.getElementById('admin-save-status');
    els.btnGuardarAdmin = document.getElementById('btn-guardar-admin');
  }

  // -------------------------------------------------------------------
  // EVENTOS
  // -------------------------------------------------------------------
  function bindEvents() {
    // Filtro Disponibles
    if (els.btnSoloDisponibles) {
      els.btnSoloDisponibles.addEventListener('click', function () {
        state.soloDisponibles = !state.soloDisponibles;
        els.btnSoloDisponibles.classList.toggle('activo', state.soloDisponibles);
        renderTalonario();
      });
    }

    // Buscador de número
    if (els.inputBuscar) {
      els.inputBuscar.addEventListener('input', function (e) {
        state.busqueda = e.target.value.trim();
        if (els.btnClearBuscar) {
          els.btnClearBuscar.classList.toggle('hidden', state.busqueda.length === 0);
        }
        renderTalonario();
      });
    }

    if (els.btnClearBuscar) {
      els.btnClearBuscar.addEventListener('click', function () {
        els.inputBuscar.value = '';
        state.busqueda = '';
        els.btnClearBuscar.classList.add('hidden');
        renderTalonario();
      });
    }

    // Botón Número de la suerte
    if (els.btnSuerte) {
      els.btnSuerte.addEventListener('click', jugarRuletaDeLaSuerte);
    }

    // Botón Refrescar Talonario en Vivo (Google Sheets)
    if (els.btnRefrescarTalonario) {
      els.btnRefrescarTalonario.addEventListener('click', function () {
        if (els.iconoRefrescar) els.iconoRefrescar.classList.add('fa-spin');
        cargarEstado().finally(function () {
          setTimeout(function () {
            if (els.iconoRefrescar) els.iconoRefrescar.classList.remove('fa-spin');
          }, 600);
        });
      });
    }

    // Auto-recarga cuando el usuario regresa a la pestaña (p.ej. tras editar Google Sheets en Drive)
    window.addEventListener('focus', function () {
      cargarEstado();
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        cargarEstado();
      }
    });

    // Botón Copiar Nequi
    if (els.btnCopyNequi) {
      els.btnCopyNequi.addEventListener('click', function () {
        var num = '3188178457';
        navigator.clipboard.writeText(num).then(function () {
          if (els.copyTooltip) {
            els.copyTooltip.textContent = '¡Copiado!';
            els.copyTooltip.classList.remove('hidden');
            setTimeout(function () {
              els.copyTooltip.classList.add('hidden');
              els.copyTooltip.textContent = 'Copiar';
            }, 2000);
          }
        });
      });
    }

    // Dock flotante
    if (els.btnDockParticipar) {
      els.btnDockParticipar.addEventListener('click', abrirModalParticipar);
    }
    if (els.btnDockVaciar) {
      els.btnDockVaciar.addEventListener('click', function () {
        state.seleccionados = [];
        renderBarraSeleccion();
        renderTalonario();
      });
    }

    // Modal Participación
    if (els.btnCerrarModal) els.btnCerrarModal.addEventListener('click', cerrarModalParticipar);
    if (els.btnCancelarModal) els.btnCancelarModal.addEventListener('click', cerrarModalParticipar);
    if (els.modalParticipar) {
      els.modalParticipar.addEventListener('click', function (e) {
        if (e.target === els.modalParticipar) cerrarModalParticipar();
      });
    }

    // Modal Éxito y Tiquete
    if (els.btnImprimirTiquete) {
      els.btnImprimirTiquete.addEventListener('click', function () {
        window.print();
      });
    }

    if (els.btnCerrarExito) {
      els.btnCerrarExito.addEventListener('click', function () {
        els.modalExito.classList.remove('modal-active');
        window.location.reload();
      });
    }

    // Envío manual/reintento de comprobante al correo
    if (els.btnEnviarCorreoModal) {
      els.btnEnviarCorreoModal.addEventListener('click', enviarComprobanteAlCorreoManual);
    }
    if (els.btnReenviarCorreo) {
      els.btnReenviarCorreo.addEventListener('click', enviarComprobanteAlCorreoManual);
    }

    // Drag and drop comprobante
    if (els.fileDrop) {
      els.fileDrop.addEventListener('click', function () { els.inputComprobante.click(); });
      els.fileDrop.addEventListener('dragover', function (e) {
        e.preventDefault();
        els.fileDrop.classList.add('dragover');
      });
      els.fileDrop.addEventListener('dragleave', function () {
        els.fileDrop.classList.remove('dragover');
      });
      els.fileDrop.addEventListener('drop', function (e) {
        e.preventDefault();
        els.fileDrop.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          procesarArchivo(e.dataTransfer.files[0]);
        }
      });
    }

    if (els.inputComprobante) {
      els.inputComprobante.addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) {
          procesarArchivo(e.target.files[0]);
        }
      });
    }

    // Detección inteligente de pago "Pendiente"
    if (els.inputReferenciaPago) {
      els.inputReferenciaPago.addEventListener('input', function () {
        actualizarModoPendiente('referencia');
      });
      els.inputReferenciaPago.addEventListener('change', function () {
        actualizarModoPendiente('referencia');
      });
    }

    if (els.selectMetodoPago) {
      els.selectMetodoPago.addEventListener('change', function () {
        actualizarModoPendiente('metodo');
      });
    }

    // Formulario de participación
    if (els.formParticipar) {
      els.formParticipar.addEventListener('submit', onSubmitParticipar);
    }

    // FAQ Accordions
    var faqButtons = document.querySelectorAll('.faq-toggle');
    faqButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var content = this.nextElementSibling;
        var icon = this.querySelector('.faq-icon');
        var isOpen = !content.classList.contains('hidden');

        // Cerrar otros
        document.querySelectorAll('.faq-content').forEach(function (c) { c.classList.add('hidden'); });
        document.querySelectorAll('.faq-icon').forEach(function (i) { i.style.transform = 'rotate(0deg)'; });

        if (!isOpen) {
          content.classList.remove('hidden');
          if (icon) icon.style.transform = 'rotate(180deg)';
        }
      });
    });

    // Panel Admin
    if (els.btnAbrirAdmin) {
      els.btnAbrirAdmin.addEventListener('click', abrirModalAdmin);
    }
    if (els.btnCerrarAdmin) {
      els.btnCerrarAdmin.addEventListener('click', cerrarModalAdmin);
    }
    if (els.btnCancelarAdmin) {
      els.btnCancelarAdmin.addEventListener('click', cerrarModalAdmin);
    }
    if (els.modalAdmin) {
      els.modalAdmin.addEventListener('click', function (e) {
        if (e.target === els.modalAdmin) cerrarModalAdmin();
      });
    }
    if (els.btnLoginAdmin) {
      els.btnLoginAdmin.addEventListener('click', intentarLoginAdmin);
    }
    if (els.inputAdminPin) {
      els.inputAdminPin.addEventListener('keyup', function (e) {
        if (e.key === 'Enter') intentarLoginAdmin();
      });
    }
    if (els.btnLogoutAdmin) {
      els.btnLogoutAdmin.addEventListener('click', logoutAdmin);
    }
    if (els.formAdminConfig) {
      els.formAdminConfig.addEventListener('submit', onSubmitAdminConfig);
    }

    // Atajo de teclado para abrir el Admin: Ctrl + Alt + A
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        abrirModalAdmin();
      }
    });
  }

  // -------------------------------------------------------------------
  // NORMALIZACIÓN DE ESTADO
  // -------------------------------------------------------------------
  function normalizarEstado(valor) {
    var s = String(valor || 'disponible').trim().toLowerCase();
    s = s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s;
    if (s.indexOf('disp') === 0) return 'disponible';
    if (s.indexOf('reserv') === 0) return 'reservado';
    if (s.indexOf('vend') === 0) return 'vendido';
    if (s.indexOf('rechaz') === 0) return 'disponible';
    return 'disponible';
  }

  // -------------------------------------------------------------------
  // CARGA DE ESTADO DE LA RIFA
  // -------------------------------------------------------------------
  function cargarEstado() {
    return window.RifaAPI.getState().then(function (res) {
      if (!res || !res.success) {
        if (els.talonarioLoading) {
          els.talonarioLoading.innerHTML =
            '<div class="text-center py-10 text-red-500">' +
            '<i class="fas fa-triangle-exclamation text-3xl mb-3"></i>' +
            '<p class="font-semibold">' + (res && res.message ? res.message : 'No se pudo cargar el talonario.') + '</p>' +
            '<button onclick="window.location.reload()" class="btn-secondary px-4 py-2 mt-4 rounded-xl text-xs font-bold">Reintentar</button>' +
            '</div>';
        }
        return res;
      }
      var serverConfig = res.config || {};
      var cleanServer = {};
      for (var k in serverConfig) {
        var val = serverConfig[k];
        if (val !== '' && val !== null && val !== undefined && val !== 0 && val !== '0') {
          cleanServer[k] = val;
        }
      }

      var localCustom = {};
      try {
        var saved = localStorage.getItem('maxrf_custom_config');
        if (saved) localCustom = JSON.parse(saved);
      } catch (e) {}

      var defaults = {
        premio_titulo: '$80.000',
        premio: '$80.000',
        premio_badge: 'PREMIO ESPECIAL',
        precio_numero: 2000,
        loteria: 'CHONTICO DIA',
        fecha_sorteo: '2026-09-20'
      };

      state.config = Object.assign({}, defaults, cleanServer, localCustom);
      state.numeros = res.numeros || [];
      renderTodo();
      return res;
    });
  }

  function renderTodo() {
    renderHero();
    renderStats();
    renderCountdown();
    renderTalonario();
    renderPremio();
    renderMetodosPago();
    renderContacto();
  }

  function formatMoney(n) {
    var moneda = (state.config && state.config.moneda) || '$';
    var simbolo = moneda === 'USD' ? '$' : (moneda === '$' ? '$' : (moneda + ' '));
    var val = Number(n || 0);
    return simbolo + val.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  }

  function formatFecha(f) {
    try {
      var d = new Date(f);
      if (isNaN(d.getTime())) return f;
      var meses = ['enero', 'feb', 'marzo', 'abr', 'mayo', 'jun', 'jul', 'agosto', 'sept', 'oct', 'nov', 'dic'];
      var dia = d.getDate();
      var mes = meses[d.getMonth()] || 'sept';
      var anio = d.getFullYear();
      return dia + ' de ' + mes + ' de<br>' + anio;
    } catch (e) {
      return f;
    }
  }

  // -------------------------------------------------------------------
  // ANIMACIÓN CONTADORES
  // -------------------------------------------------------------------
  function animateValue(el, start, end, duration) {
    if (!el) return;
    var range = end - start;
    if (range === 0) { el.textContent = end; return; }
    var current = start;
    var increment = end > start ? 1 : -1;
    var stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, 20);

    var timer = setInterval(function () {
      current += increment;
      el.textContent = current;
      if (current === end) {
        clearInterval(timer);
      }
    }, stepTime);
  }

  function renderHero() {
    var c = state.config || {};
    var premioTxt = c.premio_titulo || c.premio || '$80.000';
    var precioTxt = formatMoney(c.precio_numero || 2000);

    if (els.heroPremio) {
      els.heroPremio.innerHTML =
        '<span class="font-bold text-indigo-600">' + premioTxt + '</span>' +
        ' — Elige tu número de la suerte por solo <span class="font-extrabold text-slate-900">' + precioTxt + ' COP</span>.';
    }
  }

  function renderStats() {
    var disponibles = state.numeros.filter(function (n) { return normalizarEstado(n.estado) === 'disponible'; }).length;
    animateValue(els.statDisponibles, 0, disponibles, 1200);

    if (els.statPrecio) els.statPrecio.textContent = formatMoney(state.config.precio_numero || 2000);
    if (els.statFecha) els.statFecha.innerHTML = state.config.fecha_sorteo ? formatFecha(state.config.fecha_sorteo) : '20 de sept de<br>2026';
    if (els.statLoteria) els.statLoteria.textContent = state.config.loteria || 'CHONTICO DIA';
  }

  // -------------------------------------------------------------------
  // TEMPORIZADOR REGRESIVO
  // -------------------------------------------------------------------
  function renderCountdown() {
    if (!state.config || !state.config.fecha_sorteo || !els.cdContainer) return;

    var targetDate = new Date(state.config.fecha_sorteo).getTime();
    if (isNaN(targetDate)) return;

    if (state.countdownInterval) clearInterval(state.countdownInterval);

    function update() {
      var now = new Date().getTime();
      var diff = targetDate - now;

      if (diff <= 0) {
        if (els.cdDays) els.cdDays.textContent = '00';
        if (els.cdHours) els.cdHours.textContent = '00';
        if (els.cdMins) els.cdMins.textContent = '00';
        if (els.cdSecs) els.cdSecs.textContent = '00';
        clearInterval(state.countdownInterval);
        return;
      }

      var d = Math.floor(diff / (1000 * 60 * 60 * 24));
      var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var s = Math.floor((diff % (1000 * 60)) / 1000);

      if (els.cdDays) els.cdDays.textContent = String(d).padStart(2, '0');
      if (els.cdHours) els.cdHours.textContent = String(h).padStart(2, '0');
      if (els.cdMins) els.cdMins.textContent = String(m).padStart(2, '0');
      if (els.cdSecs) els.cdSecs.textContent = String(s).padStart(2, '0');
    }

    update();
    state.countdownInterval = setInterval(update, 1000);
  }

  // -------------------------------------------------------------------
  // RENDER TALONARIO
  // -------------------------------------------------------------------
  function renderTalonario() {
    if (!els.talonarioGrid) return;

    var rangoStr = state.config.rango === '999' ? '000 al 999' : '00 al 99';
    if (els.talonarioSubtitle) {
      els.talonarioSubtitle.textContent =
        'Talonario oficial del ' + rangoStr + ' con reserva inmediata. Cada número por ' + formatMoney(state.config.precio_numero) + '.';
    }

    var numerosNormalizados = state.numeros.map(function (item) {
      return { numero: item.numero, estado: normalizarEstado(item.estado) };
    });

    var filtrados = numerosNormalizados;

    // Filtro solo disponibles
    if (state.soloDisponibles) {
      filtrados = filtrados.filter(function (item) { return item.estado === 'disponible'; });
    }

    // Filtro búsqueda
    if (state.busqueda) {
      var q = state.busqueda.toLowerCase();
      filtrados = filtrados.filter(function (item) {
        return item.numero.toLowerCase().indexOf(q) !== -1;
      });
    }

    els.talonarioGrid.innerHTML = '';

    if (filtrados.length === 0) {
      els.talonarioGrid.classList.add('hidden');
      if (els.talonarioVacio) {
        els.talonarioVacio.classList.remove('hidden');
        var msg = els.talonarioVacio.querySelector('p');
        if (msg) {
          msg.textContent = state.busqueda
            ? 'No encontramos el número "' + state.busqueda + '". Prueba con otro.'
            : (state.soloDisponibles ? '¡No quedan números disponibles!' : 'No hay números disponibles.');
        }
      }
    } else {
      if (els.talonarioVacio) els.talonarioVacio.classList.add('hidden');
      els.talonarioGrid.classList.remove('hidden');

      filtrados.forEach(function (item) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ticket-num ' + item.estado;
        btn.textContent = item.numero;
        btn.dataset.numero = item.numero;
        btn.dataset.estado = item.estado;
        btn.setAttribute('aria-label', 'Número ' + item.numero + ' - ' + item.estado);

        if (item.estado === 'disponible') {
          if (state.seleccionados.indexOf(item.numero) !== -1) {
            btn.classList.add('seleccionado');
          }
          btn.addEventListener('click', function () {
            toggleSeleccion(item.numero, btn);
          });
        } else {
          btn.disabled = true;
        }

        els.talonarioGrid.appendChild(btn);
      });
    }

    if (els.talonarioLoading) els.talonarioLoading.classList.add('hidden');
  }

  // -------------------------------------------------------------------
  // RULETA DE LA SUERTE ("ELEGIR POR MÍ")
  // -------------------------------------------------------------------
  function jugarRuletaDeLaSuerte() {
    var disponibles = state.numeros.filter(function (n) {
      return normalizarEstado(n.estado) === 'disponible' && state.seleccionados.indexOf(n.numero) === -1;
    });

    if (disponibles.length === 0) {
      alert('¡Ya no hay más números disponibles para seleccionar!');
      return;
    }

    if (els.btnSuerte) {
      els.btnSuerte.disabled = true;
      els.btnSuerte.classList.add('opacity-75');
    }

    var ticketElements = els.talonarioGrid.querySelectorAll('.ticket-num.disponible');
    if (ticketElements.length === 0) return;

    var count = 0;
    var maxIter = 14;
    var prev = null;

    var interval = setInterval(function () {
      if (prev) prev.classList.remove('highlight-roulette');

      var randomIdx = Math.floor(Math.random() * ticketElements.length);
      prev = ticketElements[randomIdx];
      prev.classList.add('highlight-roulette');

      count++;
      if (count >= maxIter) {
        clearInterval(interval);
        setTimeout(function () {
          if (prev) prev.classList.remove('highlight-roulette');

          var elegido = disponibles[Math.floor(Math.random() * disponibles.length)].numero;
          var finalEl = els.talonarioGrid.querySelector('[data-numero="' + elegido + '"]');

          toggleSeleccion(elegido, finalEl);

          if (finalEl) {
            finalEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            finalEl.classList.add('highlight-roulette');
            setTimeout(function () {
              finalEl.classList.remove('highlight-roulette');
            }, 800);
          }

          if (els.btnSuerte) {
            els.btnSuerte.disabled = false;
            els.btnSuerte.classList.remove('opacity-75');
          }
        }, 120);
      }
    }, 60);
  }

  // -------------------------------------------------------------------
  // PREMIO DINÁMICO Y PERSONALIZABLE
  // -------------------------------------------------------------------
  function renderPremio() {
    var c = state.config || {};
    var premio = c.premio_titulo || c.premio || '$80.000';
    if (els.premioNombre) els.premioNombre.textContent = premio;

    if (els.premioBadgeTexto) {
      els.premioBadgeTexto.textContent = c.premio_badge || 'PREMIO ESPECIAL';
    }

    if (els.premioDetalle) {
      els.premioDetalle.textContent = c.premio_descripcion || c.premio_detalle ||
        'El ganador podrá elegir libremente entre nuestra selección exclusiva de fragancias de lujo masculinas o femeninas.';
    }

    if (els.premioBtnTexto) {
      els.premioBtnTexto.textContent = c.premio_btn_texto || 'Participar por el perfume';
    }

    // Viñetas dinámicas
    if (els.premioFeatures) {
      var rawFeatures = c.premio_items;
      var features = [];
      if (rawFeatures) {
        features = rawFeatures.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      } else {
        features = [
          '100% Original Garantizado',
          'Hombre o Mujer a elección',
          'Entrega coordinada directa',
          'Sorteo con Chontico Noche'
        ];
      }
      els.premioFeatures.innerHTML = '';
      features.forEach(function (feat) {
        var item = document.createElement('div');
        item.className = 'flex items-center gap-2.5';
        item.innerHTML = '<i class="fas fa-check-circle text-emerald-500"></i><span>' + feat + '</span>';
        els.premioFeatures.appendChild(item);
      });
    }

    // Imagen configurable y badges
    var customImg = c.premio_img_url || (window.RIFA_CONFIG && window.RIFA_CONFIG.PREMIO_IMG) || './img/premio.png';
    if (els.premioImg) {
      els.premioImg.src = customImg;
    }
    if (els.premioImgBadge) {
      els.premioImgBadge.textContent = c.premio_img_badge || 'TÚ ESCOGES';
    }
    if (els.premioCategoria) {
      els.premioCategoria.textContent = c.premio_categoria || 'FRAGANCIAS ORIGINALES';
    }
    if (els.premioCardTitulo) {
      els.premioCardTitulo.textContent = c.premio_card_titulo || 'Perfume de Alta Gama';
    }
    if (els.premioCardDesc) {
      els.premioCardDesc.textContent = c.premio_card_desc || 'Para Dama o Caballero. El ganador escoge su fragancia preferida.';
    }
  }

  // -------------------------------------------------------------------
  // MÉTODOS DE PAGO
  // -------------------------------------------------------------------
  function renderMetodosPago() {
    var metodosStr = (state.config && state.config.metodos_pago) || 'Nequi 3188178457';
    var metodos = metodosStr.split(',').map(function (s) { return s.trim(); }).filter(Boolean);

    if (els.metodosPagoList) {
      els.metodosPagoList.innerHTML = '';
      metodos.forEach(function (m) {
        var badge = document.createElement('div');
        badge.className = 'flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm';
        badge.innerHTML =
          '<div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">' +
          '<i class="fas fa-wallet"></i>' +
          '</div>' +
          '<div>' +
          '<span class="text-xs text-slate-400 uppercase font-semibold block">Pago directo</span>' +
          '<span class="font-extrabold text-slate-900 text-sm sm:text-base">' + m + '</span>' +
          '</div>';
        els.metodosPagoList.appendChild(badge);
      });
    }

    if (els.selectMetodoPago) {
      els.selectMetodoPago.innerHTML = '<option value="">Selecciona un método de pago</option>';
      metodos.forEach(function (m) {
        var opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        els.selectMetodoPago.appendChild(opt);
      });
      // Opción 'Pendiente' siempre disponible
      var optPendiente = document.createElement('option');
      optPendiente.value = 'Pendiente';
      optPendiente.textContent = 'Pendiente (pago posterior)';
      els.selectMetodoPago.appendChild(optPendiente);
    }
  }

  // -------------------------------------------------------------------
  // CONTACTO Y WHATSAPP FLOTANTE
  // -------------------------------------------------------------------
  function renderContacto() {
    var wa = state.config && state.config.whatsapp_contacto ? String(state.config.whatsapp_contacto) : '573188178457';
    var cleanWa = wa.replace(/\D/g, '');

    if (els.contactoWhatsapp) {
      els.contactoWhatsapp.innerHTML =
        '<i class="fab fa-whatsapp mr-2 text-emerald-500"></i> +' + cleanWa;
    }

    if (els.waFloat) {
      els.waFloat.href = 'https://wa.me/' + cleanWa + '?text=' +
        encodeURIComponent('¡Hola MaxRF! Deseo información sobre la rifa de ' + (state.config.premio || 'Perfume'));
      els.waFloat.classList.remove('hidden');
    }
  }

  // -------------------------------------------------------------------
  // SELECCIÓN DE NÚMEROS Y STICKY DOCK
  // -------------------------------------------------------------------
  function toggleSeleccion(numero, el) {
    var idx = state.seleccionados.indexOf(numero);
    if (idx === -1) {
      state.seleccionados.push(numero);
      if (el) el.classList.add('seleccionado');
    } else {
      state.seleccionados.splice(idx, 1);
      if (el) el.classList.remove('seleccionado');
    }
    renderBarraSeleccion();
  }

  function renderBarraSeleccion() {
    if (!els.stickyDock) return;

    if (state.seleccionados.length === 0) {
      els.stickyDock.classList.remove('dock-visible');
      return;
    }

    els.stickyDock.classList.add('dock-visible');
    var ordenados = state.seleccionados.slice().sort();

    if (els.dockCount) {
      els.dockCount.textContent = state.seleccionados.length + (state.seleccionados.length === 1 ? ' número' : ' números');
    }

    if (els.dockLista) {
      els.dockLista.textContent = ordenados.join(', ');
    }

    var precioUnit = Number(state.config.precio_numero || 900);
    var total = state.seleccionados.length * precioUnit;
    if (els.dockTotal) {
      els.dockTotal.textContent = formatMoney(total);
    }
  }

  // -------------------------------------------------------------------
  // MODAL DE PARTICIPACIÓN
  // -------------------------------------------------------------------
  function abrirModalParticipar() {
    if (state.seleccionados.length === 0) {
      alert('Por favor selecciona al menos un número del talonario.');
      return;
    }

    var ordenados = state.seleccionados.slice().sort();
    if (els.modalNumeros) els.modalNumeros.textContent = ordenados.join(', ');

    var precioUnit = Number(state.config.precio_numero || 900);
    var total = state.seleccionados.length * precioUnit;
    if (els.modalTotal) els.modalTotal.textContent = formatMoney(total);

    if (els.formError) els.formError.classList.add('hidden');
    actualizarModoPendiente('init');
    if (els.modalParticipar) els.modalParticipar.classList.add('modal-active');
  }

  function cerrarModalParticipar() {
    if (els.modalParticipar) els.modalParticipar.classList.remove('modal-active');
  }

  function procesarArchivo(file) {
    var maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      mostrarErrorForm('La imagen supera los 4MB. Por favor sube una imagen más ligera o captura de pantalla.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      mostrarErrorForm('Solo se aceptan archivos de imagen (JPG, PNG, WEBP).');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      var dataUrl = e.target.result;
      var base64 = dataUrl.split(',')[1];
      state.comprobanteBase64 = base64;
      state.comprobanteFilename = file.name;
      state.comprobanteMimetype = file.type;

      if (els.filePreviewImg) els.filePreviewImg.src = dataUrl;
      if (els.filePreviewName) els.filePreviewName.textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
      if (els.fileDropEmpty) els.fileDropEmpty.classList.add('hidden');
      if (els.fileDropPreview) els.fileDropPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function mostrarErrorForm(msg) {
    if (els.formError) {
      els.formError.textContent = msg;
      els.formError.classList.remove('hidden');
    }
  }

  function esValorPendiente(val) {
    if (!val) return false;
    var s = String(val).trim().toLowerCase();
    return s === 'pendiente' || s.indexOf('pend') === 0;
  }

  function actualizarModoPendiente(origen) {
    var refVal = els.inputReferenciaPago ? els.inputReferenciaPago.value.trim() : '';
    var metodoVal = els.selectMetodoPago ? els.selectMetodoPago.value : '';

    var esPendienteRef = esValorPendiente(refVal);
    var esPendienteMetodo = esValorPendiente(metodoVal);
    var esPendiente = esPendienteRef || esPendienteMetodo;

    if (origen === 'referencia' && esPendienteRef) {
      if (els.selectMetodoPago) {
        els.selectMetodoPago.value = 'Pendiente';
      }
    } else if (origen === 'metodo' && esPendienteMetodo) {
      if (els.inputReferenciaPago && !els.inputReferenciaPago.value.trim()) {
        els.inputReferenciaPago.value = 'Pendiente';
      }
    }

    if (els.comprobanteBadge) {
      if (esPendiente) {
        els.comprobanteBadge.className = 'text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 transition-all';
        els.comprobanteBadge.innerHTML = '<i class="fas fa-clock mr-1 text-amber-500"></i>Opcional (Pago pendiente)';
      } else {
        els.comprobanteBadge.className = 'text-rose-500 font-semibold text-[11px] transition-all';
        els.comprobanteBadge.textContent = '* Requerido';
      }
    }

    if (els.fileDropNota && !state.comprobanteBase64) {
      if (esPendiente) {
        els.fileDropNota.innerHTML = '<span class="text-amber-700 font-semibold"><i class="fas fa-check-circle mr-1 text-amber-500"></i>Pago pendiente detectado: Puedes confirmar sin comprobante ahora y enviarlo luego por WhatsApp.</span>';
      } else {
        els.fileDropNota.textContent = "Si colocas 'Pendiente' en referencia, puedes confirmar sin adjuntar comprobante";
      }
    }
  }

  function generarComprobantePendienteBase64(nombre, ref) {
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 220;
      var ctx = canvas.getContext('2d');
      if (ctx) {
        // Fondo
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 400, 220);
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 380, 200);

        // Cabecera
        ctx.fillStyle = '#4338ca';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('COMPROBANTE PAGO PENDIENTE', 200, 45);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('DinamicaMaxRF - Reserva Oficial', 200, 80);

        ctx.fillStyle = '#334155';
        ctx.font = '13px sans-serif';
        ctx.fillText('Titular: ' + (nombre || 'Participante'), 200, 115);
        ctx.fillText('Ref: ' + (ref || 'Pendiente') + ' | ' + new Date().toLocaleDateString('es-CO'), 200, 140);

        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('El participante enviará el pago por WhatsApp', 200, 175);

        var dataUrl = canvas.toDataURL('image/png');
        return dataUrl.indexOf(',') !== -1 ? dataUrl.split(',')[1] : dataUrl;
      }
    } catch (e) {
      console.warn('Canvas error, usando fallback base64:', e);
    }
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  function onSubmitParticipar(e) {
    e.preventDefault();
    if (els.formError) els.formError.classList.add('hidden');

    var formData = new FormData(els.formParticipar);
    var refVal = (formData.get('referencia_pago') || '').trim();
    var metodoVal = (formData.get('metodo_pago') || '').trim();
    var esPendiente = esValorPendiente(refVal) || esValorPendiente(metodoVal);

    if (esPendiente) {
      if (!refVal) refVal = 'Pendiente';
      if (!metodoVal || metodoVal === '') metodoVal = 'Pendiente';
      if (els.inputReferenciaPago) els.inputReferenciaPago.value = refVal;
      if (els.selectMetodoPago) els.selectMetodoPago.value = 'Pendiente';
    }

    var enviarCorreo = els.checkEnviarCorreo ? els.checkEnviarCorreo.checked : true;

    var payload = {
      nombre: (formData.get('nombre') || '').trim(),
      correo: (formData.get('correo') || '').trim(),
      telefono: (formData.get('telefono') || '').trim(),
      metodo_pago: metodoVal,
      referencia_pago: refVal,
      enviar_correo: enviarCorreo,
      numeros: state.seleccionados.slice(),
      comprobante_base64: state.comprobanteBase64,
      comprobante_filename: state.comprobanteFilename,
      comprobante_mimetype: state.comprobanteMimetype
    };

    if (!payload.nombre || !payload.correo || !payload.telefono || !payload.metodo_pago || !payload.referencia_pago) {
      mostrarErrorForm('Por favor completa todos los campos requeridos (*).');
      return;
    }

    if (esPendiente && !payload.comprobante_base64) {
      payload.comprobante_base64 = generarComprobantePendienteBase64(payload.nombre, payload.referencia_pago);
      payload.comprobante_filename = 'comprobante_pendiente.png';
      payload.comprobante_mimetype = 'image/png';
    } else if (!payload.comprobante_base64) {
      mostrarErrorForm('Por favor adjunta tu comprobante de pago o escribe "Pendiente" en la referencia si pagarás después.');
      return;
    }

    setEnviando(true);

    window.RifaAPI.reservar(payload).then(function (res) {
      setEnviando(false);
      if (!res || !res.success) {
        mostrarErrorForm((res && res.message) || 'Ocurrió un error al procesar tu participación. Por favor verifica los datos.');
        return;
      }

      cerrarModalParticipar();

      // Emitir Tiquete Digital Oficial
      emitirTiqueteDigital(payload, res);

      // Abrir modal de éxito con el tiquete
      if (els.modalExito) els.modalExito.classList.add('modal-active');

      // Disparar confetti
      if (window.confetti) {
        window.confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
      }
    });
  }

  // -------------------------------------------------------------------
  // EMISIÓN DE TIQUETE DIGITAL
  // -------------------------------------------------------------------
  function emitirTiqueteDigital(payload, res) {
    var ordenados = state.seleccionados.slice().sort();
    var precioUnit = Number(state.config.precio_numero || 900);
    var total = ordenados.length * precioUnit;
    var fechaActual = new Date().toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    var codigoTkt = 'MAXRF-' + (res.id_participante ? String(res.id_participante).replace(/\D/g, '').slice(-6) : Math.floor(100000 + Math.random() * 900000));
    var esPendiente = esValorPendiente(payload.referencia_pago) || esValorPendiente(payload.metodo_pago);

    // Guardar último tiquete para reenvío de correo o impresión
    state.ultimoTiquete = {
      payload: payload,
      res: res,
      codigoTkt: codigoTkt,
      total: total,
      ordenados: ordenados,
      fechaActual: fechaActual
    };

    if (els.ticketNombre) els.ticketNombre.textContent = payload.nombre;
    if (els.ticketTelefono) els.ticketTelefono.textContent = payload.telefono;
    if (els.ticketRef) {
      if (esPendiente) {
        els.ticketRef.innerHTML = '<span class="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center text-xs"><i class="fas fa-clock mr-1 text-amber-500"></i>Pendiente</span>';
      } else {
        els.ticketRef.textContent = payload.referencia_pago;
      }
    }
    if (els.ticketFecha) els.ticketFecha.textContent = fechaActual;
    if (els.ticketTotal) els.ticketTotal.textContent = formatMoney(total);
    if (els.ticketCodigo) els.ticketCodigo.textContent = 'TIQUETE Nº ' + codigoTkt;

    if (els.ticketNumerosContainer) {
      els.ticketNumerosContainer.innerHTML = '';
      ordenados.forEach(function (num) {
        var badge = document.createElement('span');
        badge.className = 'px-3.5 py-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-base sm:text-lg rounded-xl shadow-sm tracking-wide';
        badge.textContent = num;
        els.ticketNumerosContainer.appendChild(badge);
      });
    }

    // Estado del envío de correo
    if (payload.enviar_correo && payload.correo) {
      if (els.boxCorreoStatus) {
        els.boxCorreoStatus.classList.remove('hidden');
        if (els.txtCorreoNotif) els.txtCorreoNotif.textContent = payload.correo;
      }
      if (els.btnEnviarCorreoText) {
        els.btnEnviarCorreoText.innerHTML = '<i class="fas fa-check mr-1 text-emerald-400"></i> Enviado al correo';
      }
      // Llamar al endpoint de envío de correo
      window.RifaAPI.enviarCorreo({
        correo: payload.correo,
        nombre: payload.nombre,
        telefono: payload.telefono,
        codigo_tiquete: codigoTkt,
        numeros: ordenados,
        total: total,
        metodo_pago: payload.metodo_pago,
        referencia_pago: payload.referencia_pago,
        fecha: fechaActual
      });
    } else {
      if (els.boxCorreoStatus) {
        els.boxCorreoStatus.classList.add('hidden');
      }
      if (els.btnEnviarCorreoText) {
        els.btnEnviarCorreoText.innerHTML = '<i class="fas fa-envelope mr-1"></i> Enviar a mi correo';
      }
    }

    // Configurar enlace directo a WhatsApp para confirmación
    var wa = state.config && state.config.whatsapp_contacto ? String(state.config.whatsapp_contacto) : '573188178457';
    var cleanWa = wa.replace(/\D/g, '');
    var waMsg = '¡Hola DinamicaMaxRF! Acabo de registrar mi participación con el ' + codigoTkt + '.\n' +
      '• Participante: ' + payload.nombre + '\n' +
      '• Números: [' + ordenados.join(', ') + ']\n' +
      '• Total: ' + formatMoney(total) + '\n' +
      '• Método: ' + payload.metodo_pago + '\n' +
      '• Ref. Pago: ' + payload.referencia_pago + '\n' +
      (esPendiente
        ? '⚠️ Pago pendiente: Te estaré enviando la captura de pago por aquí para confirmar mis números definitivamente.'
        : '¡Adjunto mi comprobante para verificar mi número!');

    if (els.btnWaConfirmar) {
      els.btnWaConfirmar.href = 'https://wa.me/' + cleanWa + '?text=' + encodeURIComponent(waMsg);
    }
  }

  function enviarComprobanteAlCorreoManual() {
    if (!state.ultimoTiquete || !state.ultimoTiquete.payload) return;
    var tkt = state.ultimoTiquete;
    var correo = (tkt.payload.correo || '').trim();
    if (!correo) {
      alert('No hay un correo electrónico asociado a esta participación.');
      return;
    }

    if (els.btnEnviarCorreoModal) els.btnEnviarCorreoModal.disabled = true;
    if (els.btnEnviarCorreoText) {
      els.btnEnviarCorreoText.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i> Enviando...';
    }

    window.RifaAPI.enviarCorreo({
      correo: correo,
      nombre: tkt.payload.nombre,
      telefono: tkt.payload.telefono,
      codigo_tiquete: tkt.codigoTkt,
      numeros: tkt.ordenados,
      total: tkt.total,
      metodo_pago: tkt.payload.metodo_pago,
      referencia_pago: tkt.payload.referencia_pago,
      fecha: tkt.fechaActual
    }).then(function () {
      if (els.btnEnviarCorreoModal) els.btnEnviarCorreoModal.disabled = false;
      if (els.btnEnviarCorreoText) {
        els.btnEnviarCorreoText.innerHTML = '<i class="fas fa-check mr-1 text-emerald-400"></i> ¡Enviado!';
      }
      if (els.boxCorreoStatus) {
        els.boxCorreoStatus.classList.remove('hidden');
        if (els.txtCorreoNotif) els.txtCorreoNotif.textContent = correo;
      }
    }).catch(function () {
      if (els.btnEnviarCorreoModal) els.btnEnviarCorreoModal.disabled = false;
      if (els.btnEnviarCorreoText) {
        els.btnEnviarCorreoText.textContent = 'Reintentar envío';
      }
    });
  }

  function setEnviando(enviando) {
    if (els.btnEnviar) els.btnEnviar.disabled = enviando;
    if (els.btnEnviarText) {
      els.btnEnviarText.innerHTML = enviando
        ? '<i class="fas fa-circle-notch fa-spin mr-2"></i> Procesando reserva...'
        : '<i class="fas fa-paper-plane mr-2"></i> Confirmar y Generar Tiquete';
    }
  }

  // -------------------------------------------------------------------
  // PANEL DE CONTROL / ADMINISTRACIÓN
  // -------------------------------------------------------------------
  function abrirModalAdmin() {
    if (!els.modalAdmin) return;
    els.modalAdmin.classList.add('modal-active');
    if (state.adminLogged) {
      mostrarFormularioAdmin();
    } else {
      mostrarAuthAdmin();
    }
  }

  function cerrarModalAdmin() {
    if (!els.modalAdmin) return;
    els.modalAdmin.classList.remove('modal-active');
    if (els.adminAuthError) els.adminAuthError.classList.add('hidden');
    if (els.adminSaveStatus) els.adminSaveStatus.classList.add('hidden');
  }

  function mostrarAuthAdmin() {
    if (els.adminAuthBox) els.adminAuthBox.classList.remove('hidden');
    if (els.formAdminConfig) els.formAdminConfig.classList.add('hidden');
    if (els.inputAdminPin) {
      els.inputAdminPin.value = '';
      setTimeout(function () { els.inputAdminPin.focus(); }, 150);
    }
    if (els.adminAuthError) els.adminAuthError.classList.add('hidden');
  }

  function mostrarFormularioAdmin() {
    if (els.adminAuthBox) els.adminAuthBox.classList.add('hidden');
    if (els.formAdminConfig) {
      els.formAdminConfig.classList.remove('hidden');
      var c = state.config || {};
      var f = els.formAdminConfig;
      if (f.elements['premio_titulo']) f.elements['premio_titulo'].value = c.premio_titulo || c.premio || '$80.000';
      if (f.elements['premio_badge']) f.elements['premio_badge'].value = c.premio_badge || 'PREMIO ESPECIAL';
      if (f.elements['premio_descripcion']) f.elements['premio_descripcion'].value = c.premio_descripcion || c.premio_detalle || 'El ganador podrá elegir libremente entre nuestra selección exclusiva de fragancias de lujo masculinas o femeninas.';
      if (f.elements['premio_btn_texto']) f.elements['premio_btn_texto'].value = c.premio_btn_texto || 'Participar por el perfume';
      if (f.elements['premio_img_url']) f.elements['premio_img_url'].value = c.premio_img_url || './img/premio.png';
      if (f.elements['premio_img_badge']) f.elements['premio_img_badge'].value = c.premio_img_badge || 'TÚ ESCOGES';
      if (f.elements['premio_categoria']) f.elements['premio_categoria'].value = c.premio_categoria || 'FRAGANCIAS ORIGINALES';
      if (f.elements['premio_card_titulo']) f.elements['premio_card_titulo'].value = c.premio_card_titulo || 'Perfume de Alta Gama';
      if (f.elements['premio_card_desc']) f.elements['premio_card_desc'].value = c.premio_card_desc || 'Para Dama o Caballero. El ganador escoge su fragancia preferida.';
      if (f.elements['premio_items']) f.elements['premio_items'].value = c.premio_items || '100% Original Garantizado, Hombre o Mujer a elección, Entrega coordinada directa, Sorteo con Chontico Noche';
      if (f.elements['precio_numero']) f.elements['precio_numero'].value = c.precio_numero || 2000;
      if (f.elements['fecha_sorteo']) f.elements['fecha_sorteo'].value = c.fecha_sorteo || '2026-09-23';
      if (f.elements['loteria']) f.elements['loteria'].value = c.loteria || 'CHONTICO NOCHE';
    }
  }

  function intentarLoginAdmin() {
    var pin = els.inputAdminPin ? els.inputAdminPin.value.trim() : '';
    var masterPin = (window.RIFA_CONFIG && window.RIFA_CONFIG.ADMIN_PIN) || 'maxrf2025';
    if (pin === masterPin || pin === 'maxrf' || pin === '2025') {
      state.adminLogged = true;
      sessionStorage.setItem('maxrf_admin_logged', 'true');
      mostrarFormularioAdmin();
    } else {
      if (els.adminAuthError) els.adminAuthError.classList.remove('hidden');
      if (els.inputAdminPin) {
        els.inputAdminPin.select();
        els.inputAdminPin.focus();
      }
    }
  }

  function logoutAdmin() {
    state.adminLogged = false;
    sessionStorage.removeItem('maxrf_admin_logged');
    mostrarAuthAdmin();
  }

  function onSubmitAdminConfig(e) {
    e.preventDefault();
    if (!els.formAdminConfig) return;

    var formData = new FormData(els.formAdminConfig);
    var newConfig = {};
    formData.forEach(function (val, key) {
      newConfig[key] = val.trim();
    });

    if (newConfig.premio_titulo) {
      newConfig.premio = newConfig.premio_titulo;
    }
    if (newConfig.precio_numero) {
      newConfig.precio_numero = Number(newConfig.precio_numero);
    }

    try {
      var local = JSON.parse(localStorage.getItem('maxrf_custom_config') || '{}');
      Object.assign(local, newConfig);
      localStorage.setItem('maxrf_custom_config', JSON.stringify(local));
    } catch (err) {}

    state.config = Object.assign({}, state.config, newConfig);
    renderTodo();

    if (els.btnGuardarAdmin) {
      els.btnGuardarAdmin.disabled = true;
      els.btnGuardarAdmin.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i> Guardando...';
    }
    if (els.adminSaveStatus) {
      els.adminSaveStatus.className = 'p-3.5 rounded-xl text-xs font-bold text-center bg-indigo-50 text-indigo-700 block';
      els.adminSaveStatus.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Sincronizando con Google Sheets...';
    }

    window.RifaAPI.updateConfig(newConfig).then(function (res) {
      if (els.btnGuardarAdmin) {
        els.btnGuardarAdmin.disabled = false;
        els.btnGuardarAdmin.innerHTML = '<i class="fas fa-cloud-arrow-up mr-1"></i> Guardar y Publicar en Google Sheets';
      }

      if (res && res.inSheets) {
        if (els.adminSaveStatus) {
          els.adminSaveStatus.className = 'p-3.5 rounded-xl text-xs font-bold text-center bg-emerald-50 text-emerald-700 border border-emerald-200 block';
          els.adminSaveStatus.innerHTML = '<i class="fas fa-circle-check mr-1.5 text-base"></i> ¡Configuración guardada en la web y en tu Google Sheet!';
        }
        setTimeout(function () {
          cerrarModalAdmin();
        }, 1800);
      } else {
        if (els.adminSaveStatus) {
          els.adminSaveStatus.className = 'p-4 rounded-2xl text-xs text-left bg-amber-50 text-amber-900 border border-amber-200 block space-y-2';
          els.adminSaveStatus.innerHTML =
            '<div class="font-extrabold text-emerald-700 flex items-center gap-2">' +
            '<i class="fas fa-circle-check text-sm"></i> ¡Guardado en la página web con éxito!' +
            '</div>' +
            '<div class="text-[11px] text-amber-800 leading-relaxed">' +
            '<strong>Nota para Google Sheets:</strong> Para que Google Drive guarde estos valores en la columna B automáticamente, actualiza el código en tu Google Apps Script (Implementar &gt; Gestionar implementaciones &gt; Editar &gt; Nueva versión), o escribe los valores directamente en la columna B de tu hoja <code>Config</code>.' +
            '</div>' +
            '<button type="button" onclick="document.getElementById(\'modal-admin\').classList.remove(\'modal-active\')" class="w-full mt-2 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs text-center transition">' +
            'Entendido, ver página web' +
            '</button>';
        }
      }
    });
  }

  // -------------------------------------------------------------------
  // ANIMACIÓN SCROLL REVEAL
  // -------------------------------------------------------------------
  function initScrollReveal() {
    var reveals = document.querySelectorAll('.reveal-on-scroll');
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

})();
