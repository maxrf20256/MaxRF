/**
 * =====================================================================
 * LÓGICA PRINCIPAL DEL SITIO (RIFA DIGITAL)
 * =====================================================================
 */
(function () {
  var state = {
    config: null,
    numeros: [],
    seleccionados: [],
    comprobanteBase64: null,
    comprobanteFilename: null,
    comprobanteMimetype: null
  };

  var els = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheEls();
    bindEvents();
    cargarEstado();
  }

  function cacheEls() {
    els.demoBanner = document.getElementById('demo-banner');
    els.demoBannerText = document.getElementById('demo-banner-text');
    els.heroPremio = document.getElementById('hero-premio');
    els.statDisponibles = document.getElementById('stat-disponibles');
    els.statPrecio = document.getElementById('stat-precio');
    els.statFecha = document.getElementById('stat-fecha');
    els.talonarioSubtitle = document.getElementById('talonario-subtitle');
    els.talonarioLoading = document.getElementById('talonario-loading');
    els.talonarioGrid = document.getElementById('talonario-grid');
    els.seleccionBar = document.getElementById('seleccion-bar');
    els.seleccionLista = document.getElementById('seleccion-lista');
    els.seleccionTotal = document.getElementById('seleccion-total');
    els.btnParticipar = document.getElementById('btn-participar');
    els.premioNombre = document.getElementById('premio-nombre');
    els.metodosPagoList = document.getElementById('metodos-pago-list');
    els.contactoWhatsapp = document.getElementById('contacto-whatsapp');
    els.waFloat = document.getElementById('wa-float');

    els.modalParticipar = document.getElementById('modal-participar');
    els.btnCerrarModal = document.getElementById('btn-cerrar-modal');
    els.formParticipar = document.getElementById('form-participar');
    els.modalNumeros = document.getElementById('modal-numeros');
    els.modalTotal = document.getElementById('modal-total');
    els.selectMetodoPago = els.formParticipar.querySelector('[name="metodo_pago"]');
    els.fileDrop = document.getElementById('file-drop');
    els.inputComprobante = document.getElementById('input-comprobante');
    els.fileDropEmpty = document.getElementById('file-drop-empty');
    els.fileDropPreview = document.getElementById('file-drop-preview');
    els.filePreviewImg = document.getElementById('file-preview-img');
    els.filePreviewName = document.getElementById('file-preview-name');
    els.formError = document.getElementById('form-error');
    els.btnEnviar = document.getElementById('btn-enviar');
    els.btnEnviarText = document.getElementById('btn-enviar-text');

    els.modalExito = document.getElementById('modal-exito');
    els.modalExitoMsg = document.getElementById('modal-exito-msg');
    els.btnCerrarExito = document.getElementById('btn-cerrar-exito');
  }

  function bindEvents() {
    els.btnParticipar.addEventListener('click', abrirModalParticipar);
    els.btnCerrarModal.addEventListener('click', cerrarModalParticipar);
    els.modalParticipar.addEventListener('click', function (e) {
      if (e.target === els.modalParticipar) cerrarModalParticipar();
    });
    els.btnCerrarExito.addEventListener('click', function () {
      els.modalExito.classList.add('hidden');
      window.location.reload(); // refresca el talonario tras participar
    });

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
    els.inputComprobante.addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) {
        procesarArchivo(e.target.files[0]);
      }
    });

    els.formParticipar.addEventListener('submit', onSubmitParticipar);
  }

  // -------------------------------------------------------------------
  // CARGA DE ESTADO
  // -------------------------------------------------------------------
  function cargarEstado() {
    // Banner demo
    if (window.RIFA_DEMO && window.RIFA_DEMO.esModoDemo()) {
      els.demoBanner.classList.remove('hidden');
      els.demoBannerText.textContent = (window.RIFA_CONFIG && window.RIFA_CONFIG.DEMO_MODE_LABEL) || 'MODO DEMO';
    }

    window.RifaAPI.getState().then(function (res) {
      if (!res || !res.success) {
        els.talonarioLoading.innerHTML =
          '<div class="text-center text-red-500"><i class="fas fa-triangle-exclamation text-2xl mb-2"></i><p>' +
          (res && res.message ? res.message : 'No se pudo cargar el talonario.') + '</p></div>';
        return;
      }
      state.config = res.config;
      state.numeros = res.numeros || [];
      renderTodo();
    });
  }

  function renderTodo() {
    renderHero();
    renderStats();
    renderTalonario();
    renderPremio();
    renderMetodosPago();
    renderContacto();
  }

  function formatMoney(n) {
    var moneda = (state.config && state.config.moneda) || 'USD';
    var simbolo = moneda === 'USD' ? '$' : (moneda + ' ');
    return simbolo + Number(n || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 });
  }

  function renderHero() {
    var c = state.config;
    els.heroPremio.textContent =
      (c.nombre_rifa || 'Rifa') + ' — Premio: ' + (c.premio || 'Sorpresa') +
      '. Elige tu número por ' + formatMoney(c.precio_numero) + '.';
  }

  function renderStats() {
    var disponibles = state.numeros.filter(function (n) { return n.estado === 'disponible'; }).length;
    els.statDisponibles.textContent = disponibles;
    els.statPrecio.textContent = formatMoney(state.config.precio_numero);
    els.statFecha.textContent = state.config.fecha_sorteo ? formatFecha(state.config.fecha_sorteo) : '--';
  }

  function formatFecha(f) {
    try {
      var d = new Date(f);
      if (isNaN(d.getTime())) return f;
      return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return f;
    }
  }

  function renderTalonario() {
    els.talonarioSubtitle.textContent =
      'Selecciona tu(s) número(s) del ' + (state.config.rango === '999' ? '000 al 999' : '00 al 99') +
      '. Precio: ' + formatMoney(state.config.precio_numero) + ' c/u.';

    els.talonarioGrid.innerHTML = '';
    state.numeros.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'ticket-num ' + item.estado;
      div.textContent = item.numero;
      div.dataset.numero = item.numero;
      div.dataset.estado = item.estado;
      if (item.estado === 'disponible') {
        div.addEventListener('click', function () { toggleSeleccion(item.numero, div); });
      }
      els.talonarioGrid.appendChild(div);
    });

    els.talonarioLoading.classList.add('hidden');
    els.talonarioGrid.classList.remove('hidden');
  }

  function renderPremio() {
    els.premioNombre.textContent = state.config.premio || '—';
  }

  function renderMetodosPago() {
    var metodos = (state.config.metodos_pago || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    els.metodosPagoList.innerHTML = '';
    els.selectMetodoPago.innerHTML = '<option value="">Selecciona un método</option>';
    metodos.forEach(function (m) {
      var chip = document.createElement('span');
      chip.className = 'bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm';
      chip.innerHTML = '<i class="fas fa-money-bill-wave text-indigo-500 mr-2"></i>' + m;
      els.metodosPagoList.appendChild(chip);

      var opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      els.selectMetodoPago.appendChild(opt);
    });
  }

  function renderContacto() {
    var wa = state.config.whatsapp_contacto;
    if (wa) {
      els.contactoWhatsapp.innerHTML = '<i class="fab fa-whatsapp mr-2 text-green-400"></i> +' + wa;
      els.waFloat.href = 'https://wa.me/' + wa.replace(/\D/g, '') +
        '?text=' + encodeURIComponent('Hola, quiero más información sobre la rifa: ' + (state.config.nombre_rifa || ''));
      els.waFloat.classList.remove('hidden');
    }
  }

  // -------------------------------------------------------------------
  // SELECCIÓN DE NÚMEROS
  // -------------------------------------------------------------------
  function toggleSeleccion(numero, el) {
    var idx = state.seleccionados.indexOf(numero);
    if (idx === -1) {
      state.seleccionados.push(numero);
      el.classList.add('seleccionado');
    } else {
      state.seleccionados.splice(idx, 1);
      el.classList.remove('seleccionado');
    }
    renderBarraSeleccion();
  }

  function renderBarraSeleccion() {
    if (state.seleccionados.length === 0) {
      els.seleccionBar.classList.add('hidden');
      return;
    }
    els.seleccionBar.classList.remove('hidden');
    var ordenados = state.seleccionados.slice().sort();
    els.seleccionLista.textContent = ordenados.join(', ');
    var total = state.seleccionados.length * Number(state.config.precio_numero || 0);
    els.seleccionTotal.textContent = formatMoney(total);
  }

  // -------------------------------------------------------------------
  // MODAL DE PARTICIPACIÓN
  // -------------------------------------------------------------------
  function abrirModalParticipar() {
    if (state.seleccionados.length === 0) return;
    var ordenados = state.seleccionados.slice().sort();
    els.modalNumeros.textContent = ordenados.join(', ');
    var total = state.seleccionados.length * Number(state.config.precio_numero || 0);
    els.modalTotal.textContent = formatMoney(total);
    els.formError.classList.add('hidden');
    els.modalParticipar.classList.remove('hidden');
  }

  function cerrarModalParticipar() {
    els.modalParticipar.classList.add('hidden');
  }

  function procesarArchivo(file) {
    var maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      mostrarErrorForm('La imagen es muy pesada (máx. 4MB). Elige otra o comprímela.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      mostrarErrorForm('Solo se aceptan imágenes (JPG, PNG, WEBP, etc.).');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      var dataUrl = e.target.result; // "data:image/png;base64,XXXX"
      var base64 = dataUrl.split(',')[1];
      state.comprobanteBase64 = base64;
      state.comprobanteFilename = file.name;
      state.comprobanteMimetype = file.type;

      els.filePreviewImg.src = dataUrl;
      els.filePreviewName.textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
      els.fileDropEmpty.classList.add('hidden');
      els.fileDropPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function mostrarErrorForm(msg) {
    els.formError.textContent = msg;
    els.formError.classList.remove('hidden');
  }

  function onSubmitParticipar(e) {
    e.preventDefault();
    els.formError.classList.add('hidden');

    var formData = new FormData(els.formParticipar);
    var payload = {
      nombre: (formData.get('nombre') || '').trim(),
      correo: (formData.get('correo') || '').trim(),
      telefono: (formData.get('telefono') || '').trim(),
      metodo_pago: formData.get('metodo_pago') || '',
      referencia_pago: (formData.get('referencia_pago') || '').trim(),
      numeros: state.seleccionados.slice(),
      comprobante_base64: state.comprobanteBase64,
      comprobante_filename: state.comprobanteFilename,
      comprobante_mimetype: state.comprobanteMimetype
    };

    if (!payload.nombre || !payload.correo || !payload.telefono || !payload.metodo_pago || !payload.referencia_pago) {
      mostrarErrorForm('Por favor completa todos los campos obligatorios.');
      return;
    }
    if (!payload.comprobante_base64) {
      mostrarErrorForm('Debes adjuntar el comprobante de pago.');
      return;
    }

    setEnviando(true);

    window.RifaAPI.reservar(payload).then(function (res) {
      setEnviando(false);
      if (!res || !res.success) {
        mostrarErrorForm((res && res.message) || 'Ocurrió un error al procesar tu participación.');
        return;
      }
      cerrarModalParticipar();
      els.modalExitoMsg.textContent = res.message || 'Tus números quedaron reservados.';
      els.modalExito.classList.remove('hidden');
    });
  }

  function setEnviando(enviando) {
    els.btnEnviar.disabled = enviando;
    els.btnEnviarText.innerHTML = enviando
      ? '<i class="fas fa-spinner fa-spin mr-2"></i> Enviando...'
      : '<i class="fas fa-paper-plane mr-2"></i> Enviar participación';
  }

})();
