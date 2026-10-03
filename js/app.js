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
    ultimoTiqueteDataUrl: null,
    ultimoTiqueteBlob: null,
    toastTimer: null,
    adminLogged: false,
    participantes: [],
    adminActiveTab: 'config',
    adminTktFiltro: 'todos',
    adminTktSearchQuery: '',
    adminSelectedTiquete: null,
    adminUltimoSoporteDataUrl: null
  };

  var els = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Asegurar modo claro exclusivamente
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('maxrf_theme');

    sessionStorage.removeItem('maxrf_admin_logged');
    state.adminLogged = false;

    cacheElements();
    bindEvents();
    initScrollReveal();
    cargarEstado();

    // Auto-sincronización en tiempo real para todos los dispositivos (PC, móvil, tablet)
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        cargarEstado();
      }
    });
    window.addEventListener('focus', function () {
      cargarEstado();
    });

    // Auto-polling cada 15 segundos para reflejar compras y pagos en vivo
    setInterval(function () {
      cargarEstado();
    }, 15000);
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
    els.btnWaConfirmarText = document.getElementById('btn-wa-confirmar-text');
    els.btnWaCopiaSoporte = document.getElementById('btn-wa-copia-soporte');
    els.ticketLoteria = document.getElementById('ticket-loteria');
    els.ticketFechaSorteo = document.getElementById('ticket-fecha-sorteo-val');
    els.ticketLogoImg = document.getElementById('ticket-logo-img');
    els.ticketPremioTxt = document.getElementById('ticket-premio-txt');
    els.btnDescargarTiqueteImg = document.getElementById('btn-descargar-tiquete-img');
    els.btnCopiarTiqueteImg = document.getElementById('btn-copiar-tiquete-img');
    els.toastTiqueteAviso = document.getElementById('toast-tiquete-aviso');

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
    els.formLoginAdmin = document.getElementById('form-login-admin');
    els.inputAdminEmail = document.getElementById('input-admin-email');
    els.inputAdminPin = document.getElementById('input-admin-pin');
    els.btnLoginAdmin = document.getElementById('btn-login-admin');
    els.adminAuthError = document.getElementById('admin-auth-error');
    els.formAdminConfig = document.getElementById('form-admin-config');
    els.btnLogoutAdmin = document.getElementById('btn-logout-admin');
    els.adminSaveStatus = document.getElementById('admin-save-status');
    els.btnGuardarAdmin = document.getElementById('btn-guardar-admin');

    // Admin Tabs & Tiquetes
    els.adminNavBar = document.getElementById('admin-nav-bar');
    els.tabBtnConfig = document.getElementById('tab-btn-config');
    els.tabBtnTiquetes = document.getElementById('tab-btn-tiquetes');
    els.badgeTotalTiquetes = document.getElementById('badge-total-tiquetes');
    els.adminTiquetesBox = document.getElementById('admin-tiquetes-box');
    els.adminSearchTiquete = document.getElementById('admin-search-tiquete');
    els.btnClearSearchTkt = document.getElementById('btn-clear-search-tkt');
    els.btnRefreshTiquetes = document.getElementById('btn-refresh-tiquetes');
    els.cntFilterTodos = document.getElementById('cnt-filter-todos');
    els.cntFilterPendientes = document.getElementById('cnt-filter-pendientes');
    els.cntFilterPagados = document.getElementById('cnt-filter-pagados');
    els.cntFilterRechazados = document.getElementById('cnt-filter-rechazados');
    els.adminTiqueteDetalle = document.getElementById('admin-tiquete-detalle');
    els.btnCerrarDetalleTkt = document.getElementById('btn-cerrar-detalle-tkt');
    els.detTicketCodigo = document.getElementById('det-ticket-codigo');
    els.detTicketEstadoBadge = document.getElementById('det-ticket-estado-badge');
    els.detTicketNombre = document.getElementById('det-ticket-nombre');
    els.detTicketTel = document.getElementById('det-ticket-tel');
    els.detTicketWaLink = document.getElementById('det-ticket-wa-link');
    els.detTicketNumeros = document.getElementById('det-ticket-numeros');
    els.detTicketTotal = document.getElementById('det-ticket-total');
    els.detTicketMetodoRef = document.getElementById('det-ticket-metodo-ref');
    els.detTicketFecha = document.getElementById('det-ticket-fecha');
    els.inputRefActualizada = document.getElementById('input-ref-actualizada');
    els.btnEjecutarCambioEstado = document.getElementById('btn-ejecutar-cambio-estado');
    els.btnEliminarTiqueteDetalle = document.getElementById('btn-eliminar-tiquete-detalle');
    els.statusCambioEstado = document.getElementById('status-cambio-estado');
    els.boxSoporteGenerado = document.getElementById('box-soporte-generado');
    els.txtSoporteDriveStatus = document.getElementById('txt-soporte-drive-status');
    els.imgSoportePreview = document.getElementById('img-soporte-preview');
    els.btnDescargarSoporte = document.getElementById('btn-descargar-soporte');
    els.btnWhatsappSoporte = document.getElementById('btn-whatsapp-soporte');
    els.boxDriveLink = document.getElementById('box-drive-link');
    els.linkSoporteDrive = document.getElementById('link-soporte-drive');
    els.txtContadorResultados = document.getElementById('txt-contador-resultados');
    els.listaTiquetesContainer = document.getElementById('lista-tiquetes-container');
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

    // Compartir por WhatsApp con Imagen / Descargar Imagen
    if (els.btnWaConfirmar) {
      els.btnWaConfirmar.addEventListener('click', compartirTiqueteWhatsApp);
    }
    if (els.btnDescargarTiqueteImg) {
      els.btnDescargarTiqueteImg.addEventListener('click', descargarImagenTiquete);
    }
    if (els.btnCopiarTiqueteImg) {
      els.btnCopiarTiqueteImg.addEventListener('click', function () { copiarImagenTiquete(true); });
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
    // El modal admin no se cierra al hacer clic afuera para evitar pérdida accidental de datos
    if (els.formLoginAdmin) {
      els.formLoginAdmin.addEventListener('submit', intentarLoginAdmin);
    }
    if (els.btnLoginAdmin) {
      els.btnLoginAdmin.addEventListener('click', intentarLoginAdmin);
    }
    if (els.inputAdminEmail) {
      els.inputAdminEmail.addEventListener('keyup', function (e) {
        if (e.key === 'Enter' && els.inputAdminPin) els.inputAdminPin.focus();
      });
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

    // Pestañas del Admin (Configuración vs Consultar Tiquetes)
    if (els.tabBtnConfig) {
      els.tabBtnConfig.addEventListener('click', function () {
        switchAdminTab('config');
      });
    }
    if (els.tabBtnTiquetes) {
      els.tabBtnTiquetes.addEventListener('click', function () {
        switchAdminTab('tiquetes');
      });
    }

    // Buscador y Filtros de Tiquetes en Admin
    if (els.adminSearchTiquete) {
      els.adminSearchTiquete.addEventListener('input', function (e) {
        state.adminTktSearchQuery = e.target.value.trim().toLowerCase();
        if (els.btnClearSearchTkt) {
          els.btnClearSearchTkt.classList.toggle('hidden', state.adminTktSearchQuery.length === 0);
        }
        renderListaTiquetesAdmin();
      });
    }
    if (els.btnClearSearchTkt) {
      els.btnClearSearchTkt.addEventListener('click', function () {
        if (els.adminSearchTiquete) els.adminSearchTiquete.value = '';
        state.adminTktSearchQuery = '';
        els.btnClearSearchTkt.classList.add('hidden');
        renderListaTiquetesAdmin();
      });
    }
    if (els.btnRefreshTiquetes) {
      els.btnRefreshTiquetes.addEventListener('click', function () {
        if (els.btnRefreshTiquetes) {
          els.btnRefreshTiquetes.innerHTML = '<i class="fas fa-rotate fa-spin text-purple-600"></i> Actualizando...';
        }
        cargarEstado().then(function () {
          if (els.btnRefreshTiquetes) {
            els.btnRefreshTiquetes.innerHTML = '<i class="fas fa-rotate text-purple-600"></i> Actualizar';
          }
          renderListaTiquetesAdmin();
        });
      });
    }

    // Filtros rápidos por estado
    var filterBtns = document.querySelectorAll('.btn-filter-tkt');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = this.getAttribute('data-filter') || 'todos';
        setAdminFiltro(f);
      });
    });

    // Detalle de Tiquete y Cambio de Estado
    if (els.btnCerrarDetalleTkt) {
      els.btnCerrarDetalleTkt.addEventListener('click', function () {
        if (els.adminTiqueteDetalle) els.adminTiqueteDetalle.classList.add('hidden');
        state.adminSelectedTiquete = null;
      });
    }
    if (els.btnEjecutarCambioEstado) {
      els.btnEjecutarCambioEstado.addEventListener('click', ejecutarCambioEstadoTiqueteAdmin);
    }
    if (els.btnEliminarTiqueteDetalle) {
      els.btnEliminarTiqueteDetalle.addEventListener('click', function () {
        if (state.adminSelectedTiquete) {
          var tktCode = state.adminSelectedTiquete.ticket || state.adminSelectedTiquete.codigo_tiquete;
          eliminarTiqueteAdmin(tktCode);
        }
      });
    }

    // Delegación de clics en la lista de tiquetes para seleccionar o eliminar tiquete
    if (els.listaTiquetesContainer) {
      els.listaTiquetesContainer.addEventListener('click', function (e) {
        var btnSel = e.target.closest('.btn-seleccionar-tkt');
        if (btnSel) {
          var tktCode = btnSel.getAttribute('data-ticket');
          if (tktCode) {
            var encontrado = state.participantes.find(function (p) {
              return String(p.ticket || p.codigo_tiquete || '').trim().toUpperCase() === tktCode.toUpperCase();
            });
            if (encontrado) {
              seleccionarTiqueteAdmin(encontrado);
            }
          }
          return;
        }

        var btnDel = e.target.closest('.btn-eliminar-tkt-directo');
        if (btnDel) {
          var delCode = btnDel.getAttribute('data-ticket');
          if (delCode) {
            eliminarTiqueteAdmin(delCode);
          }
          return;
        }
      });
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
    if (s.indexOf('reserv') === 0 || s.indexOf('pend') === 0 || s === 'pte' || s.indexOf('pte') === 0) return 'reservado';
    if (s.indexOf('vend') === 0 || s.indexOf('pag') === 0 || s.indexOf('conf') === 0) return 'vendido';
    if (s.indexOf('rechaz') === 0 || s.indexOf('canc') === 0) return 'disponible';
    return 'disponible';
  }

  // -------------------------------------------------------------------
  // CARGA DE ESTADO DE LA RIFA
  // -------------------------------------------------------------------
  function cargarEstado() {
    return window.RifaAPI.getState().then(function (res) {
      if (!res || !res.success) {
        // En caso de error o modo local, recuperar participantes de localStorage
        try {
          var localCached = localStorage.getItem('maxrf_participantes_cache');
          if (localCached) state.participantes = JSON.parse(localCached);
        } catch (e) {}

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
        if (val !== '' && val !== null && val !== undefined) {
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
        fecha_sorteo: '2026-10-01',
        min_numeros: 1,
        max_numeros: 10
      };

      // Prioridad: defaults < localCustom < cleanServer (Google Sheets en vivo)
      state.config = Object.assign({}, defaults, localCustom, cleanServer);
      state.numeros = res.numeros || [];

      // Detección proactiva en vivo: verificar si otro usuario compró o reservó números que teníamos seleccionados
      if (state.seleccionados && state.seleccionados.length > 0) {
        var ocupadosDetectados = [];
        state.numeros.forEach(function (n) {
          var nStr = String(n.numero).trim();
          if (nStr.length === 1) nStr = '0' + nStr;
          var normEstado = normalizarEstado(n.estado);
          if (normEstado !== 'disponible') {
            for (var sIdx = 0; sIdx < state.seleccionados.length; sIdx++) {
              var sStr = String(state.seleccionados[sIdx]).trim();
              if (sStr.length === 1) sStr = '0' + sStr;
              if (sStr === nStr && ocupadosDetectados.indexOf(state.seleccionados[sIdx]) === -1) {
                ocupadosDetectados.push(state.seleccionados[sIdx]);
              }
            }
          }
        });

        if (ocupadosDetectados.length > 0) {
          // Remover los números ya tomados de la selección activa
          state.seleccionados = state.seleccionados.filter(function (n) {
            return ocupadosDetectados.indexOf(n) === -1;
          });

          var msgOcupado = ocupadosDetectados.length === 1
            ? 'este numero ya ha sido seleccionado (' + ocupadosDetectados[0] + ')'
            : 'estos números ya han sido seleccionados (' + ocupadosDetectados.join(', ') + ')';

          mostrarToastAlerta(msgOcupado + '. Por favor escoge otro disponible.', 'error');

          // Si el modal de participación está abierto, advertir de inmediato y recalcular
          if (els.modalParticipar && els.modalParticipar.classList.contains('modal-active')) {
            mostrarErrorForm(msgOcupado + '. Por favor escoge otro número disponible en el talonario.');
            var ordenados = state.seleccionados.slice().sort();
            if (els.modalNumeros) {
              els.modalNumeros.textContent = ordenados.length > 0 ? ordenados.join(', ') : 'Ninguno (selecciona otro)';
            }
            var precioUnit = getPrecioNumero();
            var total = state.seleccionados.length * precioUnit;
            if (els.modalTotal) {
              els.modalTotal.textContent = precioUnit === 0 ? 'GRATIS ($0)' : formatMoney(total);
            }
          }

          renderBarraSeleccion();
        }
      }

      // Sincronizar participantes recibidos de Google Sheets
      if (res.participantes && Array.isArray(res.participantes) && res.participantes.length > 0) {
        state.participantes = res.participantes;
        try {
          localStorage.setItem('maxrf_participantes_cache', JSON.stringify(res.participantes));
        } catch (e) {}
      } else {
        try {
          var cachedPart = localStorage.getItem('maxrf_participantes_cache');
          if (cachedPart) state.participantes = JSON.parse(cachedPart);
        } catch (e) {}
      }

      renderTodo();
      if (state.adminLogged) {
        renderListaTiquetesAdmin();
      }
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

  function getPrecioNumero() {
    if (state.config && state.config.precio_numero !== undefined && state.config.precio_numero !== null) {
      var raw = String(state.config.precio_numero).trim();
      if (raw !== '') {
        var n = Number(raw);
        if (!isNaN(n)) return n;
      }
    }
    return 2000;
  }

  function getMinNumeros() {
    if (state.config && state.config.min_numeros !== undefined && state.config.min_numeros !== null) {
      var n = parseInt(state.config.min_numeros, 10);
      if (!isNaN(n) && n >= 1) return n;
    }
    return 1;
  }

  function getMaxNumeros() {
    if (state.config && state.config.max_numeros !== undefined && state.config.max_numeros !== null) {
      var n = parseInt(state.config.max_numeros, 10);
      if (!isNaN(n) && n >= 1) return n;
    }
    return 10;
  }

  var toastTimeout = null;
  function mostrarToastAlerta(mensaje, tipo) {
    var toast = document.getElementById('toast-global');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-global';
      document.body.appendChild(toast);
    }

    var icono = '<i class="fas fa-triangle-exclamation text-amber-400 text-lg flex-shrink-0"></i>';
    var bgBorder = 'bg-slate-900/95 text-white border-slate-700 shadow-2xl';

    if (tipo === 'success') {
      icono = '<i class="fas fa-circle-check text-emerald-400 text-lg flex-shrink-0"></i>';
      bgBorder = 'bg-emerald-950/95 text-white border-emerald-600/50 shadow-2xl';
    } else if (tipo === 'info') {
      icono = '<i class="fas fa-circle-info text-indigo-400 text-lg flex-shrink-0"></i>';
      bgBorder = 'bg-slate-900/95 text-white border-indigo-500/40 shadow-2xl';
    } else if (tipo === 'error') {
      icono = '<i class="fas fa-circle-xmark text-rose-400 text-lg flex-shrink-0"></i>';
      bgBorder = 'bg-rose-950/95 text-white border-rose-600/50 shadow-2xl';
    }

    toast.className = 'fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] sm:w-auto px-5 py-3.5 rounded-2xl border backdrop-blur flex items-center gap-3 transition-all duration-300 ' + bgBorder;
    toast.innerHTML = icono + '<span class="text-xs sm:text-sm font-semibold leading-snug">' + mensaje + '</span>';
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';
    toast.style.pointerEvents = 'auto';

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -15px)';
      toast.style.pointerEvents = 'none';
    }, 3500);
  }

  function formatMoney(n) {
    var moneda = (state.config && state.config.moneda) || '$';
    var simbolo = (moneda === 'USD' || moneda === '$') ? '$' : (moneda + ' ');
    var val = Number(n !== undefined && n !== null ? n : 0);
    if (isNaN(val)) val = 0;
    return simbolo + val.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  }

  function formatFecha(f) {
    try {
      if (!f) return '';
      var str = String(f).trim();
      var meses = ['enero', 'feb', 'marzo', 'abr', 'mayo', 'jun', 'jul', 'agosto', 'sept', 'oct', 'nov', 'dic'];
      
      // 1. Formato YYYY-MM-DD o ISO con fecha inicial YYYY-MM-DD
      var matchYMD = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (matchYMD) {
        var anio = matchYMD[1];
        var mesIndex = parseInt(matchYMD[2], 10) - 1;
        var dia = parseInt(matchYMD[3], 10);
        var mes = meses[mesIndex] || '';
        return dia + ' de ' + mes + ' de<br>' + anio;
      }
      
      // 2. Formato DD-MM-YYYY
      var matchDMY = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
      if (matchDMY) {
        var dia = parseInt(matchDMY[1], 10);
        var mesIndex = parseInt(matchDMY[2], 10) - 1;
        var anio = matchDMY[3];
        var mes = meses[mesIndex] || '';
        return dia + ' de ' + mes + ' de<br>' + anio;
      }
      
      // 3. Fallback con UTC para evitar desfase de huso horario
      var d = new Date(str);
      if (isNaN(d.getTime())) return f;
      return d.getUTCDate() + ' de ' + (meses[d.getUTCMonth()] || '') + ' de<br>' + d.getUTCFullYear();
    } catch (e) {
      return f;
    }
  }

  function formatFechaTexto(f) {
    try {
      if (!f) return '1 de oct de 2026';
      var formatted = formatFecha(f);
      return String(formatted).replace(/<br\s*\/?>/gi, ' ');
    } catch (e) {
      return String(f || '1 de oct de 2026');
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
    var pNum = getPrecioNumero();
    var precioTxt = pNum === 0 ? 'GRATIS ($0 COP)' : (formatMoney(pNum) + ' COP');

    if (els.heroPremio) {
      els.heroPremio.innerHTML =
        '<span class="font-bold text-indigo-600">' + premioTxt + '</span>' +
        ' — Elige tu número de la suerte por solo <span class="font-extrabold text-slate-900">' + precioTxt + '</span>.';
    }
  }

  function renderStats() {
    var disponibles = state.numeros.filter(function (n) { return normalizarEstado(n.estado) === 'disponible'; }).length;
    animateValue(els.statDisponibles, 0, disponibles, 1200);

    var pNum = getPrecioNumero();
    if (els.statPrecio) els.statPrecio.textContent = pNum === 0 ? '$0' : formatMoney(pNum);
    if (els.statFecha) els.statFecha.innerHTML = state.config.fecha_sorteo ? formatFecha(state.config.fecha_sorteo) : '1 de oct de<br>2026';
    if (els.statLoteria) els.statLoteria.textContent = state.config.loteria || 'CHONTICO DIA';
  }

  // -------------------------------------------------------------------
  // TEMPORIZADOR REGRESIVO
  // -------------------------------------------------------------------
  function renderCountdown() {
    if (!state.config || !state.config.fecha_sorteo || !els.cdContainer) return;

    var rawFecha = String(state.config.fecha_sorteo).trim();
    var targetDate;

    var matchYMD = rawFecha.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (matchYMD) {
      var y = parseInt(matchYMD[1], 10);
      var m = parseInt(matchYMD[2], 10) - 1;
      var d = parseInt(matchYMD[3], 10);
      var lot = String(state.config.loteria || '').toUpperCase();
      var hora = 22; // 10:00 PM por defecto
      if (lot.indexOf('DIA') !== -1 || lot.indexOf('DÍA') !== -1) {
        hora = 13; // Chontico Día juega a la 1:00 PM
      } else if (lot.indexOf('NOCHE') !== -1) {
        hora = 20; // Chontico Noche juega a las 8:00 PM
      }
      targetDate = new Date(y, m, d, hora, 0, 0).getTime();
    } else {
      var parsed = new Date(rawFecha).getTime();
      targetDate = isNaN(parsed) ? null : parsed;
    }

    if (!targetDate || isNaN(targetDate)) return;

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
      var pNum = getPrecioNumero();
      var minN = getMinNumeros();
      var maxN = getMaxNumeros();
      var limitsTxt = '';
      if (minN > 1 || maxN < 100) {
        if (minN === maxN) {
          limitsTxt = ' · Elige exactamente ' + minN + (minN === 1 ? ' número' : ' números') + '.';
        } else {
          limitsTxt = ' · Mínimo ' + minN + ' y máximo ' + maxN + ' números por persona.';
        }
      }
      els.talonarioSubtitle.textContent =
        'Talonario oficial del ' + rangoStr + ' con reserva inmediata. Cada número por ' + (pNum === 0 ? 'GRATIS ($0)' : formatMoney(pNum)) + '.' + limitsTxt;
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
    var max = getMaxNumeros();
    if (state.seleccionados.length >= max) {
      mostrarToastAlerta('Ya alcanzaste el límite máximo de ' + max + (max === 1 ? ' número por participante.' : ' números por participante.'), 'warning');
      return;
    }

    var disponibles = state.numeros.filter(function (n) {
      return normalizarEstado(n.estado) === 'disponible' && state.seleccionados.indexOf(n.numero) === -1;
    });

    if (disponibles.length === 0) {
      mostrarToastAlerta('¡Ya no hay más números disponibles para seleccionar!', 'info');
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
      els.premioDetalle.textContent = c.premio_descripcion || c.descripcion || c.premio_detalle ||
        'El ganador podrá disfrutar del premio oficial de la dinámica. Consulta los detalles y términos aquí.';
    }

    if (els.premioBtnTexto) {
      els.premioBtnTexto.textContent = c.premio_btn_texto || '¡Elegir número y participar!';
    }

    // Viñetas dinámicas (solo si existe en el DOM y hay items configurados)
    if (els.premioFeatures) {
      els.premioFeatures.innerHTML = '';
      if (c.premio_items) {
        var rawFeatures = c.premio_items;
        var features = rawFeatures.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        features.forEach(function (feat) {
          var item = document.createElement('div');
          item.className = 'flex items-center gap-2.5';
          item.innerHTML = '<i class="fas fa-check-circle text-emerald-500"></i><span>' + feat + '</span>';
          els.premioFeatures.appendChild(item);
        });
      }
    }

    // Imagen configurable y badges adaptables a cualquier dinámica
    var customImg = c.premio_img_url || (window.RIFA_CONFIG && window.RIFA_CONFIG.PREMIO_IMG) || './img/premio.png';
    if (els.premioImg) {
      els.premioImg.src = customImg;
    }
    if (els.premioImgBadge) {
      els.premioImgBadge.textContent = c.premio_img_badge || 'OFICIAL';
    }
    if (els.premioCategoria) {
      els.premioCategoria.textContent = c.premio_categoria || 'DINÁMICA OFICIAL';
    }
    if (els.premioCardTitulo) {
      els.premioCardTitulo.textContent = c.premio_card_titulo || premio;
    }
    if (els.premioCardDesc) {
      els.premioCardDesc.textContent = c.premio_card_desc || '¡Participa y sé el afortunado ganador!';
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
      // Opción 'Gratis / Promoción' siempre disponible
      var optGratis = document.createElement('option');
      optGratis.value = 'Gratis / Promoción';
      optGratis.textContent = 'Gratis / Promoción ($0)';
      els.selectMetodoPago.appendChild(optGratis);

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
        encodeURIComponent('¡Hola MaxRF! Deseo información sobre la dinámica de ' + (state.config.premio || 'Premio Oficial'));
      els.waFloat.classList.remove('hidden');
    }
  }

  // -------------------------------------------------------------------
  // SELECCIÓN DE NÚMEROS Y STICKY DOCK
  // -------------------------------------------------------------------
  function toggleSeleccion(numero, el) {
    var idx = state.seleccionados.indexOf(numero);
    if (idx === -1) {
      var max = getMaxNumeros();
      if (state.seleccionados.length >= max) {
        mostrarToastAlerta('Solo puedes elegir un máximo de ' + max + (max === 1 ? ' número por participante.' : ' números por participante.'), 'warning');
        return;
      }
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
    var min = getMinNumeros();
    var max = getMaxNumeros();

    if (els.dockCount) {
      var countTxt = state.seleccionados.length + (state.seleccionados.length === 1 ? ' número' : ' números');
      if (max < 100) {
        countTxt += ' (' + state.seleccionados.length + '/' + max + ' máx.)';
      }
      if (state.seleccionados.length < min) {
        countTxt += ' · Mínimo: ' + min;
      }
      els.dockCount.textContent = countTxt;
    }

    if (els.dockLista) {
      els.dockLista.textContent = ordenados.join(', ');
    }

    var precioUnit = getPrecioNumero();
    var total = state.seleccionados.length * precioUnit;
    if (els.dockTotal) {
      els.dockTotal.textContent = precioUnit === 0 ? 'GRATIS ($0)' : formatMoney(total);
    }
  }

  // -------------------------------------------------------------------
  // MODAL DE PARTICIPACIÓN
  // -------------------------------------------------------------------
  function abrirModalParticipar() {
    var min = getMinNumeros();
    var max = getMaxNumeros();

    if (state.seleccionados.length === 0) {
      mostrarToastAlerta('Por favor selecciona al menos ' + min + (min === 1 ? ' número' : ' números') + ' del talonario.', 'warning');
      return;
    }

    // Validación preventiva en vivo: evitar abrir modal si algún número ya fue tomado por otro usuario
    var ocupadosEnSeleccion = [];
    state.seleccionados.forEach(function (num) {
      var sNum = String(num).trim();
      if (sNum.length === 1) sNum = '0' + sNum;
      var item = state.numeros.find(function (x) {
        var nStr = String(x.numero).trim();
        if (nStr.length === 1) nStr = '0' + nStr;
        return nStr === sNum;
      });
      if (item && normalizarEstado(item.estado) !== 'disponible') {
        ocupadosEnSeleccion.push(num);
      }
    });

    if (ocupadosEnSeleccion.length > 0) {
      state.seleccionados = state.seleccionados.filter(function (n) {
        return ocupadosEnSeleccion.indexOf(n) === -1;
      });
      renderBarraSeleccion();
      renderTalonario();
      var msg = ocupadosEnSeleccion.length === 1
        ? 'este numero ya ha sido seleccionado (' + ocupadosEnSeleccion[0] + '). Por favor escoge otro número disponible.'
        : 'estos números ya han sido seleccionados (' + ocupadosEnSeleccion.join(', ') + '). Por favor escoge otros números disponibles.';
      mostrarToastAlerta(msg, 'error');
      return;
    }

    if (state.seleccionados.length < min) {
      mostrarToastAlerta('Debes elegir al menos ' + min + (min === 1 ? ' número' : ' números') + ' para participar. Has elegido ' + state.seleccionados.length + '.', 'warning');
      return;
    }

    if (state.seleccionados.length > max) {
      mostrarToastAlerta('Has superado el máximo permitido de ' + max + (max === 1 ? ' número.' : ' números.'), 'warning');
      return;
    }

    var ordenados = state.seleccionados.slice().sort();
    if (els.modalNumeros) els.modalNumeros.textContent = ordenados.join(', ');

    var precioUnit = getPrecioNumero();
    var total = state.seleccionados.length * precioUnit;
    if (els.modalTotal) els.modalTotal.textContent = precioUnit === 0 ? 'GRATIS ($0)' : formatMoney(total);

    if (precioUnit === 0) {
      if (els.selectMetodoPago) els.selectMetodoPago.value = 'Gratis / Promoción';
      if (els.inputReferenciaPago && (!els.inputReferenciaPago.value || els.inputReferenciaPago.value.toLowerCase() === 'pendiente')) {
        els.inputReferenciaPago.value = 'GRATIS';
      }
    }

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
      els.formError.innerHTML = '<div class="flex items-start gap-2.5"><i class="fas fa-triangle-exclamation text-rose-500 text-base mt-0.5 flex-shrink-0"></i><span class="text-rose-700 font-bold text-xs sm:text-sm leading-snug">' + msg + '</span></div>';
      els.formError.classList.remove('hidden');
      try {
        els.formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {}
    }
  }

  function esValorPendiente(val) {
    if (!val) return false;
    var s = String(val).trim().toLowerCase();
    return s === 'pendiente' || s.indexOf('pend') === 0 || s === 'pte' || s.indexOf('pte') === 0;
  }

  function actualizarModoPendiente(origen) {
    var precioUnit = getPrecioNumero();
    var esGratis = (precioUnit === 0);
    var refVal = els.inputReferenciaPago ? els.inputReferenciaPago.value.trim() : '';
    var metodoVal = els.selectMetodoPago ? els.selectMetodoPago.value : '';

    if (esGratis) {
      if (els.comprobanteBadge) {
        els.comprobanteBadge.className = 'text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 transition-all';
        els.comprobanteBadge.innerHTML = '<i class="fas fa-gift mr-1 text-emerald-500"></i>100% GRATIS (Sin comprobante)';
      }
      if (els.fileDropNota && !state.comprobanteBase64) {
        els.fileDropNota.innerHTML = '<span class="text-emerald-700 font-semibold"><i class="fas fa-gift mr-1 text-emerald-500"></i>¡Esta dinámica es GRATIS! No requieres comprobante ni pago.</span>';
      }
      return;
    }

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

  function generarComprobanteGratisBase64(nombre) {
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 220;
      var ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f0fdf4';
        ctx.fillRect(0, 0, 400, 220);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 380, 200);

        ctx.fillStyle = '#059669';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PARTICIPACIÓN 100% GRATIS', 200, 45);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('DinamicaMaxRF - Dinámica Oficial', 200, 80);

        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('VALOR: $0 COP (GRATIS)', 200, 120);

        ctx.fillStyle = '#475569';
        ctx.font = '13px sans-serif';
        ctx.fillText('Titular: ' + (nombre || 'Participante'), 200, 155);
        ctx.fillText('Fecha: ' + new Date().toLocaleDateString('es-CO') + ' | Sin costo de participación', 200, 180);

        var dataUrl = canvas.toDataURL('image/png');
        return dataUrl.indexOf(',') !== -1 ? dataUrl.split(',')[1] : dataUrl;
      }
    } catch (eCan) {
      console.warn('Error generando comprobante gratis:', eCan);
    }
    return '';
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
    var precioUnit = getPrecioNumero();
    var totalCalculado = state.seleccionados.length * precioUnit;
    var esGratis = (precioUnit === 0);

    var refVal = (formData.get('referencia_pago') || '').trim();
    var metodoVal = (formData.get('metodo_pago') || '').trim();

    if (esGratis) {
      if (!metodoVal) metodoVal = 'Gratis / Promoción';
      if (!refVal) refVal = 'GRATIS';
      if (els.inputReferenciaPago && !els.inputReferenciaPago.value) els.inputReferenciaPago.value = 'GRATIS';
      if (els.selectMetodoPago && !els.selectMetodoPago.value) els.selectMetodoPago.value = 'Gratis / Promoción';
    }

    var esPendiente = !esGratis && (esValorPendiente(refVal) || esValorPendiente(metodoVal));

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
      total: totalCalculado,
      enviar_correo: enviarCorreo,
      numeros: state.seleccionados.slice(),
      comprobante_base64: state.comprobanteBase64,
      comprobante_filename: state.comprobanteFilename,
      comprobante_mimetype: state.comprobanteMimetype
    };

    if (!state.seleccionados || state.seleccionados.length === 0) {
      mostrarErrorForm('No tienes ningún número seleccionado. Por favor escoge al menos un número disponible.');
      return;
    }

    if (!payload.nombre || !payload.correo || !payload.telefono || !payload.metodo_pago || !payload.referencia_pago) {
      mostrarErrorForm('Por favor completa todos los campos requeridos (*).');
      return;
    }

    // Comprobación preventiva local de números disponibles
    var yaNoDisponibles = [];
    state.seleccionados.forEach(function (num) {
      var sNum = String(num).trim();
      if (sNum.length === 1) sNum = '0' + sNum;
      var item = state.numeros.find(function (x) {
        var nStr = String(x.numero).trim();
        if (nStr.length === 1) nStr = '0' + nStr;
        return nStr === sNum;
      });
      if (item && normalizarEstado(item.estado) !== 'disponible') {
        yaNoDisponibles.push(num);
      }
    });

    if (yaNoDisponibles.length > 0) {
      var msgPrev = yaNoDisponibles.length === 1
        ? 'este numero ya ha sido seleccionado (' + yaNoDisponibles[0] + '). Por favor escoge otro número disponible.'
        : 'estos números ya han sido seleccionados: ' + yaNoDisponibles.join(', ') + '. Por favor escoge otros números disponibles.';
      mostrarErrorForm(msgPrev);
      mostrarToastAlerta(msgPrev, 'error');
      state.seleccionados = state.seleccionados.filter(function (n) {
        return yaNoDisponibles.indexOf(n) === -1;
      });
      renderBarraSeleccion();
      renderTalonario();
      var ordenadosAct = state.seleccionados.slice().sort();
      if (els.modalNumeros) els.modalNumeros.textContent = ordenadosAct.length > 0 ? ordenadosAct.join(', ') : 'Ninguno (selecciona otro)';
      if (els.modalTotal) els.modalTotal.textContent = precioUnit === 0 ? 'GRATIS ($0)' : formatMoney(ordenadosAct.length * precioUnit);
      return;
    }

    if (esGratis && !payload.comprobante_base64) {
      payload.comprobante_base64 = generarComprobanteGratisBase64(payload.nombre);
      payload.comprobante_filename = 'comprobante_gratis.png';
      payload.comprobante_mimetype = 'image/png';
    } else if (esPendiente && !payload.comprobante_base64) {
      payload.comprobante_base64 = generarComprobantePendienteBase64(payload.nombre, payload.referencia_pago);
      payload.comprobante_filename = 'comprobante_pendiente.png';
      payload.comprobante_mimetype = 'image/png';
    } else if (!payload.comprobante_base64) {
      mostrarErrorForm('Por favor adjunta tu comprobante de pago o escribe "Pendiente" en la referencia si pagarás después.');
      return;
    }

    setEnviando(true);

    var codigoTkt = 'MAXRF-' + Math.floor(100000 + Math.random() * 900000);
    payload.codigo_tiquete = codigoTkt;
    payload.ticket = codigoTkt;

    // Actualizar elementos visuales del tiquete en el DOM antes de la captura
    actualizarDatosTiqueteDOM(payload, codigoTkt);

    // Generar captura gráfica visual del tiquete para adjuntarla directamente a la reserva
    generarCapturaTiquete(function (dataUrl, blob) {
      if (dataUrl) {
        payload.tiquete_imagen_base64 = dataUrl;
      }
      payload.enviar_correo = enviarCorreo;

      console.log('Enviando reservar con payload:', payload);
      window.RifaAPI.reservar(payload).then(function (res) {
        console.log('Respuesta recibida de reservar:', res);
        setEnviando(false);
        if (!res || !res.success) {
          var mensajeError = (res && res.message) || 'Ocurrió un error al procesar tu participación. Por favor verifica los datos.';

          // Si el servidor detectó que otro participante finalizó antes y ocupó los números
          if (res && (res.code === 'NUMERO_YA_SELECCIONADO' || res.code === 'NUMEROS_OCUPADOS' || (res.numeros_ocupados && res.numeros_ocupados.length > 0))) {
            var ocupados = (res.numeros_ocupados && res.numeros_ocupados.length > 0) ? res.numeros_ocupados : payload.numeros;

            mostrarErrorForm(mensajeError);
            mostrarToastAlerta(mensajeError, 'error');

            // Filtrar números tomados de state.seleccionados
            state.seleccionados = state.seleccionados.filter(function (n) {
              var s = String(n).trim();
              if (s.length === 1) s = '0' + s;
              return ocupados.indexOf(s) === -1 && ocupados.indexOf(n) === -1;
            });

            // Refrescar inmediatamente el estado en vivo desde Google Sheets
            cargarEstado().then(function () {
              renderBarraSeleccion();
              renderTalonario();

              var ordenados = state.seleccionados.slice().sort();
              if (els.modalNumeros) {
                els.modalNumeros.textContent = ordenados.length > 0 ? ordenados.join(', ') : 'Ninguno seleccionado';
              }
              var precioUnit = getPrecioNumero();
              var total = state.seleccionados.length * precioUnit;
              if (els.modalTotal) {
                els.modalTotal.textContent = precioUnit === 0 ? 'GRATIS ($0)' : formatMoney(total);
              }

              if (state.seleccionados.length === 0) {
                mostrarErrorForm('este numero ya ha sido seleccionado. Por favor cierra esta ventana y escoge otro número disponible en el talonario.');
              }
            });
            return;
          }

          mostrarErrorForm(mensajeError);
          return;
        }

        cerrarModalParticipar();

        // Registrar en state.participantes y cache local
        var ordenadosNums = state.seleccionados.slice().sort();
        var estadoInicial = 'Pendiente';
        var regParticipante = {
          fecha: new Date().toLocaleString('es-CO'),
          nombre: payload.nombre,
          telefono: payload.telefono,
          correo: payload.correo || '',
          numeros: ordenadosNums,
          total: ordenadosNums.length * getPrecioNumero(),
          metodo_pago: payload.metodo_pago,
          referencia_pago: payload.referencia_pago,
          ticket: codigoTkt,
          codigo_tiquete: codigoTkt,
          estado: estadoInicial,
          tiquete_imagen_url: (res && res.tiquete_url) || '',
          tiquete_imagen_base64: dataUrl || ''
        };
        state.participantes.unshift(regParticipante);
        try {
          localStorage.setItem('maxrf_participantes_cache', JSON.stringify(state.participantes));
        } catch (eCache) {}

        // Reflejar de inmediato los números reservados como 'reservado' (naranja) en el talonario
        ordenadosNums.forEach(function (n) {
          var s = String(n).trim();
          if (s.length === 1) s = '0' + s;
          var found = state.numeros.find(function (x) {
            var xStr = String(x.numero).trim();
            if (xStr.length === 1) xStr = '0' + xStr;
            return xStr === s;
          });
          if (found) {
            found.estado = 'reservado';
          }
        });
        renderTalonario();

        // Emitir Tiquete Digital Oficial
        emitirTiqueteDigital(payload, res);

        // Abrir modal de éxito con el tiquete
        if (els.modalExito) els.modalExito.classList.add('modal-active');

        // Disparar confetti festivo
        if (window.confetti) {
          window.confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 } });
        }
      }).catch(function (err) {
        setEnviando(false);
        mostrarErrorForm('Error al conectar con el servidor: ' + (err.message || 'Intenta nuevamente.'));
      });
    });
  }

  // Actualiza los elementos del DOM del tiquete
  function actualizarDatosTiqueteDOM(payload, codigoTkt) {
    var ordenados = state.seleccionados.slice().sort();
    var precioUnit = getPrecioNumero();
    var total = ordenados.length * precioUnit;
    var esGratis = (precioUnit === 0);
    var fechaActual = new Date().toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    var esPendiente = !esGratis && (esValorPendiente(payload.referencia_pago) || esValorPendiente(payload.metodo_pago));
    var loteriaTxt = (state.config && (state.config.loteria || state.config.nombre_loteria)) || 'CHONTICO DIA';
    var rawFechaSorteo = state.config && state.config.fecha_sorteo;
    var fechaSorteoTxt = rawFechaSorteo ? formatFechaTexto(rawFechaSorteo) : '1 de oct de 2026';
    var rawPremio = (state.config && (state.config.premio_titulo || state.config.premio));
    var premioTxt = (rawPremio && String(rawPremio).trim() !== '0') ? String(rawPremio).trim() : 'Premio Oficial';

    if (els.ticketNombre) els.ticketNombre.textContent = payload.nombre;
    if (els.ticketTelefono) els.ticketTelefono.textContent = payload.telefono;
    if (els.ticketRef) {
      if (esGratis) {
        els.ticketRef.innerHTML = '<span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center text-xs"><i class="fas fa-gift mr-1 text-emerald-500"></i>GRATIS</span>';
      } else if (esPendiente) {
        els.ticketRef.innerHTML = '<span class="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center text-xs"><i class="fas fa-clock mr-1 text-amber-500"></i>Pendiente</span>';
      } else {
        els.ticketRef.textContent = payload.referencia_pago;
      }
    }
    if (els.ticketFecha) els.ticketFecha.textContent = fechaActual;
    if (els.ticketTotal) els.ticketTotal.textContent = precioUnit === 0 ? 'GRATIS ($0)' : formatMoney(total);
    if (els.ticketCodigo) els.ticketCodigo.textContent = 'TIQUETE Nº ' + codigoTkt;
    if (els.ticketLoteria) els.ticketLoteria.textContent = loteriaTxt;
    if (els.ticketFechaSorteo) els.ticketFechaSorteo.textContent = fechaSorteoTxt;
    if (els.ticketPremioTxt) els.ticketPremioTxt.textContent = 'Premio: ' + premioTxt;
    if (els.ticketLogoImg && window.MAXRF_LOGO_DATA_URI) {
      els.ticketLogoImg.src = window.MAXRF_LOGO_DATA_URI;
    }

    if (els.ticketNumerosContainer) {
      els.ticketNumerosContainer.innerHTML = '';
      ordenados.forEach(function (num) {
        var badge = document.createElement('span');
        badge.className = 'px-3.5 py-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-base sm:text-lg rounded-xl shadow-sm tracking-wide';
        badge.textContent = num;
        els.ticketNumerosContainer.appendChild(badge);
      });
    }
  }

  // -------------------------------------------------------------------
  // EMISIÓN Y CAPTURA VISUAL DE TIQUETE DIGITAL
  // -------------------------------------------------------------------
  function emitirTiqueteDigital(payload, res) {
    var ordenados = state.seleccionados.slice().sort();
    var precioUnit = getPrecioNumero();
    var total = ordenados.length * precioUnit;
    var fechaActual = new Date().toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    var codigoTkt = payload.codigo_tiquete || (res.ticket || ('MAXRF-' + Math.floor(100000 + Math.random() * 900000)));
    var loteriaTxt = (state.config && (state.config.loteria || state.config.nombre_loteria)) || 'CHONTICO DIA';
    var rawFechaSorteo = state.config && state.config.fecha_sorteo;
    var fechaSorteoTxt = rawFechaSorteo ? formatFechaTexto(rawFechaSorteo) : '1 de oct de 2026';
    var rawPremio = (state.config && (state.config.premio_titulo || state.config.premio));
    var premioTxt = (rawPremio && String(rawPremio).trim() !== '0') ? String(rawPremio).trim() : 'Premio Oficial';

    // Actualizar elementos en DOM
    actualizarDatosTiqueteDOM(payload, codigoTkt);

    // Guardar último tiquete para reenvío de correo, WhatsApp e impresión
    state.ultimoTiquete = {
      payload: payload,
      res: res,
      codigoTkt: codigoTkt,
      total: total,
      ordenados: ordenados,
      fechaActual: fechaActual,
      fechaSorteoTxt: fechaSorteoTxt,
      loteriaTxt: loteriaTxt,
      premioTxt: premioTxt,
      tiqueteUrl: res.tiquete_url || ''
    };

    // Configurar estado del correo
    if (payload.enviar_correo && payload.correo) {
      if (els.boxCorreoStatus) {
        els.boxCorreoStatus.classList.remove('hidden');
        if (els.txtCorreoNotif) els.txtCorreoNotif.textContent = payload.correo;
      }
      if (els.btnEnviarCorreoText) {
        els.btnEnviarCorreoText.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i> Generando copia visual...';
      }
    } else {
      if (els.boxCorreoStatus) {
        els.boxCorreoStatus.classList.add('hidden');
      }
      if (els.btnEnviarCorreoText) {
        els.btnEnviarCorreoText.innerHTML = '<i class="fas fa-envelope mr-1"></i> Enviar a mi correo';
      }
    }

    // Configurar botón de WhatsApp para que vaya DIRECTO al WhatsApp del cliente
    var telCliente = (payload.telefono || '').trim();
    if (els.btnWaConfirmarText) {
      els.btnWaConfirmarText.textContent = telCliente
        ? 'Enviar Tiquete con Imagen al WhatsApp del Cliente (' + telCliente + ')'
        : 'Enviar Tiquete con Imagen al WhatsApp del Cliente';
    }

    // Enlace opcional de copia administrativa a MaxRF
    if (els.btnWaCopiaSoporte) {
      var waSoporte = (state.config && state.config.whatsapp_contacto ? String(state.config.whatsapp_contacto) : '573188178457').replace(/\D/g, '');
      var msgSoporte = '¡Hola Soporte MaxRF! Registro de venta tiquete ' + codigoTkt + ' para ' + payload.nombre + ' (' + (payload.telefono || 'Sin tel') + ') con números: [' + ordenados.join(', ') + ']. Total: ' + formatMoney(total);
      els.btnWaCopiaSoporte.href = 'https://wa.me/' + waSoporte + '?text=' + encodeURIComponent(msgSoporte);
      els.btnWaCopiaSoporte.classList.remove('hidden');
    }

    // Generar captura gráfica visual del tiquete para emitir al correo y WhatsApp
    setTimeout(function () {
      generarCapturaTiquete(function (dataUrl, blob) {
        if (payload.enviar_correo && payload.correo) {
          if (els.btnEnviarCorreoText) {
            els.btnEnviarCorreoText.innerHTML = '<i class="fas fa-check mr-1 text-emerald-400"></i> Copia visual enviada';
          }
          window.RifaAPI.enviarCorreo({
            correo: payload.correo,
            nombre: payload.nombre,
            telefono: payload.telefono,
            codigo_tiquete: codigoTkt,
            numeros: ordenados,
            total: total,
            metodo_pago: payload.metodo_pago,
            referencia_pago: payload.referencia_pago,
            loteria: loteriaTxt,
            fecha: fechaActual,
            tiquete_imagen_base64: dataUrl
          });
        }
      });
    }, 200);
  }

  // Formatea el teléfono para WhatsApp (añade prefijo 57 a celulares de Colombia de 10 dígitos)
  function formatearTelefonoWhatsApp(tel) {
    if (!tel) return '';
    var clean = String(tel).replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 10 && clean.charAt(0) === '3') {
      return '57' + clean;
    }
    return clean;
  }

  // Captura gráfica de alta resolución del elemento #ticket-participacion
  function generarCapturaTiquete(callback) {
    var ticketEl = document.getElementById('ticket-participacion');
    if (!ticketEl) {
      if (callback) callback(null, null);
      return;
    }

    var ticketLogo = document.getElementById('ticket-logo-img');
    if (ticketLogo && window.MAXRF_LOGO_DATA_URI) {
      ticketLogo.src = window.MAXRF_LOGO_DATA_URI;
    }

    function responderConCanvas(canvas) {
      try {
        var dataUrl = canvas.toDataURL('image/png');
        state.ultimoTiqueteDataUrl = dataUrl;
        canvas.toBlob(function (blob) {
          state.ultimoTiqueteBlob = blob;
          if (callback) callback(dataUrl, blob);
        }, 'image/png');
      } catch (eCanvas) {
        console.warn('Canvas toDataURL falló por seguridad, usando canvas 2D fallback:', eCanvas);
        generarTiqueteCanvas2D(callback);
      }
    }

    if (typeof window.html2canvas === 'function') {
      window.html2canvas(ticketEl, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false
      }).then(function (canvas) {
        responderConCanvas(canvas);
      }).catch(function (err) {
        console.warn('html2canvas falló, recurriendo a canvas 2D directo:', err);
        generarTiqueteCanvas2D(callback);
      });
    } else {
      generarTiqueteCanvas2D(callback);
    }
  }

  // Generador gráfico 2D nativo ultrarrápido (100% inmune a restricciones de CORS / file://)
  function generarTiqueteCanvas2D(callback) {
    try {
      var tkt = state.ultimoTiquete || {};
      var payload = tkt.payload || {};
      var ordenados = tkt.ordenados || state.seleccionados.slice().sort();
      var codigoTkt = tkt.codigoTkt || 'MAXRF-000000';
      var titular = payload.nombre || 'Participante';
      var tel = payload.telefono || '—';
      var total = tkt.total !== undefined ? tkt.total : (ordenados.length * getPrecioNumero());
      var ref = Number(total) === 0 ? 'GRATIS' : (payload.referencia_pago || 'Pendiente');
      var fechaEmision = tkt.fechaActual || new Date().toLocaleDateString('es-CO');
      var loteria = tkt.loteriaTxt || 'CHONTICO DIA';
      var fechaSorteo = tkt.fechaSorteoTxt || formatFechaTexto((state.config && state.config.fecha_sorteo) || '2026-10-01');
      var premio = tkt.premioTxt || (state.config && (state.config.premio_titulo || state.config.premio)) || 'Premio Especial';
      if (!premio || String(premio).trim() === '0') premio = 'Premio Especial';

      var W = 840;
      var H = 760;
      var canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');

      // Fondo blanco del tiquete
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Borde exterior sutil
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, W - 2, H - 2);

      // Franja superior / Cabecera
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, W, 100);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 100);
      ctx.lineTo(W, 100);
      ctx.stroke();

      // Logo / Ícono DinamicaMaxRF
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(30, 20, 60, 60, 14); else ctx.rect(30, 20, 60, 60);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MRF', 60, 57);

      // Título Marca
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('DinamicaMaxRF', 105, 52);
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('TIQUETE OFICIAL DE RIFA', 105, 72);

      // Badge Estado "● RESERVADO"
      ctx.fillStyle = '#ecfdf5';
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(W - 190, 32, 160, 36, 18); else ctx.rect(W - 190, 32, 160, 36);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('● RESERVADO', W - 110, 56);

      // Cuadro de datos del participante
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(30, 120, W - 60, 140, 16); else ctx.rect(30, 120, W - 60, 140);
      ctx.fill();
      ctx.stroke();

      // Fila 1: Titular y Teléfono
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('TITULAR', 50, 150);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(titular, 50, 178);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('WHATSAPP / TEL', W - 50, 150);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(tel, W - 50, 178);

      // Línea divisoria en datos
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(50, 195);
      ctx.lineTo(W - 50, 195);
      ctx.stroke();

      // Fila 2: Referencia y Fecha
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('REFERENCIA PAGO', 50, 220);
      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(ref, 50, 245);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('FECHA Y HORA', W - 50, 220);
      ctx.fillStyle = '#334155';
      ctx.font = '600 15px sans-serif';
      ctx.fillText(fechaEmision, W - 50, 245);

      // Caja de Números de la Suerte
      ctx.fillStyle = '#eef2ff';
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(30, 280, W - 60, 360, 20); else ctx.rect(30, 280, W - 60, 360);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('TUS NÚMEROS DE LA SUERTE', W / 2, 315);

      // Dibujar badges de números
      var pillW = 75;
      var pillH = 65;
      var gap = 16;
      var totalW = ordenados.length * pillW + (ordenados.length - 1) * gap;
      var startX = Math.max(50, (W - totalW) / 2);
      var currentX = startX;
      var currentY = 345;

      ordenados.forEach(function (n) {
        if (currentX + pillW > W - 50) {
          currentX = startX;
          currentY += pillH + 12;
        }
        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(currentX, currentY, pillW, pillH, 16); else ctx.rect(currentX, currentY, pillW, pillH);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n, currentX + pillW / 2, currentY + pillH / 2 + 10);
        currentX += pillW + gap;
      });

      // Línea divisoria en caja de números
      ctx.strokeStyle = '#c7d2fe';
      ctx.beginPath();
      ctx.moveTo(50, 560);
      ctx.lineTo(W - 50, 560);
      ctx.stroke();

      // Total a pagar
      ctx.textAlign = 'left';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Total a pagar: ', 50, 595);
      var totalTxt = total === 0 ? 'GRATIS ($0)' : ('$' + total.toLocaleString('es-CO') + ' COP');
      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(totalTxt, 160, 597);

      // Lotería y Fecha del Sorteo
      ctx.textAlign = 'right';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Juega: ' + loteria, W - 50, 588);
      ctx.fillStyle = '#4338ca';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Sorteo: ' + fechaSorteo, W - 50, 612);

      // Pie del Tiquete
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(30, 665);
      ctx.lineTo(W - 30, 665);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('TIQUETE Nº ' + codigoTkt, 30, 705);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Premio: ' + premio, W - 30, 705);

      var dataUrl = canvas.toDataURL('image/png');
      state.ultimoTiqueteDataUrl = dataUrl;
      canvas.toBlob(function (blob) {
        state.ultimoTiqueteBlob = blob;
        if (callback) callback(dataUrl, blob);
      }, 'image/png');
    } catch (e) {
      console.error('Error fatal generando tiquete 2D:', e);
      if (callback) callback(null, null);
    }
  }

  // Compartir Tiquete Oficial por WhatsApp al cliente con copia visual (imagen)
  function compartirTiqueteWhatsApp() {
    if (!state.ultimoTiquete) return;
    var tkt = state.ultimoTiquete;
    var codigoTkt = tkt.codigoTkt;
    var nombre = tkt.payload.nombre;
    var ordenados = tkt.ordenados;
    var total = tkt.total;
    var metodo = tkt.payload.metodo_pago;
    var ref = tkt.payload.referencia_pago;
    var esGratis = (Number(total) === 0);
    var esPendiente = !esGratis && (esValorPendiente(ref) || esValorPendiente(metodo));
    var loteriaTxt = tkt.loteriaTxt || (state.config && (state.config.loteria || state.config.nombre_loteria)) || 'CHONTICO NOCHE';

    // WhatsApp DESTINO: Teléfono del CLIENTE que se registró en el formulario
    var telCliente = (tkt.payload && tkt.payload.telefono ? String(tkt.payload.telefono) : '').trim();
    var cleanWa = formatearTelefonoWhatsApp(telCliente);

    // Fallback de seguridad si no hubiera teléfono del cliente
    if (!cleanWa) {
      var waDefault = state.config && state.config.whatsapp_contacto ? String(state.config.whatsapp_contacto) : '573188178457';
      cleanWa = formatearTelefonoWhatsApp(waDefault);
    }

    // Mensaje dirigido AL CLIENTE con todos sus datos oficiales
    var waMsg = '¡Hola ' + nombre + '! 🍀 Aquí tienes tu Tiquete Oficial de Dinámica MaxRF:\n\n' +
      '🎟️ Tiquete Nº: ' + codigoTkt + '\n' +
      '🔢 Tus Números: [' + ordenados.join(', ') + ']\n' +
      '💰 Total: ' + (esGratis ? 'GRATIS ($0)' : formatMoney(total)) + '\n' +
      '🎰 Lotería: ' + loteriaTxt + '\n' +
      '📅 Fecha: ' + tkt.fechaActual + '\n' +
      '💳 Método / Ref: ' + (esGratis ? 'Gratis / Promoción (GRATIS)' : (metodo + ' (' + ref + ')')) + '\n\n' +
      (esGratis
        ? '✅ Estado: RESERVADO OFICIALMENTE (100% GRATIS)\n\n'
        : (esPendiente
          ? '⚠️ Estado: PAGO PENDIENTE\nPor favor envía el comprobante de pago por este medio para confirmar tus números definitivamente.\n\n'
          : '✅ Estado: RESERVADO OFICIALMENTE\n\n')) +
      '📸 Te adjunto la copia visual oficial de tu tiquete para garantizar tus números reservados. ¡Muchos éxitos en el sorteo!';

    if (tkt.tiqueteUrl) {
      waMsg += '\n\n🔗 Ver tu tiquete oficial en línea:\n' + tkt.tiqueteUrl;
    }

    var waUrl = 'https://wa.me/' + cleanWa + '?text=' + encodeURIComponent(waMsg);

    function proceder(blob) {
      var fileName = 'Tiquete_' + codigoTkt + '.png';

      // 1. Web Share API nativa con archivo (Soportado en navegadores móviles Android/iOS)
      if (blob && navigator.canShare) {
        try {
          var file = new File([blob], fileName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            navigator.share({
              files: [file],
              title: 'Tiquete Oficial ' + codigoTkt,
              text: waMsg
            }).catch(function (shareErr) {
              if (shareErr.name !== 'AbortError') {
                abrirWhatsAppFallback(blob, fileName, waUrl);
              }
            });
            return;
          }
        } catch (e) {
          console.warn('Web Share API error:', e);
        }
      }

      // 2. Fallback de Escritorio: descargar tiquete + copiar al portapapeles + abrir WhatsApp
      abrirWhatsAppFallback(blob, fileName, waUrl);
    }

    if (state.ultimoTiqueteBlob) {
      proceder(state.ultimoTiqueteBlob);
    } else {
      mostrarAvisoToast('📸 Preparando captura visual del tiquete...');
      generarCapturaTiquete(function (dataUrl, blob) {
        proceder(blob);
      });
    }
  }

  function abrirWhatsAppFallback(blob, fileName, waUrl) {
    // Descarga automática de la imagen para que el usuario la tenga de inmediato
    if (blob) {
      descargarBlob(blob, fileName);
    }
    // Intentar copiar al portapapeles para pegar con Ctrl+V directo en WhatsApp
    copiarImagenAlPortapapeles(blob, false);

    mostrarAvisoToast('✅ ¡Tiquete visual listo! En WhatsApp solo presiona Ctrl + V para adjuntarlo.');
    setTimeout(function () {
      window.open(waUrl, '_blank');
    }, 400);
  }

  // Descarga manual de imagen del tiquete
  function descargarImagenTiquete() {
    var codigoTkt = state.ultimoTiquete ? state.ultimoTiquete.codigoTkt : 'MAXRF';
    var fileName = 'Tiquete_' + codigoTkt + '.png';

    if (state.ultimoTiqueteBlob) {
      descargarBlob(state.ultimoTiqueteBlob, fileName);
      mostrarAvisoToast('✅ Imagen del tiquete descargada con éxito.');
    } else {
      mostrarAvisoToast('📸 Generando imagen del tiquete...');
      generarCapturaTiquete(function (dataUrl, blob) {
        if (blob) {
          descargarBlob(blob, fileName);
          mostrarAvisoToast('✅ Imagen del tiquete descargada con éxito.');
        } else {
          mostrarAvisoToast('⚠️ No se pudo generar la imagen.');
        }
      });
    }
  }

  function descargarBlob(blob, fileName) {
    try {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    } catch (e) {
      console.warn('Error al descargar blob:', e);
    }
  }

  // Copia de imagen al portapapeles
  function copiarImagenTiquete(mostrarToast) {
    if (state.ultimoTiqueteBlob) {
      copiarImagenAlPortapapeles(state.ultimoTiqueteBlob, mostrarToast);
    } else {
      if (mostrarToast) mostrarAvisoToast('📸 Generando imagen para copiar...');
      generarCapturaTiquete(function (dataUrl, blob) {
        if (blob) {
          copiarImagenAlPortapapeles(blob, mostrarToast);
        } else if (mostrarToast) {
          mostrarAvisoToast('⚠️ No fue posible copiar la imagen.');
        }
      });
    }
  }

  function copiarImagenAlPortapapeles(blob, mostrarToast) {
    if (!blob || !navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
      if (mostrarToast) mostrarAvisoToast('ℹ️ Copia no soportada en este navegador. Puedes descargarla.');
      return;
    }
    try {
      var item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]).then(function () {
        if (mostrarToast) mostrarAvisoToast('📋 ¡Imagen del tiquete copiada al portapapeles!');
      }).catch(function (err) {
        console.warn('ClipboardItem error:', err);
        if (mostrarToast) mostrarAvisoToast('ℹ️ Puedes descargar la imagen con el botón correspondiente.');
      });
    } catch (e) {
      console.warn('Clipboard error:', e);
    }
  }

  // Aviso flotante / Toast informativo
  function mostrarAvisoToast(mensaje) {
    if (!els.toastTiqueteAviso) return;
    els.toastTiqueteAviso.textContent = mensaje;
    els.toastTiqueteAviso.classList.remove('hidden');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      if (els.toastTiqueteAviso) els.toastTiqueteAviso.classList.add('hidden');
    }, 4500);
  }

  // Reenvío o envío manual al correo con copia visual
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
      els.btnEnviarCorreoText.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-1"></i> Enviando copia visual...';
    }

    function dispararEnvio(dataUrl) {
      window.RifaAPI.enviarCorreo({
        correo: correo,
        nombre: tkt.payload.nombre,
        telefono: tkt.payload.telefono,
        codigo_tiquete: tkt.codigoTkt,
        numeros: tkt.ordenados,
        total: tkt.total,
        metodo_pago: tkt.payload.metodo_pago,
        referencia_pago: tkt.payload.referencia_pago,
        loteria: tkt.loteriaTxt,
        fecha: tkt.fechaActual,
        tiquete_imagen_base64: dataUrl || state.ultimoTiqueteDataUrl || null
      }).then(function () {
        if (els.btnEnviarCorreoModal) els.btnEnviarCorreoModal.disabled = false;
        if (els.btnEnviarCorreoText) {
          els.btnEnviarCorreoText.innerHTML = '<i class="fas fa-check mr-1 text-emerald-400"></i> ¡Copia visual enviada!';
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

    if (state.ultimoTiqueteDataUrl) {
      dispararEnvio(state.ultimoTiqueteDataUrl);
    } else {
      generarCapturaTiquete(function (dataUrl) {
        dispararEnvio(dataUrl);
      });
    }
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
    state.adminLogged = false;
    sessionStorage.removeItem('maxrf_admin_logged');
    if (els.adminAuthError) els.adminAuthError.classList.add('hidden');
    if (els.adminSaveStatus) els.adminSaveStatus.classList.add('hidden');
  }

  function mostrarAuthAdmin() {
    if (els.adminAuthBox) els.adminAuthBox.classList.remove('hidden');
    if (els.adminNavBar) els.adminNavBar.classList.add('hidden');
    if (els.formAdminConfig) els.formAdminConfig.classList.add('hidden');
    if (els.adminTiquetesBox) els.adminTiquetesBox.classList.add('hidden');
    if (els.inputAdminEmail && !els.inputAdminEmail.value) {
      els.inputAdminEmail.value = 'maxrf2025@gmail.com';
    }
    if (els.inputAdminPin) {
      els.inputAdminPin.value = '';
      setTimeout(function () { els.inputAdminPin.focus(); }, 150);
    }
    if (els.adminAuthError) els.adminAuthError.classList.add('hidden');
  }

  function mostrarFormularioAdmin() {
    if (els.adminAuthBox) els.adminAuthBox.classList.add('hidden');
    if (els.adminNavBar) els.adminNavBar.classList.remove('hidden');

    var c = state.config || {};
    var f = els.formAdminConfig;
    if (f) {
      if (f.elements['premio_titulo']) f.elements['premio_titulo'].value = c.premio_titulo || c.premio || '$80.000';
      if (f.elements['premio_badge']) f.elements['premio_badge'].value = c.premio_badge || 'PREMIO ESPECIAL';
      if (f.elements['premio_descripcion']) {
        var domDesc = els.premioDetalle ? els.premioDetalle.textContent.trim() : '';
        f.elements['premio_descripcion'].value = c.premio_descripcion || c.descripcion || c.premio_detalle || domDesc || '';
      }
      if (f.elements['premio_btn_texto']) {
        f.elements['premio_btn_texto'].value = c.premio_btn_texto || '¡Elegir número y participar!';
      }
      if (f.elements['premio_categoria']) {
        f.elements['premio_categoria'].value = c.premio_categoria || '';
      }
      if (f.elements['premio_card_titulo']) {
        f.elements['premio_card_titulo'].value = c.premio_card_titulo || '';
      }
      if (f.elements['premio_card_desc']) {
        f.elements['premio_card_desc'].value = c.premio_card_desc || '';
      }
      if (f.elements['min_numeros']) {
        f.elements['min_numeros'].value = getMinNumeros();
      }
      if (f.elements['max_numeros']) {
        f.elements['max_numeros'].value = getMaxNumeros();
      }
      if (f.elements['precio_numero']) {
        f.elements['precio_numero'].value = getPrecioNumero();
      }
      if (f.elements['fecha_sorteo']) {
        var rawF = String(c.fecha_sorteo || '').trim();
        var mYMD = rawF.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (mYMD) {
          var y = mYMD[1];
          var m = String(mYMD[2]).padStart(2, '0');
          var d = String(mYMD[3]).padStart(2, '0');
          f.elements['fecha_sorteo'].value = y + '-' + m + '-' + d;
        } else {
          f.elements['fecha_sorteo'].value = rawF || '2026-10-01';
        }
      }
      if (f.elements['loteria']) f.elements['loteria'].value = c.loteria || 'CHONTICO DIA';
      if (f.elements['premio_img_url']) f.elements['premio_img_url'].value = c.premio_img_url || './img/premio.png';
      if (f.elements['metodos_pago']) f.elements['metodos_pago'].value = c.metodos_pago || 'Nequi 3188178457';
    }

    switchAdminTab(state.adminActiveTab || 'config');
    renderListaTiquetesAdmin();
  }

  function switchAdminTab(tabName) {
    state.adminActiveTab = tabName;
    if (tabName === 'config') {
      if (els.tabBtnConfig) {
        els.tabBtnConfig.className = 'px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-[11px] sm:text-sm font-bold border-b-2 border-purple-600 text-purple-700 bg-white shadow-sm flex items-center justify-center gap-1.5 transition text-center';
      }
      if (els.tabBtnTiquetes) {
        els.tabBtnTiquetes.className = 'px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-[11px] sm:text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-purple-700 hover:bg-white/60 flex items-center justify-center gap-1.5 transition text-center';
      }
      if (els.formAdminConfig) els.formAdminConfig.classList.remove('hidden');
      if (els.adminTiquetesBox) els.adminTiquetesBox.classList.add('hidden');
    } else {
      if (els.tabBtnTiquetes) {
        els.tabBtnTiquetes.className = 'px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-[11px] sm:text-sm font-bold border-b-2 border-purple-600 text-purple-700 bg-white shadow-sm flex items-center justify-center gap-1.5 transition text-center';
      }
      if (els.tabBtnConfig) {
        els.tabBtnConfig.className = 'px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-t-xl text-[11px] sm:text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-purple-700 hover:bg-white/60 flex items-center justify-center gap-1.5 transition text-center';
      }
      if (els.formAdminConfig) els.formAdminConfig.classList.add('hidden');
      if (els.adminTiquetesBox) els.adminTiquetesBox.classList.remove('hidden');
      renderListaTiquetesAdmin();
    }
  }

  function setAdminFiltro(filtroKey) {
    state.adminTktFiltro = filtroKey || 'todos';
    var filterBtns = document.querySelectorAll('.btn-filter-tkt');
    filterBtns.forEach(function (b) {
      var f = b.getAttribute('data-filter') || 'todos';
      var isCurrent = (f === state.adminTktFiltro);
      b.className = isCurrent
        ? 'btn-filter-tkt px-3 py-1 rounded-lg font-bold bg-purple-600 text-white shadow-sm transition'
        : 'btn-filter-tkt px-3 py-1 rounded-lg font-semibold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition';
    });
    renderListaTiquetesAdmin();
  }

  function renderListaTiquetesAdmin() {
    var participantes = state.participantes || [];
    var totalCount = participantes.length;

    var countPendientes = 0;
    var countPagados = 0;
    var countRechazados = 0;

    participantes.forEach(function (p) {
      var st = String(p.estado || '').toLowerCase();
      if (st.indexOf('pag') !== -1 || st.indexOf('conf') !== -1) {
        countPagados++;
      } else if (st.indexOf('rech') !== -1 || st.indexOf('canc') !== -1) {
        countRechazados++;
      } else {
        countPendientes++;
      }
    });

    if (els.badgeTotalTiquetes) els.badgeTotalTiquetes.textContent = totalCount;
    if (els.cntFilterTodos) els.cntFilterTodos.textContent = totalCount;
    if (els.cntFilterPendientes) els.cntFilterPendientes.textContent = countPendientes;
    if (els.cntFilterPagados) els.cntFilterPagados.textContent = countPagados;
    if (els.cntFilterRechazados) els.cntFilterRechazados.textContent = countRechazados;

    var filtro = state.adminTktFiltro || 'todos';
    var query = (state.adminTktSearchQuery || '').trim().toLowerCase();

    var filtrados = participantes.filter(function (p) {
      var st = String(p.estado || '').toLowerCase();
      var esPag = st.indexOf('pag') !== -1 || st.indexOf('conf') !== -1;
      var esRech = st.indexOf('rech') !== -1 || st.indexOf('canc') !== -1;
      var esPend = !esPag && !esRech;

      if (filtro === 'pendiente' && !esPend) return false;
      if (filtro === 'pagado' && !esPag) return false;
      if (filtro === 'rechazado' && !esRech) return false;

      if (query) {
        var tktCode = String(p.ticket || p.codigo_tiquete || '').toLowerCase();
        var tel = String(p.telefono || '').toLowerCase();
        var nom = String(p.nombre || '').toLowerCase();
        var nums = (Array.isArray(p.numeros) ? p.numeros.join(' ') : String(p.numeros || '')).toLowerCase();
        var ref = String(p.referencia_pago || '').toLowerCase();

        var match = (tktCode.indexOf(query) !== -1) ||
                    (tel.indexOf(query) !== -1) ||
                    (nom.indexOf(query) !== -1) ||
                    (nums.indexOf(query) !== -1) ||
                    (ref.indexOf(query) !== -1);
        if (!match) return false;
      }

      return true;
    });

    if (els.txtContadorResultados) {
      els.txtContadorResultados.textContent = 'Mostrando ' + filtrados.length + ' de ' + totalCount + ' tiquetes';
    }

    if (!els.listaTiquetesContainer) return;
    els.listaTiquetesContainer.innerHTML = '';

    if (filtrados.length === 0) {
      els.listaTiquetesContainer.innerHTML =
        '<div class="text-center py-10 px-4 bg-slate-50 border border-slate-200/80 rounded-2xl">' +
        '<i class="fas fa-ticket text-3xl text-slate-300 mb-2"></i>' +
        '<p class="text-xs sm:text-sm font-bold text-slate-700">No se encontraron tiquetes registrados</p>' +
        '<p class="text-[11px] text-slate-400 mt-0.5">' + (query ? 'Prueba con otro término de búsqueda o limpia el filtro.' : 'Las reservas registradas aparecerán aquí automáticamente.') + '</p>' +
        '</div>';
      return;
    }

    filtrados.forEach(function (p) {
      var tktCode = String(p.ticket || p.codigo_tiquete || 'MAXRF-000000');
      var st = String(p.estado || '').toLowerCase();
      var esPag = st.indexOf('pag') !== -1 || st.indexOf('conf') !== -1;
      var esRech = st.indexOf('rech') !== -1 || st.indexOf('canc') !== -1;
      var badgeCls = 'bg-amber-100 text-amber-800 border-amber-300';
      var badgeTxt = '● PENDIENTE';
      var borderCls = 'border-amber-200/80';

      if (esPag) {
        badgeCls = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        badgeTxt = '● PAGADO Y CONFIRMADO';
        borderCls = 'border-emerald-200/80';
      } else if (esRech) {
        badgeCls = 'bg-rose-100 text-rose-800 border-rose-300';
        badgeTxt = '● RECHAZADO';
        borderCls = 'border-rose-200/80';
      }

      var arrNums = Array.isArray(p.numeros) ? p.numeros : String(p.numeros || '').split(/[,;\s]+/).filter(Boolean);
      var numsBadges = arrNums.map(function (n) {
        return '<span class="px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">' + n + '</span>';
      }).join(' ');

      var item = document.createElement('div');
      item.className = 'p-3.5 sm:p-4 rounded-2xl border transition bg-white hover:border-purple-300 hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ' + borderCls;
      item.innerHTML =
        '<div class="space-y-1.5 flex-1">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<span class="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">' + tktCode + '</span>' +
            '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ' + badgeCls + '">' + badgeTxt + '</span>' +
            '<span class="text-[11px] text-slate-400 font-semibold">' + (p.fecha ? String(p.fecha).split('T')[0] : '') + '</span>' +
          '</div>' +
          '<div class="flex items-center gap-3 text-xs flex-wrap">' +
            '<span class="font-bold text-slate-900 text-sm"><i class="fas fa-user text-purple-600 mr-1"></i>' + (p.nombre || 'Participante') + '</span>' +
            '<span class="text-slate-600 font-medium"><i class="fas fa-phone text-indigo-500 mr-1"></i>' + (p.telefono || 'Sin tel') + '</span>' +
            '<span class="text-slate-500 text-[11px]"><i class="fas fa-receipt text-slate-400 mr-1"></i>Ref: <strong>' + (p.referencia_pago || '—') + '</strong></span>' +
          '</div>' +
          '<div class="flex items-center gap-2 flex-wrap pt-0.5">' +
            '<span class="text-[10px] font-bold uppercase text-slate-400">Números:</span>' +
            '<div class="flex flex-wrap gap-1">' + numsBadges + '</div>' +
            '<span class="text-xs font-black text-indigo-600 ml-2">Total: ' + (Number(p.total) === 0 ? 'GRATIS ($0)' : formatMoney(p.total)) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-1.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">' +
          '<button type="button" class="btn-seleccionar-tkt px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-bold text-xs border border-purple-200 transition shadow-sm flex items-center gap-1.5" data-ticket="' + tktCode + '">' +
            '<i class="fas fa-pen-to-square"></i>' +
            '<span>Gestionar / Soporte</span>' +
          '</button>' +
          '<button type="button" class="btn-eliminar-tkt-directo p-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 transition shadow-xs flex items-center justify-center" data-ticket="' + tktCode + '" title="Eliminar tiquete y liberar números">' +
            '<i class="fas fa-trash-can text-xs"></i>' +
          '</button>' +
        '</div>';

      els.listaTiquetesContainer.appendChild(item);
    });
  }

  function seleccionarTiqueteAdmin(tkt) {
    state.adminSelectedTiquete = tkt;
    if (!els.adminTiqueteDetalle) return;

    var tktCode = String(tkt.ticket || tkt.codigo_tiquete || 'MAXRF-000000');
    var st = String(tkt.estado || '').toLowerCase();
    var esPag = st.indexOf('pag') !== -1 || st.indexOf('conf') !== -1;
    var esRech = st.indexOf('rech') !== -1 || st.indexOf('canc') !== -1;

    if (els.detTicketCodigo) els.detTicketCodigo.textContent = tktCode;
    if (els.detTicketNombre) els.detTicketNombre.textContent = tkt.nombre || '—';
    if (els.detTicketTel) els.detTicketTel.textContent = tkt.telefono || '—';
    if (els.detTicketWaLink) {
      els.detTicketWaLink.href = 'https://wa.me/' + formatearTelefonoWhatsApp(tkt.telefono);
    }
    var esGratisTkt = Number(tkt.total) === 0;
    if (els.detTicketTotal) els.detTicketTotal.textContent = esGratisTkt ? 'GRATIS ($0)' : formatMoney(tkt.total);
    if (els.detTicketMetodoRef) {
      els.detTicketMetodoRef.textContent = esGratisTkt
        ? 'Gratis / Promoción — GRATIS'
        : ((tkt.metodo_pago || 'Nequi') + ' — ' + (tkt.referencia_pago || 'Pendiente'));
    }
    if (els.detTicketFecha) {
      els.detTicketFecha.textContent = tkt.fecha ? String(tkt.fecha) : new Date().toLocaleDateString('es-CO');
    }

    if (els.detTicketEstadoBadge) {
      if (esPag) {
        els.detTicketEstadoBadge.className = 'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300';
        els.detTicketEstadoBadge.textContent = '● Pagado y Confirmado';
      } else if (esRech) {
        els.detTicketEstadoBadge.className = 'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300';
        els.detTicketEstadoBadge.textContent = '● Rechazado';
      } else {
        els.detTicketEstadoBadge.className = 'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300';
        els.detTicketEstadoBadge.textContent = '● Pendiente';
      }
    }

    if (els.detTicketNumeros) {
      els.detTicketNumeros.innerHTML = '';
      var arrNums = Array.isArray(tkt.numeros) ? tkt.numeros : String(tkt.numeros || '').split(/[,;\s]+/).filter(Boolean);
      arrNums.forEach(function (n) {
        var sp = document.createElement('span');
        sp.className = 'px-2.5 py-1 rounded-lg bg-purple-600 text-white font-extrabold text-xs shadow-xs';
        sp.textContent = n;
        els.detTicketNumeros.appendChild(sp);
      });
    }

    var radioVal = esPag ? 'Pagado' : (esRech ? 'Rechazado' : 'Pendiente');
    var radios = document.querySelectorAll('input[name="cambio_estado_opt"]');
    radios.forEach(function (r) {
      r.checked = (r.value === radioVal);
    });

    if (els.inputRefActualizada) {
      els.inputRefActualizada.value = tkt.referencia_pago || '';
    }

    if (els.statusCambioEstado) els.statusCambioEstado.classList.add('hidden');
    if (els.boxSoporteGenerado) els.boxSoporteGenerado.classList.add('hidden');

    if (tkt.tiquete_imagen_url) {
      if (els.boxDriveLink && els.linkSoporteDrive) {
        els.linkSoporteDrive.href = tkt.tiquete_imagen_url;
        els.boxDriveLink.classList.remove('hidden');
      }
    } else if (els.boxDriveLink) {
      els.boxDriveLink.classList.add('hidden');
    }

    els.adminTiqueteDetalle.classList.remove('hidden');
    els.adminTiqueteDetalle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function ejecutarCambioEstadoTiqueteAdmin() {
    if (!state.adminSelectedTiquete) return;
    var tkt = state.adminSelectedTiquete;
    var tktCode = String(tkt.ticket || tkt.codigo_tiquete || '').trim().toUpperCase();

    var selRadio = document.querySelector('input[name="cambio_estado_opt"]:checked');
    var nuevoEstado = selRadio ? selRadio.value : 'Pagado';
    var nuevaRef = els.inputRefActualizada ? els.inputRefActualizada.value.trim() : '';
    if (!nuevaRef) {
      if (nuevoEstado === 'Pagado') nuevaRef = 'PAGADO / APROBADO';
      else if (nuevoEstado === 'Rechazado') nuevaRef = 'RECHAZADO / CANCELADO';
      else nuevaRef = 'PENDIENTE';
    }

    if (els.btnEjecutarCambioEstado) {
      els.btnEjecutarCambioEstado.disabled = true;
      els.btnEjecutarCambioEstado.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Generando nuevo soporte oficial...';
    }
    if (els.statusCambioEstado) {
      els.statusCambioEstado.className = 'p-3 rounded-xl text-xs font-bold text-center bg-indigo-50 text-indigo-700 block';
      els.statusCambioEstado.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Generando soporte gráfico y sincronizando con Google Sheets & Drive...';
    }

    // 1. Generar la nueva imagen de soporte oficial con el status actualizado
    generarSoporteCanvas2D(tkt, nuevoEstado, nuevaRef, function (dataUrl, blob) {
      state.adminUltimoSoporteDataUrl = dataUrl;

      // 2. Mostrar la previsualización del soporte
      if (els.imgSoportePreview) els.imgSoportePreview.src = dataUrl;
      if (els.boxSoporteGenerado) els.boxSoporteGenerado.classList.remove('hidden');

      var fileName = 'Soporte_' + nuevoEstado.toUpperCase() + '_' + tktCode + '.png';
      if (els.btnDescargarSoporte) {
        els.btnDescargarSoporte.href = dataUrl;
        els.btnDescargarSoporte.download = fileName;
      }

      // Preparar mensaje de WhatsApp para el cliente
      var arrNums = Array.isArray(tkt.numeros) ? tkt.numeros : String(tkt.numeros || '').split(/[,;\s]+/).filter(Boolean);
      var msgWa = '¡Hola ' + (tkt.nombre || 'Participante') + '! 🍀 Te confirmamos que tu tiquete ' + tktCode + ' para la Dinámica MaxRF ha sido actualizado a ' + (nuevoEstado === 'Pagado' ? '✅ PAGADO Y CONFIRMADO' : (nuevoEstado === 'Rechazado' ? '❌ RECHAZADO' : '⚠️ PAGO PENDIENTE')) + ' con éxito.\n\n' +
        '🎟️ Tiquete: ' + tktCode + '\n' +
        '🔢 Números: [' + arrNums.join(', ') + ']\n' +
        '💰 Total: ' + formatMoney(tkt.total) + '\n' +
        '🎰 Lotería: ' + (state.config.loteria || 'CHONTICO DIA') + '\n' +
        '🗓️ Sorteo: ' + formatFechaTexto(state.config.fecha_sorteo || '2026-10-01') + '\n' +
        '💳 Referencia: ' + nuevaRef + '\n\n' +
        (nuevoEstado === 'Pagado'
          ? '🎉 ¡Tus números ya están asegurados oficialmente para el sorteo! Te adjuntamos tu soporte digital actualizado.'
          : 'Para más información comunícate con nosotros.') + '\n\n' +
        '📸 *DinamicaMaxRF Oficial*';

      var cleanWa = formatearTelefonoWhatsApp(tkt.telefono);
      if (!cleanWa) cleanWa = formatearTelefonoWhatsApp((state.config && state.config.whatsapp_contacto) || '573188178457');
      var waUrl = 'https://wa.me/' + cleanWa + '?text=' + encodeURIComponent(msgWa);

      if (els.btnWhatsappSoporte) {
        els.btnWhatsappSoporte.href = waUrl;
        els.btnWhatsappSoporte.onclick = function (e) {
          if (blob && navigator.canShare) {
            try {
              var file = new File([blob], fileName, { type: 'image/png' });
              if (navigator.canShare({ files: [file] })) {
                e.preventDefault();
                navigator.share({
                  files: [file],
                  title: 'Soporte ' + nuevoEstado + ' ' + tktCode,
                  text: msgWa
                }).catch(function () {
                  window.open(waUrl, '_blank');
                });
                return;
              }
            } catch (errShare) {}
          }
        };
      }

      if (els.txtSoporteDriveStatus) {
        els.txtSoporteDriveStatus.textContent = 'Guardando en Google Drive...';
        els.txtSoporteDriveStatus.className = 'text-[11px] text-purple-600 font-semibold';
      }

      // 3. Enviar a Google Apps Script
      window.RifaAPI.actualizarEstadoTiquete({
        ticket: tktCode,
        codigo_tiquete: tktCode,
        nuevo_estado: nuevoEstado,
        estado: nuevoEstado,
        referencia_pago: nuevaRef,
        tiquete_imagen_base64: dataUrl
      }).then(function (res) {
        if (els.btnEjecutarCambioEstado) {
          els.btnEjecutarCambioEstado.disabled = false;
          els.btnEjecutarCambioEstado.innerHTML = '<i class="fas fa-certificate text-amber-300"></i> Actualizar Estado y Generar Nuevo Soporte Oficial';
        }

        // Actualizar datos del participante en memoria y en localStorage
        tkt.estado = nuevoEstado;
        tkt.referencia_pago = nuevaRef;
        var sincronizadoEnSheets = res && res.inSheets && res.success;

        if (res && res.tiquete_drive_url) {
          tkt.tiquete_imagen_url = res.tiquete_drive_url;
          if (els.boxDriveLink && els.linkSoporteDrive) {
            els.linkSoporteDrive.href = res.tiquete_drive_url;
            els.boxDriveLink.classList.remove('hidden');
          }
        }

        if (sincronizadoEnSheets) {
          if (els.txtSoporteDriveStatus) {
            els.txtSoporteDriveStatus.textContent = '✓ Guardado en Google Sheets y Google Drive';
            els.txtSoporteDriveStatus.className = 'text-[11px] text-emerald-600 font-bold';
          }
          if (els.statusCambioEstado) {
            els.statusCambioEstado.className = 'p-3 rounded-xl text-xs font-bold text-center bg-emerald-50 text-emerald-700 border border-emerald-200 block';
            els.statusCambioEstado.innerHTML = '<i class="fas fa-circle-check mr-1.5 text-base"></i> ¡Tiquete actualizado a <strong>' + nuevoEstado + '</strong> y sincronizado en Google Sheets y Google Drive!';
          }
          mostrarToastAlerta('Tiquete ' + tktCode + ' actualizado en Google Sheets y Drive.', 'success');
        } else {
          var detalleError = (res && res.message) ? (' (' + res.message + ')') : '';
          if (els.txtSoporteDriveStatus) {
            els.txtSoporteDriveStatus.textContent = '⚠️ Actualizado en web (Google Apps Script desactualizado)';
            els.txtSoporteDriveStatus.className = 'text-[11px] text-amber-600 font-bold';
          }
          if (els.statusCambioEstado) {
            els.statusCambioEstado.className = 'p-3 rounded-xl text-xs font-bold text-center bg-amber-50 text-amber-900 border border-amber-300 block text-left';
            els.statusCambioEstado.innerHTML = '<i class="fas fa-triangle-exclamation mr-1.5 text-amber-600 text-sm"></i> <strong>Atención:</strong> El tiquete cambió en pantalla pero <u>NO se pudo guardar en Google Sheets/Drive</u>' + detalleError + '. Para que se guarde automáticamente en la nube, debes implementar la nueva versión de <strong>Code.gs</strong> en Google Apps Script.';
          }
          mostrarToastAlerta('Actualizado en web. Para guardar en Sheet/Drive, actualiza Code.gs en Apps Script.', 'warning');
        }

        try {
          localStorage.setItem('maxrf_participantes_cache', JSON.stringify(state.participantes));
        } catch (eCache) {}

        // 4. Actualizar estado de los números en el talonario de inmediato
        var numMap = {};
        arrNums.forEach(function (n) {
          var s = String(n).trim();
          if (s.length === 1) s = '0' + s;
          numMap[s] = true;
        });

        var estadoTalonario = 'reservado';
        if (nuevoEstado === 'Pagado') estadoTalonario = 'vendido';
        else if (nuevoEstado === 'Rechazado') estadoTalonario = 'disponible';

        state.numeros.forEach(function (numObj) {
          var cur = String(numObj.numero).trim();
          if (cur.length === 1) cur = '0' + cur;
          if (numMap[cur]) {
            numObj.estado = estadoTalonario;
          }
        });

        // Actualizar vistas y ubicar en la sección correspondiente según el nuevo status
        var targetFiltro = 'todos';
        var stLower = nuevoEstado.toLowerCase();
        if (stLower.indexOf('pag') !== -1 || stLower.indexOf('conf') !== -1) {
          targetFiltro = 'pagado';
        } else if (stLower.indexOf('rech') !== -1 || stLower.indexOf('canc') !== -1) {
          targetFiltro = 'rechazado';
        } else {
          targetFiltro = 'pendiente';
        }

        renderTalonario();
        renderStats();
        setAdminFiltro(targetFiltro);

        // Actualizar badge del detalle
        if (els.detTicketEstadoBadge) {
          if (nuevoEstado === 'Pagado') {
            els.detTicketEstadoBadge.className = 'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300';
            els.detTicketEstadoBadge.textContent = '● Pagado y Confirmado';
          } else if (nuevoEstado === 'Rechazado') {
            els.detTicketEstadoBadge.className = 'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300';
            els.detTicketEstadoBadge.textContent = '● Rechazado';
          } else {
            els.detTicketEstadoBadge.className = 'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300';
            els.detTicketEstadoBadge.textContent = '● Pendiente';
          }
        }
        if (els.detTicketMetodoRef) {
          els.detTicketMetodoRef.textContent = (tkt.metodo_pago || 'Nequi') + ' — ' + nuevaRef;
        }
      });
    });
  }

  // -------------------------------------------------------------------
  // ELIMINAR TIQUETE Y LIBERAR NÚMEROS EN TALONARIO Y GOOGLE SHEETS
  // -------------------------------------------------------------------
  function eliminarTiqueteAdmin(tktCode) {
    if (!tktCode) return;
    tktCode = String(tktCode).trim().toUpperCase();

    var tkt = state.participantes.find(function (p) {
      var c = String(p.ticket || p.codigo_tiquete || '').trim().toUpperCase();
      return c === tktCode;
    });

    var arrNums = [];
    if (tkt) {
      arrNums = Array.isArray(tkt.numeros) ? tkt.numeros : String(tkt.numeros || '').split(/[,;\s]+/).filter(Boolean);
    }

    var confirmMsg = '¿Estás seguro de que deseas eliminar permanentemente el tiquete ' + tktCode + '?\n\n' +
      (arrNums.length > 0 ? ('Los números [' + arrNums.join(', ') + '] quedarán liberados inmediatamente en el talonario.') : 'Los números quedarán liberados inmediatamente.');

    if (!confirm(confirmMsg)) return;

    if (els.btnEliminarTiqueteDetalle) {
      els.btnEliminarTiqueteDetalle.disabled = true;
      els.btnEliminarTiqueteDetalle.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Eliminando y liberando...';
    }

    window.RifaAPI.eliminarTiquete({
      ticket: tktCode,
      codigo_tiquete: tktCode,
      numeros: arrNums
    }).then(function (res) {
      if (els.btnEliminarTiqueteDetalle) {
        els.btnEliminarTiqueteDetalle.disabled = false;
        els.btnEliminarTiqueteDetalle.innerHTML = '<i class="fas fa-trash-can mr-1"></i> Eliminar Tiquete y Liberar Números';
      }

      // 1. Quitar participante de state.participantes
      state.participantes = state.participantes.filter(function (p) {
        var c = String(p.ticket || p.codigo_tiquete || '').trim().toUpperCase();
        return c !== tktCode;
      });

      try {
        localStorage.setItem('maxrf_participantes_cache', JSON.stringify(state.participantes));
      } catch (eCache) {}

      // 2. Liberar números en state.numeros
      var numMap = {};
      arrNums.forEach(function (n) {
        var s = String(n).trim();
        if (s.length === 1) s = '0' + s;
        numMap[s] = true;
      });

      state.numeros.forEach(function (numObj) {
        var cur = String(numObj.numero).trim();
        if (cur.length === 1) cur = '0' + cur;
        if (numMap[cur]) {
          numObj.estado = 'disponible';
        }
      });

      // 3. Cerrar detalle si pertenecía a este tiquete
      if (state.adminSelectedTiquete) {
        var curSel = String(state.adminSelectedTiquete.ticket || state.adminSelectedTiquete.codigo_tiquete || '').trim().toUpperCase();
        if (curSel === tktCode) {
          if (els.adminTiqueteDetalle) els.adminTiqueteDetalle.classList.add('hidden');
          state.adminSelectedTiquete = null;
        }
      }

      // 4. Actualizar vistas
      renderTalonario();
      renderStats();
      renderListaTiquetesAdmin();

      var inSheets = res && res.inSheets;
      if (inSheets) {
        mostrarToastAlerta('Tiquete ' + tktCode + ' eliminado y números liberados en Google Sheets.', 'success');
      } else {
        mostrarToastAlerta('Tiquete ' + tktCode + ' eliminado y números liberados.', 'success');
      }
    }).catch(function (err) {
      if (els.btnEliminarTiqueteDetalle) {
        els.btnEliminarTiqueteDetalle.disabled = false;
        els.btnEliminarTiqueteDetalle.innerHTML = '<i class="fas fa-trash-can mr-1"></i> Eliminar Tiquete y Liberar Números';
      }
      mostrarToastAlerta('Error al eliminar tiquete: ' + (err.message || 'Intente de nuevo'), 'error');
    });
  }

  function generarSoporteCanvas2D(tkt, nuevoEstado, nuevaRef, callback) {
    try {
      var tktCode = String(tkt.ticket || tkt.codigo_tiquete || 'MAXRF-000000').toUpperCase();
      var titular = tkt.nombre || 'Participante';
      var tel = tkt.telefono || '—';
      var fechaEmision = new Date().toLocaleString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      var arrNums = Array.isArray(tkt.numeros) ? tkt.numeros : String(tkt.numeros || '').split(/[,;\s]+/).filter(Boolean);
      var ordenados = arrNums.slice().sort();
      var total = tkt.total !== undefined ? tkt.total : (ordenados.length * getPrecioNumero());
      var loteria = (state.config && (state.config.loteria || state.config.nombre_loteria)) || 'CHONTICO DIA';
      var rawFechaSorteo = state.config && state.config.fecha_sorteo;
      var fechaSorteo = rawFechaSorteo ? formatFechaTexto(rawFechaSorteo) : '1 de oct de 2026';
      var premio = (state.config && (state.config.premio_titulo || state.config.premio)) || 'Premio Especial';
      if (!premio || String(premio).trim() === '0') premio = 'Premio Especial';

      var W = 840;
      var H = 790;
      var canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');

      // Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Borde exterior
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, W - 4, H - 4);

      // Cabecera superior
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, 105);

      // Logo / Ícono DinamicaMaxRF
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(30, 20, 65, 65, 14); else ctx.rect(30, 20, 65, 65);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MRF', 62, 60);

      // Marca y Título Oficial
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('DinamicaMaxRF', 110, 52);
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('SOPORTE OFICIAL DE ESTADO Y VALIDACIÓN', 110, 75);

      // Código de tiquete en la cabecera
      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('CÓDIGO DE TIQUETE', W - 30, 45);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(tktCode, W - 30, 72);

      // ==========================================
      // BANNER PROMINENTE DEL ESTADO ACTUALIZADO
      // ==========================================
      var bannerY = 120;
      var bannerH = 75;
      var badgeBg = '#ecfdf5';
      var badgeBorder = '#10b981';
      var badgeTextColor = '#065f46';
      var statusTitle = '● PAGADO Y CONFIRMADO';
      var statusSubtitle = 'PAGO VERIFICADO - NÚMEROS ASEGURADOS OFICIALMENTE PARA EL SORTEO';

      if (nuevoEstado === 'Rechazado') {
        badgeBg = '#fff1f2';
        badgeBorder = '#f43f5e';
        badgeTextColor = '#9f1239';
        statusTitle = '● RECHAZADO / ANULADO';
        statusSubtitle = 'RESERVA CANCELADA - NÚMEROS LIBERADOS PARA OTROS PARTICIPANTES';
      } else if (nuevoEstado === 'Pendiente') {
        badgeBg = '#fffbeb';
        badgeBorder = '#f59e0b';
        badgeTextColor = '#92400e';
        statusTitle = '● PAGO PENDIENTE';
        statusSubtitle = 'RESERVA TEMPORAL - PENDIENTE POR ENVIAR COMPROBANTE DE PAGO';
      }

      ctx.fillStyle = badgeBg;
      ctx.strokeStyle = badgeBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(30, bannerY, W - 60, bannerH, 16); else ctx.rect(30, bannerY, W - 60, bannerH);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = badgeTextColor;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(statusTitle, W / 2, bannerY + 36);
      ctx.font = '600 13px sans-serif';
      ctx.fillText(statusSubtitle, W / 2, bannerY + 60);

      // ==========================================
      // CUADRO DE DATOS DEL PARTICIPANTE
      // ==========================================
      var datosY = 215;
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(30, datosY, W - 60, 150, 16); else ctx.rect(30, datosY, W - 60, 150);
      ctx.fill();
      ctx.stroke();

      // Fila 1: Titular y WhatsApp
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('TITULAR REGISTRADO', 50, datosY + 32);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(titular, 50, datosY + 58);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('WHATSAPP / TELÉFONO', W - 50, datosY + 32);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(tel, W - 50, datosY + 58);

      // Línea divisoria en datos
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(50, datosY + 76);
      ctx.lineTo(W - 50, datosY + 76);
      ctx.stroke();

      // Fila 2: Referencia y Fecha
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('REFERENCIA / NOTA DE SOPORTE', 50, datosY + 102);
      ctx.fillStyle = '#6d28d9';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(nuevaRef, 50, datosY + 128);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('FECHA DE EMISIÓN DEL SOPORTE', W - 50, datosY + 102);
      ctx.fillStyle = '#334155';
      ctx.font = '600 15px sans-serif';
      ctx.fillText(fechaEmision, W - 50, datosY + 128);

      // ==========================================
      // CAJA DE NÚMEROS DE LA SUERTE
      // ==========================================
      var numsBoxY = 385;
      ctx.fillStyle = (nuevoEstado === 'Pagado') ? '#f0fdf4' : ((nuevoEstado === 'Rechazado') ? '#fff1f2' : '#f5f3ff');
      ctx.strokeStyle = (nuevoEstado === 'Pagado') ? '#bbf7d0' : ((nuevoEstado === 'Rechazado') ? '#fecdd3' : '#ddd6fe');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(30, numsBoxY, W - 60, 260, 20); else ctx.rect(30, numsBoxY, W - 60, 260);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = (nuevoEstado === 'Pagado') ? '#15803d' : ((nuevoEstado === 'Rechazado') ? '#be123c' : '#6d28d9');
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('NÚMEROS OFICIALES ASIGNADOS', W / 2, numsBoxY + 32);

      // Badges de los números
      var pillW = 75;
      var pillH = 65;
      var gap = 16;
      var totalW = ordenados.length * pillW + (ordenados.length - 1) * gap;
      var startX = Math.max(50, (W - totalW) / 2);
      var currentX = startX;
      var currentY = numsBoxY + 50;

      ordenados.forEach(function (n) {
        if (currentX + pillW > W - 50) {
          currentX = startX;
          currentY += pillH + 12;
        }
        ctx.fillStyle = (nuevoEstado === 'Pagado') ? '#059669' : ((nuevoEstado === 'Rechazado') ? '#e11d48' : '#7c3aed');
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(currentX, currentY, pillW, pillH, 16); else ctx.rect(currentX, currentY, pillW, pillH);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n, currentX + pillW / 2, currentY + pillH / 2 + 10);
        currentX += pillW + gap;
      });

      // Línea divisoria en números
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(50, numsBoxY + 175);
      ctx.lineTo(W - 50, numsBoxY + 175);
      ctx.stroke();

      // Total y Sorteo
      ctx.textAlign = 'left';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Total registrado: ', 50, numsBoxY + 215);
      var totalTxt = total === 0 ? 'GRATIS ($0)' : ('$' + total.toLocaleString('es-CO') + ' COP');
      ctx.fillStyle = (nuevoEstado === 'Pagado') ? '#059669' : '#0f172a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(totalTxt, 185, numsBoxY + 217);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Juega: ' + loteria, W - 50, numsBoxY + 205);
      ctx.fillStyle = '#6d28d9';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Sorteo: ' + fechaSorteo, W - 50, numsBoxY + 230);

      // ==========================================
      // PIE DE PÁGINA Y SELLO DE VERIFICACIÓN
      // ==========================================
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(30, 675);
      ctx.lineTo(W - 30, 675);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('EMITIDO POR ADMINISTRACIÓN OFICIAL DINAMICAMAXRF', 30, 715);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 11px sans-serif';
      ctx.fillText('Soporte oficial de participación verificada con validez legal interna.', 30, 735);

      // Sello gráfico en pie
      ctx.textAlign = 'right';
      ctx.fillStyle = (nuevoEstado === 'Pagado') ? '#047857' : ((nuevoEstado === 'Rechazado') ? '#be123c' : '#b45309');
      ctx.font = 'bold 13px sans-serif';
      var selloTxt = (nuevoEstado === 'Pagado') ? '✓ APROBADO MAXRF' : ((nuevoEstado === 'Rechazado') ? '✕ RECHAZADO' : '⏳ PENDIENTE');
      ctx.fillText(selloTxt, W - 30, 715);
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(tktCode + ' - ' + nuevoEstado.toUpperCase(), W - 30, 735);

      var dataUrl = canvas.toDataURL('image/png');
      canvas.toBlob(function (blob) {
        if (callback) callback(dataUrl, blob);
      }, 'image/png');
    } catch (e) {
      console.error('Error fatal generando soporte 2D:', e);
      if (callback) callback(null, null);
    }
  }

  function intentarLoginAdmin(e) {
    if (e && e.preventDefault) e.preventDefault();
    var email = els.inputAdminEmail ? els.inputAdminEmail.value.trim().toLowerCase() : '';
    var pin = els.inputAdminPin ? els.inputAdminPin.value.trim() : '';

    if (!email || !pin) {
      if (els.adminAuthError) {
        els.adminAuthError.textContent = 'Por favor ingresa tu correo y contraseña de acceso.';
        els.adminAuthError.classList.remove('hidden');
      }
      return;
    }

    if (els.btnLoginAdmin) {
      els.btnLoginAdmin.disabled = true;
      els.btnLoginAdmin.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Verificando credenciales...';
    }
    if (els.adminAuthError) els.adminAuthError.classList.add('hidden');

    window.RifaAPI.loginAdmin(email, pin).then(function (res) {
      if (els.btnLoginAdmin) {
        els.btnLoginAdmin.disabled = false;
        els.btnLoginAdmin.innerHTML = '<i class="fas fa-arrow-right-to-bracket mr-2"></i> Ingresar al Panel';
      }

      if (res && res.success) {
        state.adminLogged = true;
        sessionStorage.setItem('maxrf_admin_logged', 'true');
        mostrarFormularioAdmin();
      } else {
        if (els.adminAuthError) {
          els.adminAuthError.textContent = (res && res.message) || 'Credenciales incorrectas. Verifica el correo y la contraseña de acceso.';
          els.adminAuthError.classList.remove('hidden');
        }
        if (els.inputAdminPin) {
          els.inputAdminPin.select();
          els.inputAdminPin.focus();
        }
      }
    }).catch(function (err) {
      if (els.btnLoginAdmin) {
        els.btnLoginAdmin.disabled = false;
        els.btnLoginAdmin.innerHTML = '<i class="fas fa-arrow-right-to-bracket mr-2"></i> Ingresar al Panel';
      }
      if (els.adminAuthError) {
        els.adminAuthError.textContent = 'Error al verificar con Google Sheets: ' + (err.message || 'Intenta nuevamente.');
        els.adminAuthError.classList.remove('hidden');
      }
    });
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
    if (newConfig.precio_numero !== undefined && newConfig.precio_numero !== null && newConfig.precio_numero !== '') {
      newConfig.precio_numero = Number(newConfig.precio_numero);
    }
    if (newConfig.min_numeros !== undefined && newConfig.min_numeros !== null && newConfig.min_numeros !== '') {
      newConfig.min_numeros = Math.max(1, parseInt(newConfig.min_numeros, 10) || 1);
    }
    if (newConfig.max_numeros !== undefined && newConfig.max_numeros !== null && newConfig.max_numeros !== '') {
      newConfig.max_numeros = Math.max(1, parseInt(newConfig.max_numeros, 10) || 10);
    }
    if (newConfig.min_numeros && newConfig.max_numeros && newConfig.min_numeros > newConfig.max_numeros) {
      newConfig.max_numeros = newConfig.min_numeros;
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
          els.adminSaveStatus.className = 'p-3.5 rounded-xl text-xs font-bold text-center bg-emerald-50 text-emerald-700 border border-emerald-200 block';
          els.adminSaveStatus.innerHTML = '<i class="fas fa-circle-check mr-1.5 text-base"></i> ¡Configuración guardada con éxito en la página web!';
        }
        setTimeout(function () {
          cerrarModalAdmin();
        }, 1800);
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
