/**
 * =====================================================================
 * DINAMICA MAXRF - GOOGLE APPS SCRIPT BACKEND
 * Cuenta oficial: maxrf2025@gmail.com
 * Soporte: Sincronización automática Google Sheets + Envío de Tiquete por Gmail
 * =====================================================================
 */

var DEFAULT_CONFIG = {
  nombre_rifa: 'Dinámica MaxRF',
  premio: '(PERFUME Hombre / Mujer), tú escoges.',
  rango: '99',
  precio_numero: 0,
  moneda: '$',
  fecha_sorteo: '2026-09-03T05:00:00.000Z',
  metodos_pago: 'Nequi 3188178457',
  whatsapp_contacto: '573188178457',
  estado_rifa: 'activa',
  min_numeros: 1,
  max_numeros: 10
};

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getState';
  if (action === 'getState') {
    return jsonResponse(getEstadoTalonario());
  }
  return jsonResponse({ success: false, message: 'Acción no reconocida' });
}

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    var action = data.action || 'reservar';
    if (action === 'reservar') {
      return jsonResponse(procesarReserva(data));
    } else if (action === 'enviarCorreo') {
      return jsonResponse(enviarCorreoParticipante(data));
    } else if (action === 'updateConfig') {
      return jsonResponse(actualizarConfiguracion(data));
    } else if (action === 'actualizarEstadoTiquete') {
      return jsonResponse(actualizarEstadoTiquete(data));
    } else if (action === 'consultarTiquete') {
      return jsonResponse(consultarTiquete(data));
    } else if (action === 'loginAdmin') {
      return jsonResponse(verificarLoginAdmin(data));
    } else if (action === 'eliminarTiquete') {
      return jsonResponse(eliminarTiquete(data));
    }
    return jsonResponse({ success: false, message: 'Acción no reconocida' });
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  }
}

/**
 * Obtiene el estado del talonario y reconcilia automáticamente con Participantes.
 * Si borras participantes en el Sheet, los números vuelven a estar disponibles en la web.
 */
function getEstadoTalonario() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNumeros = ss.getSheetByName('Numeros') || ss.getSheetByName('Talonario');
  if (!sheetNumeros) {
    sheetNumeros = inicializarHojaNumeros(ss);
  }
  
  var sheetPart = ss.getSheetByName('Participantes') || ss.getSheetByName('Ventas');
  var participantesEstadoMap = {}; // '00' -> 'vendido' | 'reservado'
  
  if (sheetPart && sheetPart.getLastRow() > 1) {
    var partData = sheetPart.getDataRange().getValues();
    var headers = partData[0].map(function(h){ return String(h).toLowerCase().trim(); });
    var numColIdx = -1;
    var estadoColIdx = -1;
    var refColIdx = -1;
    for (var c = 0; c < headers.length; c++) {
      var h = headers[c];
      if (h.indexOf('nmero') !== -1 || h.indexOf('numero') !== -1 || h === 'boleta' || h === '#') {
        numColIdx = c;
      }
      if (h.indexOf('estado') !== -1 || h.indexOf('status') !== -1) {
        estadoColIdx = c;
      }
      if (h.indexOf('referencia') !== -1 || h.indexOf('comprobante') !== -1) {
        refColIdx = c;
      }
    }
    
    // Fallbacks si las columnas no tienen encabezado estándar
    if (numColIdx === -1) numColIdx = 4;
    if (estadoColIdx === -1) estadoColIdx = 10;
    if (refColIdx === -1) refColIdx = 7;
    
    for (var r = 1; r < partData.length; r++) {
      var row = partData[r];
      var rawNums = String(row[numColIdx] || '').trim();
      if (!rawNums) continue;
      
      var rawEstado = String(row[estadoColIdx] || '').trim().toLowerCase();
      var rawRef = String(row[refColIdx] || '').trim().toLowerCase();
      
      var estadoFinal = 'reservado';
      if (rawEstado.indexOf('pag') !== -1 || rawEstado.indexOf('conf') !== -1 || rawEstado.indexOf('vend') !== -1) {
        // Solo es vendido si el administrador explícitamente marcó el tiquete como Pagado/Confirmado
        estadoFinal = 'vendido';
      } else if (rawEstado.indexOf('rech') !== -1 || rawEstado.indexOf('canc') !== -1 || rawEstado.indexOf('disp') !== -1) {
        // Si el administrador lo canceló o rechazó, el número vuelve a estar disponible
        estadoFinal = 'disponible';
      } else {
        // En cualquier otro caso (Pendiente, etc.) siempre es 'reservado' (naranja)
        estadoFinal = 'reservado';
      }
      
      var splitNums = rawNums.split(/[,;\s]+/);
      for (var k = 0; k < splitNums.length; k++) {
        var nStr = splitNums[k].trim();
        if (nStr !== '') {
          if (nStr.length === 1) nStr = '0' + nStr;
          // Si algún ticket para este número está 'vendido', tiene prioridad
          if (participantesEstadoMap[nStr] !== 'vendido') {
            participantesEstadoMap[nStr] = estadoFinal;
          }
        }
      }
    }
  }
  
  var dataNum = sheetNumeros.getDataRange().getValues();
  var listaNumeros = [];
  var updatesNeeded = false;
  
  for (var i = 1; i < dataNum.length; i++) {
    var num = String(dataNum[i][0]).trim();
    if (num.length === 1) num = '0' + num;
    var estadoActual = String(dataNum[i][1] || 'disponible').toLowerCase().trim();
    
    // Si hay hoja Participantes, reconciliar con el estado real del participante
    if (sheetPart && sheetPart.getLastRow() > 1) {
      var estadoEsperado = participantesEstadoMap[num] || 'disponible';
      if (estadoActual !== estadoEsperado) {
        estadoActual = estadoEsperado;
        dataNum[i][1] = estadoEsperado;
        updatesNeeded = true;
      }
    }
    
    listaNumeros.push({
      numero: num,
      estado: estadoActual
    });
  }
  
  if (updatesNeeded) {
    sheetNumeros.getDataRange().setValues(dataNum);
  }
  
  var config = Object.assign({}, DEFAULT_CONFIG);
  var sheetConfig = obtenerHojaConfig(ss);
  if (sheetConfig && sheetConfig.getLastRow() >= 1) {
    var cData = sheetConfig.getDataRange().getValues();
    for (var j = 0; j < cData.length; j++) {
      var rawK = String(cData[j][0] || '').trim();
      if (!rawK) continue;
      var cleanK = rawK.replace(/:+$/, '').trim().toLowerCase();
      if (cleanK === 'clave' || cleanK === 'key' || cleanK === 'parametro' || cleanK === 'nombre' ||
          cleanK.indexOf('pin') !== -1 || cleanK.indexOf('clave') !== -1 || cleanK.indexOf('pass') !== -1 || cleanK.indexOf('secret') !== -1) {
        continue;
      }
      var v = cData[j][1];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        if (cleanK === 'fecha_sorteo' && Object.prototype.toString.call(v) === '[object Date]') {
          v = Utilities.formatDate(v, 'GMT-5', 'yyyy-MM-dd');
        }
        config[cleanK] = v;
        if (cleanK === 'premio_titulo') config['premio'] = v;
        if (cleanK === 'premio') config['premio_titulo'] = v;
      }
    }
  }
  
  var listaParticipantes = [];
  if (sheetPart && sheetPart.getLastRow() > 1) {
    var pRows = sheetPart.getDataRange().getValues();
    var pHeaders = pRows[0].map(function(h){ return String(h).toLowerCase().trim(); });
    var pTicketIdx = -1, pNomIdx = -1, pTelIdx = -1, pCorreoIdx = -1, pNumIdx = -1;
    var pTotalIdx = -1, pMetodoIdx = -1, pRefIdx = -1, pCompIdx = -1, pEstadoIdx = -1, pDriveIdx = -1;
    
    for (var c = 0; c < pHeaders.length; c++) {
      var h = pHeaders[c];
      if (h.indexOf('ticket') !== -1 || h.indexOf('tiquete') !== -1 || h.indexOf('cdigo') !== -1 || h.indexOf('codigo') !== -1) pTicketIdx = c;
      if (h.indexOf('nombre') !== -1 || h.indexOf('participante') !== -1 || h.indexOf('cliente') !== -1) pNomIdx = c;
      if (h.indexOf('tel') !== -1 || h.indexOf('cel') !== -1) pTelIdx = c;
      if (h.indexOf('correo') !== -1 || h.indexOf('email') !== -1) pCorreoIdx = c;
      if (h.indexOf('nmero') !== -1 || h.indexOf('numero') !== -1 || h === 'boleta' || h === '#') pNumIdx = c;
      if (h.indexOf('total') !== -1 || h.indexOf('monto') !== -1 || h.indexOf('valor') !== -1) pTotalIdx = c;
      if (h.indexOf('mtodo') !== -1 || h.indexOf('metodo') !== -1 || h.indexOf('forma') !== -1) pMetodoIdx = c;
      if (h.indexOf('referencia') !== -1 || h.indexOf('ref') !== -1) pRefIdx = c;
      if (h.indexOf('comprobante') !== -1) pCompIdx = c;
      if (h.indexOf('estado') !== -1 || h.indexOf('status') !== -1) pEstadoIdx = c;
      if (h.indexOf('drive') !== -1 || h.indexOf('imagen') !== -1 || h.indexOf('soporte') !== -1) pDriveIdx = c;
    }
    
    if (pTicketIdx === -1) pTicketIdx = 9;
    if (pNomIdx === -1) pNomIdx = 1;
    if (pTelIdx === -1) pTelIdx = 2;
    if (pCorreoIdx === -1) pCorreoIdx = 3;
    if (pNumIdx === -1) pNumIdx = 4;
    if (pTotalIdx === -1) pTotalIdx = 5;
    if (pMetodoIdx === -1) pMetodoIdx = 6;
    if (pRefIdx === -1) pRefIdx = 7;
    if (pCompIdx === -1) pCompIdx = 8;
    if (pEstadoIdx === -1) pEstadoIdx = 10;
    if (pDriveIdx === -1) pDriveIdx = 11;

    for (var p = 1; p < pRows.length; p++) {
      var row = pRows[p];
      var rawTicket = String(row[pTicketIdx] || '').trim();
      if (!rawTicket) {
        for (var col = 0; col < row.length; col++) {
          var val = String(row[col] || '').trim();
          if (val.indexOf('MAXRF-') !== -1) {
            rawTicket = val;
            break;
          }
        }
      }
      if (!rawTicket) continue;

      var rawNums = String(row[pNumIdx] || '');
      var arrNums = rawNums.split(/[,;\s]+/).map(function(s){return s.trim();}).filter(Boolean);
      var rawRef = String(row[pRefIdx] || '').trim();
      var rawEstado = String(row[pEstadoIdx] || '').trim();
      if (!rawEstado) {
        rawEstado = (rawRef.toLowerCase().indexOf('pendiente') !== -1) ? 'Pendiente' : 'Pagado';
      }
      listaParticipantes.push({
        fecha: row[0],
        nombre: row[pNomIdx],
        telefono: row[pTelIdx],
        correo: row[pCorreoIdx],
        numeros: arrNums,
        total: row[pTotalIdx],
        metodo_pago: row[pMetodoIdx],
        referencia_pago: row[pRefIdx],
        comprobante_url: row[pCompIdx],
        ticket: rawTicket,
        codigo_tiquete: rawTicket,
        estado: rawEstado,
        tiquete_imagen_url: row[pDriveIdx] || ''
      });
    }
  }

  return {
    success: true,
    config: config,
    numeros: listaNumeros,
    participantes: listaParticipantes
  };
}

/**
 * Procesa la reserva en el Sheet y envía el correo si se solicitó.
 * Guarda la imagen del tiquete en Google Drive y registra todos los datos.
 */
function procesarReserva(data) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;
  try {
    lockAcquired = lock.tryLock(25000); // Esperar hasta 25 segundos para serializar solicitudes simultáneas
  } catch (eLock) {
    lockAcquired = false;
  }

  if (!lockAcquired) {
    return {
      success: false,
      message: 'El sistema se encuentra procesando otra solicitud simultánea. Por favor intenta de nuevo en unos segundos.'
    };
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetPart = ss.getSheetByName('Participantes') || ss.insertSheet('Participantes');
    var sheetNum = ss.getSheetByName('Numeros') || ss.getSheetByName('Talonario');
    if (!sheetNum) {
      sheetNum = inicializarHojaNumeros(ss);
    }

    // Normalizar números solicitados (formato con cero a la izquierda si es dígito único)
    var rawNumeros = data.numeros || [];
    var requestedNums = [];
    for (var n = 0; n < rawNumeros.length; n++) {
      var s = String(rawNumeros[n]).trim();
      if (s !== '') {
        if (s.length === 1) s = '0' + s;
        if (requestedNums.indexOf(s) === -1) {
          requestedNums.push(s);
        }
      }
    }

    if (requestedNums.length === 0) {
      return { success: false, message: 'No se seleccionó ningún número para reservar.' };
    }

    // =========================================================================
    // VALIDACIÓN ESTRICTA DE DISPONIBILIDAD (Evita números duplicados entre usuarios)
    // =========================================================================
    var mapaOcupados = {};

    // 1. Revisar hoja Participantes (registros confirmados o pendientes)
    if (sheetPart && sheetPart.getLastRow() > 1) {
      var partData = sheetPart.getDataRange().getValues();
      var headers = partData[0].map(function(h){ return String(h).toLowerCase().trim(); });
      var numColIdx = -1;
      var estadoColIdx = -1;
      for (var c = 0; c < headers.length; c++) {
        var h = headers[c];
        if (h.indexOf('nmero') !== -1 || h.indexOf('numero') !== -1 || h === 'boleta' || h === '#') numColIdx = c;
        if (h.indexOf('estado') !== -1 || h.indexOf('status') !== -1) estadoColIdx = c;
      }
      if (numColIdx === -1) numColIdx = 4;
      if (estadoColIdx === -1) estadoColIdx = 10;

      for (var r = 1; r < partData.length; r++) {
        var row = partData[r];
        var rawEstado = String(row[estadoColIdx] || '').trim().toLowerCase();
        // Si el estado es rechazado o cancelado, el número queda liberado
        if (rawEstado.indexOf('rech') !== -1 || rawEstado.indexOf('canc') !== -1) {
          continue;
        }
        var rawNums = String(row[numColIdx] || '').trim();
        if (!rawNums) continue;
        var split = rawNums.split(/[,;\s]+/);
        for (var k = 0; k < split.length; k++) {
          var pNum = split[k].trim();
          if (pNum !== '') {
            if (pNum.length === 1) pNum = '0' + pNum;
            mapaOcupados[pNum] = true;
          }
        }
      }
    }

    // 2. Revisar hoja Numeros / Talonario
    if (sheetNum && sheetNum.getLastRow() > 1) {
      var numData = sheetNum.getDataRange().getValues();
      for (var i = 1; i < numData.length; i++) {
        var curNum = String(numData[i][0]).trim();
        if (curNum.length === 1) curNum = '0' + curNum;
        var curEstado = String(numData[i][1] || 'disponible').toLowerCase().trim();
        if (curEstado && curEstado !== 'disponible') {
          mapaOcupados[curNum] = true;
        }
      }
    }

    // Verificar si alguno de los números ya fue ganado por otro usuario que finalizó antes
    var numerosYaTomados = [];
    for (var j = 0; j < requestedNums.length; j++) {
      if (mapaOcupados[requestedNums[j]]) {
        numerosYaTomados.push(requestedNums[j]);
      }
    }

    if (numerosYaTomados.length > 0) {
      var msgRespuesta = numerosYaTomados.length === 1
        ? 'este numero ya ha sido seleccionado (' + numerosYaTomados[0] + ')'
        : 'estos numeros ya han sido seleccionados (' + numerosYaTomados.join(', ') + ')';

      return {
        success: false,
        code: 'NUMERO_YA_SELECCIONADO',
        numeros_ocupados: numerosYaTomados,
        message: numerosYaTomados.length === 1
          ? 'Este número ya ha sido seleccionado (' + numerosYaTomados[0] + '). Por favor elige otro número disponible.'
          : 'Los siguientes números ya han sido seleccionados: ' + numerosYaTomados.join(', ') + '. Por favor escoge otros números disponibles.'
      };
    }

    // Si los números están 100% libres, procedemos con el registro
    if (sheetPart.getLastRow() === 0) {
      sheetPart.appendRow([
        'Fecha', 'Nombre', 'Teléfono', 'Correo', 'Números', 
        'Total', 'Método Pago', 'Referencia', 'Comprobante URL', 'Código Tiquete', 'Estado', 'Tiquete Drive URL'
      ]);
    }

    var numerosStr = requestedNums.join(', ');
    var fecha = new Date();
    var ticketCode = data.ticket || data.codigo_tiquete || ('MAXRF-' + Math.floor(100000 + Math.random() * 900000));

    // 1. Guardar comprobante si se adjuntó imagen en carpeta 'Talonario / Comprobantes MaxRF'
    var compB64 = data.comprobante_base64 || data.comprobanteBase64;
    var compName = data.comprobante_filename || data.comprobanteFilename || 'comprobante.png';
    var compMime = data.comprobante_mimetype || data.comprobanteMimetype || 'image/png';
    var comprobanteUrl = '';
    if (compB64) {
      try {
        var folder = obtenerSubcarpetaTalonario(ss, 'Comprobantes MaxRF');
        if (compB64.indexOf(',') !== -1) {
          compB64 = compB64.split(',')[1];
        }
        var decoded = Utilities.base64Decode(compB64);
        var blob = Utilities.newBlob(decoded, compMime, compName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        comprobanteUrl = file.getUrl();
      } catch (e) {
        Logger.log('Error guardando comprobante en Drive: ' + e);
      }
    }

    // 2. Guardar imagen oficial del tiquete en carpeta 'Talonario / Tiquetes Emitidos MaxRF'
    var tktB64 = data.tiquete_imagen_base64 || data.tiqueteImagenBase64;
    var tiqueteDriveUrl = '';
    if (tktB64) {
      try {
        var tktFolder = obtenerSubcarpetaTalonario(ss, 'Tiquetes Emitidos MaxRF');
        if (tktB64.indexOf(',') !== -1) {
          tktB64 = tktB64.split(',')[1];
        }
        var tktDecoded = Utilities.base64Decode(tktB64);
        var tktBlob = Utilities.newBlob(tktDecoded, 'image/png', 'Tiquete_' + ticketCode + '.png');
        var tktFile = tktFolder.createFile(tktBlob);
        tktFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        tiqueteDriveUrl = tktFile.getUrl();
      } catch (eTkt) {
        Logger.log('Error guardando tiquete en Drive: ' + eTkt);
      }
    }

    // 3. Determinar estado inicial y valores monetarios
    // Toda nueva reserva desde la web queda siempre como 'Pendiente' (reservado / naranja).
    // El estado de 'vendido' (rojo) SOLO lo define el administrador una vez valide que el pago esté correcto desde el panel admin.
    var totalVal = (data.total !== undefined && data.total !== null && data.total !== '') ? Number(data.total) : null;
    var totalNum = (totalVal !== null && !isNaN(totalVal)) ? totalVal : (requestedNums.length * Number(DEFAULT_CONFIG.precio_numero || 0));
    var esGratis = (totalNum === 0);

    var refPago = String(data.referencia_pago || data.referencia || '').trim();
    var metPago = String(data.metodo_pago || '').trim();
    if (esGratis) {
      if (!refPago || refPago.toLowerCase() === 'pendiente') refPago = 'GRATIS';
      if (!metPago || metPago.toLowerCase() === 'pendiente') metPago = 'Gratis / Promoción';
    } else {
      if (!refPago) refPago = 'Pendiente';
    }
    var estadoInicial = 'Pendiente';

    sheetPart.appendRow([
      fecha,
      data.nombre || '',
      data.telefono || '',
      data.correo || '',
      numerosStr,
      totalNum,
      metPago,
      refPago,
      comprobanteUrl,
      ticketCode,
      estadoInicial,
      tiqueteDriveUrl
    ]);

    // 4. Marcar números en talonario como 'reservado' (naranja / pendiente)
    if (sheetNum) {
      var numData = sheetNum.getDataRange().getValues();
      var selMap = {};
      requestedNums.forEach(function(n) {
        selMap[n] = true;
      });

      var estadoNum = 'reservado';
      for (var i = 1; i < numData.length; i++) {
        var cur = String(numData[i][0]).trim();
        if (cur.length === 1) cur = '0' + cur;
        if (selMap[cur]) {
          numData[i][1] = estadoNum;
        }
      }
      sheetNum.getDataRange().setValues(numData);
    }

    // 5. Enviar correo si solicitado
    if ((data.enviar_correo || data.enviarCorreo) && data.correo) {
      try {
        data.ticket = ticketCode;
        data.codigo_tiquete = ticketCode;
        data.tiquete_url = tiqueteDriveUrl;
        data.total = totalNum;
        data.metodo_pago = metPago;
        data.referencia_pago = refPago;
        enviarCorreoParticipante(data);
      } catch (errEmail) {
        Logger.log('Error enviando correo: ' + errEmail);
      }
    }

    return {
      success: true,
      ticket: ticketCode,
      codigo_tiquete: ticketCode,
      tiquete_url: tiqueteDriveUrl,
      estado: estadoInicial,
      message: 'Reserva procesada exitosamente y tiquete guardado en Google Drive'
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (eRel) {}
  }
}

/**
 * Consulta un tiquete en la hoja Participantes
 */
function consultarTiquete(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPart = ss.getSheetByName('Participantes') || ss.getSheetByName('Ventas');
  if (!sheetPart || sheetPart.getLastRow() <= 1) {
    return { success: false, message: 'No hay participantes registrados.' };
  }
  var pData = sheetPart.getDataRange().getValues();
  var target = String(data.ticket || data.codigo_tiquete || data.query || '').trim().toLowerCase();
  
  var headers = pData[0].map(function(h){ return String(h).toLowerCase().trim(); });
  var ticketColIdx = -1, telColIdx = -1, nomColIdx = -1, correoColIdx = -1, numColIdx = -1;
  var totalColIdx = -1, metodoColIdx = -1, refColIdx = -1, compColIdx = -1, estadoColIdx = -1, driveColIdx = -1;
  
  for (var c = 0; c < headers.length; c++) {
    var h = headers[c];
    if (h.indexOf('ticket') !== -1 || h.indexOf('tiquete') !== -1 || h.indexOf('cdigo') !== -1 || h.indexOf('codigo') !== -1) ticketColIdx = c;
    if (h.indexOf('tel') !== -1 || h.indexOf('cel') !== -1) telColIdx = c;
    if (h.indexOf('nombre') !== -1 || h.indexOf('participante') !== -1 || h.indexOf('cliente') !== -1) nomColIdx = c;
    if (h.indexOf('correo') !== -1 || h.indexOf('email') !== -1) correoColIdx = c;
    if (h.indexOf('nmero') !== -1 || h.indexOf('numero') !== -1 || h === 'boleta' || h === '#') numColIdx = c;
    if (h.indexOf('total') !== -1 || h.indexOf('monto') !== -1 || h.indexOf('valor') !== -1) totalColIdx = c;
    if (h.indexOf('mtodo') !== -1 || h.indexOf('metodo') !== -1 || h.indexOf('forma') !== -1) metodoColIdx = c;
    if (h.indexOf('referencia') !== -1 || h.indexOf('ref') !== -1) refColIdx = c;
    if (h.indexOf('comprobante') !== -1) compColIdx = c;
    if (h.indexOf('estado') !== -1 || h.indexOf('status') !== -1) estadoColIdx = c;
    if (h.indexOf('drive') !== -1 || h.indexOf('imagen') !== -1 || h.indexOf('soporte') !== -1) driveColIdx = c;
  }
  
  if (ticketColIdx === -1) ticketColIdx = 9;
  if (telColIdx === -1) telColIdx = 2;
  if (nomColIdx === -1) nomColIdx = 1;
  if (correoColIdx === -1) correoColIdx = 3;
  if (numColIdx === -1) numColIdx = 4;
  if (totalColIdx === -1) totalColIdx = 5;
  if (metodoColIdx === -1) metodoColIdx = 6;
  if (refColIdx === -1) refColIdx = 7;
  if (compColIdx === -1) compColIdx = 8;
  if (estadoColIdx === -1) estadoColIdx = 10;
  if (driveColIdx === -1) driveColIdx = 11;
  
  for (var r = 1; r < pData.length; r++) {
    var row = pData[r];
    var ticketCode = String(row[ticketColIdx] || '').trim();
    var tel = String(row[telColIdx] || '').trim();
    var nombre = String(row[nomColIdx] || '').trim();
    
    var match = (ticketCode.toLowerCase() === target) ||
                (tel.toLowerCase() === target) ||
                (target.length >= 3 && nombre.toLowerCase().indexOf(target) !== -1);
                
    if (!match && target) {
      for (var col = 0; col < row.length; col++) {
        if (String(row[col] || '').trim().toLowerCase() === target) {
          match = true;
          break;
        }
      }
    }
    
    if (match) {
      var rawEstado = String(row[estadoColIdx] || '').trim();
      var rawRef = String(row[refColIdx] || '').trim();
      if (!rawEstado) {
        rawEstado = (rawRef.toLowerCase().indexOf('pendiente') !== -1) ? 'Pendiente' : 'Pagado';
      }
      return {
        success: true,
        participante: {
          fecha: row[0],
          nombre: row[nomColIdx],
          telefono: row[telColIdx],
          correo: row[correoColIdx],
          numeros: String(row[numColIdx]).split(/[,;\s]+/).map(function(s){return s.trim();}).filter(Boolean),
          total: row[totalColIdx],
          metodo_pago: row[metodoColIdx],
          referencia_pago: row[refColIdx],
          comprobante_url: row[compColIdx],
          ticket: ticketCode || ('MAXRF-' + r),
          codigo_tiquete: ticketCode || ('MAXRF-' + r),
          estado: rawEstado,
          tiquete_imagen_url: row[driveColIdx] || ''
        }
      };
    }
  }
  return { success: false, message: 'Tiquete no encontrado.' };
}

/**
 * Actualiza el estado del tiquete (de Pendiente a Pagado, etc.), guarda el nuevo soporte en Drive y actualiza el talonario.
 * Sincroniza dinámicamente tanto la hoja Participantes como la hoja Numeros y la carpeta en Google Drive.
 */
function actualizarEstadoTiquete(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPart = ss.getSheetByName('Participantes') || ss.getSheetByName('Ventas');
  var sheetNum = ss.getSheetByName('Numeros') || ss.getSheetByName('Talonario');
  var targetTicket = String(data.ticket || data.codigo_tiquete || '').trim().toUpperCase();
  var nuevoEstado = String(data.nuevo_estado || data.estado || 'Pagado').trim();
  var nuevaRef = String(data.referencia_pago || data.referencia || '').trim();
  
  if (!sheetPart) {
    return { success: false, inSheets: false, message: 'Hoja Participantes no encontrada en la hoja de cálculo' };
  }
  
  var pData = sheetPart.getDataRange().getValues();
  if (pData.length <= 1) {
    return { success: false, inSheets: false, message: 'No hay filas registradas en la hoja Participantes' };
  }

  // Detectar columnas dinámicamente según encabezados
  var headers = pData[0].map(function(h){ return String(h).toLowerCase().trim(); });
  var ticketColIdx = -1;
  var estadoColIdx = -1;
  var refColIdx = -1;
  var driveColIdx = -1;
  var numColIdx = -1;
  
  for (var c = 0; c < headers.length; c++) {
    var h = headers[c];
    if (h.indexOf('ticket') !== -1 || h.indexOf('tiquete') !== -1 || h.indexOf('cdigo') !== -1 || h.indexOf('codigo') !== -1) {
      ticketColIdx = c;
    }
    if (h.indexOf('estado') !== -1 || h.indexOf('status') !== -1) {
      estadoColIdx = c;
    }
    if (h.indexOf('referencia') !== -1 || h.indexOf('ref') !== -1 || h.indexOf('comprobante') !== -1) {
      if (refColIdx === -1) refColIdx = c;
    }
    if (h.indexOf('drive') !== -1 || h.indexOf('imagen') !== -1 || h.indexOf('soporte') !== -1) {
      driveColIdx = c;
    }
    if (h.indexOf('nmero') !== -1 || h.indexOf('numero') !== -1 || h === 'boleta' || h === '#') {
      numColIdx = c;
    }
  }
  
  // Posiciones estándar por defecto
  if (ticketColIdx === -1) ticketColIdx = 9;
  if (estadoColIdx === -1) estadoColIdx = 10;
  if (refColIdx === -1) refColIdx = 7;
  if (driveColIdx === -1) driveColIdx = 11;
  if (numColIdx === -1) numColIdx = 4;
  
  // Buscar fila del tiquete por código en la columna correspondiente
  var rowIndex = -1;
  var rowData = null;
  for (var r = 1; r < pData.length; r++) {
    var val = String(pData[r][ticketColIdx] || '').trim().toUpperCase();
    if (val === targetTicket) {
      rowIndex = r + 1; // 1-indexado para Google Sheets
      rowData = pData[r];
      break;
    }
  }
  
  // Búsqueda exhaustiva por si el código está en otra columna
  if (rowIndex === -1) {
    for (var r2 = 1; r2 < pData.length; r2++) {
      for (var col = 0; col < pData[r2].length; col++) {
        var cellVal = String(pData[r2][col] || '').trim().toUpperCase();
        if (cellVal === targetTicket) {
          rowIndex = r2 + 1;
          rowData = pData[r2];
          break;
        }
      }
      if (rowIndex !== -1) break;
    }
  }
  
  if (rowIndex === -1) {
    return { success: false, inSheets: false, message: 'No se encontró el tiquete ' + targetTicket + ' en la hoja Participantes.' };
  }
  
  // 1. Guardar nueva imagen oficial de soporte en Google Drive (carpeta 'Talonario / Tiquetes Emitidos MaxRF')
  var nuevoDriveUrl = '';
  var tktB64 = data.tiquete_imagen_base64 || data.tiqueteImagenBase64;
  if (tktB64) {
    try {
      var tktFolder = obtenerSubcarpetaTalonario(ss, 'Tiquetes Emitidos MaxRF');
      if (tktB64.indexOf(',') !== -1) {
        tktB64 = tktB64.split(',')[1];
      }
      var tktDecoded = Utilities.base64Decode(tktB64);
      var tktBlob = Utilities.newBlob(tktDecoded, 'image/png', 'Soporte_' + nuevoEstado.toUpperCase() + '_' + targetTicket + '.png');
      var tktFile = tktFolder.createFile(tktBlob);
      tktFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      nuevoDriveUrl = tktFile.getUrl();
    } catch (eDrive) {
      Logger.log('Error guardando soporte en Drive: ' + eDrive);
    }
  }
  
  // 2. Asegurar y actualizar columna 'Estado' en Google Sheets
  if (estadoColIdx >= headers.length || !headers[estadoColIdx]) {
    sheetPart.getRange(1, estadoColIdx + 1).setValue('Estado');
  }
  sheetPart.getRange(rowIndex, estadoColIdx + 1).setValue(nuevoEstado);
  
  // 3. Actualizar columna 'Referencia' si se envió nueva referencia
  if (nuevaRef && refColIdx !== -1) {
    if (refColIdx >= headers.length || !headers[refColIdx]) {
      sheetPart.getRange(1, refColIdx + 1).setValue('Referencia');
    }
    sheetPart.getRange(rowIndex, refColIdx + 1).setValue(nuevaRef);
  }
  
  // 4. Actualizar columna 'Tiquete Drive URL' si se generó archivo en Drive
  if (nuevoDriveUrl && driveColIdx !== -1) {
    if (driveColIdx >= headers.length || !headers[driveColIdx]) {
      sheetPart.getRange(1, driveColIdx + 1).setValue('Tiquete Drive URL');
    }
    sheetPart.getRange(rowIndex, driveColIdx + 1).setValue(nuevoDriveUrl);
  }
  
  // 5. Actualizar estado de los números en la hoja Numeros / Talonario
  var numerosStr = String(rowData[numColIdx] || '');
  var nums = numerosStr.split(/[,;\s]+/).map(function(s){return s.trim();}).filter(Boolean);
  if (sheetNum && nums.length > 0) {
    var numData = sheetNum.getDataRange().getValues();
    var numMap = {};
    nums.forEach(function(n) {
      var s = n.length === 1 ? ('0' + n) : n;
      numMap[s] = true;
    });
    
    var estadoNum = 'reservado';
    if (nuevoEstado.toLowerCase().indexOf('pag') !== -1 || nuevoEstado.toLowerCase().indexOf('conf') !== -1) {
      estadoNum = 'vendido';
    } else if (nuevoEstado.toLowerCase().indexOf('rech') !== -1 || nuevoEstado.toLowerCase().indexOf('canc') !== -1) {
      estadoNum = 'disponible';
    }
    
    for (var i = 1; i < numData.length; i++) {
      var cur = String(numData[i][0]).trim();
      if (cur.length === 1) cur = '0' + cur;
      if (numMap[cur]) {
        numData[i][1] = estadoNum;
      }
    }
    sheetNum.getDataRange().setValues(numData);
  }
  
  return {
    success: true,
    inSheets: true,
    message: 'Tiquete ' + targetTicket + ' actualizado a ' + nuevoEstado + ' en Google Sheets y Drive',
    ticket: targetTicket,
    codigo_tiquete: targetTicket,
    nuevo_estado: nuevoEstado,
    nueva_referencia: nuevaRef,
    tiquete_drive_url: nuevoDriveUrl || String(rowData[driveColIdx] || '')
  };
}

/**
 * Elimina permanentemente un tiquete de la hoja Participantes y libera sus números en el talonario
 */
function eliminarTiquete(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (eLock) {
    return { success: false, inSheets: false, message: 'El servidor está ocupado. Intenta de nuevo en unos segundos.' };
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetPart = ss.getSheetByName('Participantes') || ss.getSheetByName('Ventas');
    var sheetNum = ss.getSheetByName('Numeros') || ss.getSheetByName('Talonario');
    var targetTicket = String(data.ticket || data.codigo_tiquete || '').trim().toUpperCase();

    if (!targetTicket) {
      return { success: false, inSheets: false, message: 'Código de tiquete no especificado.' };
    }

    if (!sheetPart || sheetPart.getLastRow() <= 1) {
      return { success: false, inSheets: false, message: 'No hay participantes registrados.' };
    }

    var pData = sheetPart.getDataRange().getValues();
    var headers = pData[0].map(function(h){ return String(h).toLowerCase().trim(); });

    var ticketColIdx = -1;
    var numColIdx = -1;
    for (var c = 0; c < headers.length; c++) {
      var h = headers[c];
      if (h.indexOf('ticket') !== -1 || h.indexOf('tiquete') !== -1 || h.indexOf('cdigo') !== -1 || h.indexOf('codigo') !== -1) {
        ticketColIdx = c;
      }
      if (h.indexOf('nmero') !== -1 || h.indexOf('numero') !== -1 || h === 'boleta' || h === '#') {
        numColIdx = c;
      }
    }
    if (ticketColIdx === -1) ticketColIdx = 9;
    if (numColIdx === -1) numColIdx = 4;

    var rowIndex = -1;
    var rowData = null;
    for (var r = 1; r < pData.length; r++) {
      var val = String(pData[r][ticketColIdx] || '').trim().toUpperCase();
      if (val === targetTicket) {
        rowIndex = r + 1; // 1-indexado para Google Sheets
        rowData = pData[r];
        break;
      }
    }

    // Búsqueda exhaustiva por si el código está en otra columna
    if (rowIndex === -1) {
      for (var r2 = 1; r2 < pData.length; r2++) {
        for (var col = 0; col < pData[r2].length; col++) {
          var cellVal = String(pData[r2][col] || '').trim().toUpperCase();
          if (cellVal === targetTicket) {
            rowIndex = r2 + 1;
            rowData = pData[r2];
            break;
          }
        }
        if (rowIndex !== -1) break;
      }
    }

    var numsLiberados = [];
    if (rowData) {
      var numerosStr = String(rowData[numColIdx] || '');
      numsLiberados = numerosStr.split(/[,;\s]+/).map(function(s){ return s.trim(); }).filter(Boolean);
    }
    // Fallback a los números pasados en la petición si no se encontraron en la fila
    if ((!numsLiberados || numsLiberados.length === 0) && data.numeros) {
      numsLiberados = (Array.isArray(data.numeros) ? data.numeros : String(data.numeros).split(/[,;\s]+/)).map(function(s){ return s.trim(); }).filter(Boolean);
    }

    // 1. Eliminar fila de la hoja Participantes
    if (rowIndex !== -1) {
      sheetPart.deleteRow(rowIndex);
    }

    // 2. Liberar números en la hoja Numeros / Talonario
    if (sheetNum && numsLiberados.length > 0) {
      var numData = sheetNum.getDataRange().getValues();
      var numMap = {};
      numsLiberados.forEach(function(n) {
        var s = String(n).trim();
        if (s.length === 1) s = '0' + s;
        numMap[s] = true;
      });

      for (var i = 1; i < numData.length; i++) {
        var cur = String(numData[i][0]).trim();
        if (cur.length === 1) cur = '0' + cur;
        if (numMap[cur]) {
          numData[i][1] = 'disponible';
        }
      }
      sheetNum.getDataRange().setValues(numData);
    }

    return {
      success: true,
      inSheets: (rowIndex !== -1),
      message: 'Tiquete ' + targetTicket + ' eliminado y números liberados exitosamente en Google Sheets',
      ticket: targetTicket,
      numeros_liberados: numsLiberados
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (eRel) {}
  }
}

/**
 * Emite y envía el Tiquete Digital Oficial al correo del participante usando Gmail de maxrf2025@gmail.com
 * Incluye copia visual (imagen adjunta y en línea) del tiquete oficial
 */
function enviarCorreoParticipante(payload) {
  var correo = payload.correo;
  if (!correo || correo.indexOf('@') === -1) {
    return { success: false, message: 'Correo inválido' };
  }
  var nombre = payload.nombre || 'Participante';
  var ticket = payload.codigo_tiquete || payload.ticket || ('MAXRF-TKT-' + Math.floor(100000 + Math.random() * 900000));
  var numeros = payload.numeros || [];
  var totalVal = (payload.total !== undefined && payload.total !== null && payload.total !== '') ? Number(payload.total) : null;
  var total = (totalVal !== null && !isNaN(totalVal)) ? totalVal : (numeros.length * Number(DEFAULT_CONFIG.precio_numero !== undefined ? DEFAULT_CONFIG.precio_numero : 0));
  var esGratis = (Number(total) === 0);
  var totalTxt = esGratis ? 'GRATIS ($0)' : ('$' + Number(total).toLocaleString('es-CO') + ' COP');
  var totalColor = esGratis ? '#059669' : '#4f46e5';

  var metodo = payload.metodo_pago || (esGratis ? 'Gratis / Promoción' : 'Nequi');
  var referencia = payload.referencia_pago || payload.referencia || (esGratis ? 'GRATIS' : '—');
  if (esGratis && (metodo.toLowerCase() === 'pendiente' || !metodo)) {
    metodo = 'Gratis / Promoción';
  }
  if (esGratis && (referencia.toLowerCase() === 'pendiente' || !referencia || referencia === '—')) {
    referencia = 'GRATIS';
  }
  var loteria = payload.loteria || (DEFAULT_CONFIG.loteria || 'Chontico Noche');
  var fechaTxt = payload.fecha || Utilities.formatDate(new Date(), 'GMT-5', 'dd/MM/yyyy hh:mm a');
  
  var inlineImages = {};
  var attachments = [];
  var tiqueteImgHtml = '';
  
  // Procesar captura visual del tiquete si viene adjunta
  var rawImg = payload.tiquete_imagen_base64 || payload.tiqueteImagenBase64;
  if (rawImg) {
    try {
      if (rawImg.indexOf(',') !== -1) {
        rawImg = rawImg.split(',')[1];
      }
      var decodedImg = Utilities.base64Decode(rawImg);
      var tktBlob = Utilities.newBlob(decodedImg, 'image/png', 'Tiquete_' + ticket + '.png');
      inlineImages['tiqueteVisual'] = tktBlob;
      attachments.push(tktBlob);
      tiqueteImgHtml = '<div style="text-align:center;margin:20px 0 25px;">' +
        '<div style="font-size:12px;font-weight:800;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">📸 Copia Visual de tu Tiquete Oficial</div>' +
        '<img src="cid:tiqueteVisual" style="width:100%;max-width:460px;border-radius:20px;border:1px solid #cbd5e1;box-shadow:0 12px 28px rgba(0,0,0,0.12);display:inline-block;" alt="Tiquete Digital MaxRF">' +
        '</div>';
    } catch (eImg) {
      Logger.log('Error procesando imagen de tiquete: ' + eImg);
    }
  }

  var numerosBadges = numeros.map(function(num) {
    return '<span style="display:inline-block;padding:8px 16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;font-size:20px;font-weight:900;border-radius:12px;margin:4px;letter-spacing:1px;box-shadow:0 3px 8px rgba(79,70,229,0.3);">' + num + '</span>';
  }).join(' ');
  
  var htmlBody = '' +
    '<div style="background-color:#f1f5f9;padding:30px 15px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.5;">' +
      '<div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 15px 35px rgba(0,0,0,0.06);">' +
        '<div style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);padding:28px 24px;text-align:center;color:#ffffff;">' +
          '<div style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#818cf8;margin-bottom:6px;">Sorteos Oficiales</div>' +
          '<h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px;">DinamicaMaxRF 🍀</h1>' +
          '<div style="display:inline-block;margin-top:12px;padding:4px 14px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);color:#34d399;border-radius:999px;font-size:12px;font-weight:700;">' +
            '● Tiquete Digital Oficial' +
          '</div>' +
        '</div>' +
        '<div style="padding:28px 24px;">' +
          '<p style="font-size:16px;color:#334155;margin-top:0;margin-bottom:12px;">Hola <strong>' + nombre + '</strong>,</p>' +
          '<p style="font-size:14px;color:#64748b;margin-bottom:18px;">' +
            'Tu participación ha quedado registrada exitosamente. A continuación encuentras tu tiquete oficial con tus números de la suerte para el sorteo de <strong>' + loteria + '</strong>.' +
          '</p>' +
          tiqueteImgHtml +
          '<div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:18px;padding:22px;text-align:center;margin-bottom:24px;">' +
            '<div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Código de Tiquete</div>' +
            '<div style="font-size:16px;font-weight:900;color:#0f172a;letter-spacing:1px;font-family:monospace;background:#e2e8f0;display:inline-block;padding:4px 14px;border-radius:8px;margin-bottom:18px;">' + ticket + '</div>' +
            '<div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Tus Números de la Suerte</div>' +
            '<div style="margin-bottom:18px;">' + numerosBadges + '</div>' +
            '<table style="width:100%;border-top:1px solid #e2e8f0;padding-top:14px;font-size:13px;color:#475569;text-align:left;">' +
              '<tr><td style="padding:4px 0;color:#94a3b8;">Titular:</td><td style="padding:4px 0;font-weight:700;text-align:right;color:#1e293b;">' + nombre + '</td></tr>' +
              '<tr><td style="padding:4px 0;color:#94a3b8;">Total:</td><td style="padding:4px 0;font-weight:900;text-align:right;color:' + totalColor + ';font-size:15px;">' + totalTxt + '</td></tr>' +
              '<tr><td style="padding:4px 0;color:#94a3b8;">Método / Ref:</td><td style="padding:4px 0;font-weight:600;text-align:right;color:#1e293b;">' + metodo + ' (' + referencia + ')</td></tr>' +
              '<tr><td style="padding:4px 0;color:#94a3b8;">Fecha emisión:</td><td style="padding:4px 0;font-weight:600;text-align:right;color:#1e293b;">' + fechaTxt + '</td></tr>' +
              '<tr><td style="padding:4px 0;color:#94a3b8;">Lotería:</td><td style="padding:4px 0;font-weight:700;text-align:right;color:#059669;">' + loteria + '</td></tr>' +
            '</table>' +
          '</div>' +
          '<div style="text-align:center;margin-bottom:20px;">' +
            '<a href="https://chat.whatsapp.com/CcgA2Uzy7qGJDdgIzILhm7" style="display:inline-block;padding:12px 24px;background:#25d366;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;border-radius:12px;box-shadow:0 4px 12px rgba(37,211,102,0.3);">' +
              '💬 Unirme a la Comunidad VIP en WhatsApp' +
            '</a>' +
          '</div>' +
          '<p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">' +
            'Guarda este correo como respaldo oficial. ¡Mucho éxito y que la suerte esté contigo!' +
          '</p>' +
        '</div>' +
        '<div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">' +
          '© 2026 DinamicaMaxRF • Contacto: maxrf2025@gmail.com • +57 318 817 8457' +
        '</div>' +
      '</div>' +
    '</div>';

  var mailOptions = {
    htmlBody: htmlBody,
    name: 'DinamicaMaxRF Oficial'
  };
  // Si el destinatario es el cliente, enviamos una copia oculta a maxrf2025@gmail.com para el archivo del negocio
  if (correo.toLowerCase().trim() !== 'maxrf2025@gmail.com') {
    mailOptions.bcc = 'maxrf2025@gmail.com';
  }
  if (Object.keys(inlineImages).length > 0) {
    mailOptions.inlineImages = inlineImages;
  }
  if (attachments.length > 0) {
    mailOptions.attachments = attachments;
  }

  try {
    GmailApp.sendEmail(correo, '🍀 Tu Tiquete Oficial de Reserva - DinamicaMaxRF (' + ticket + ')', 'Tu tiquete oficial es: ' + ticket + ' con números: ' + numeros.join(', '), mailOptions);
    return { success: true, message: 'Correo enviado al cliente ' + correo };
  } catch (e) {
    mailOptions.to = correo;
    mailOptions.subject = '🍀 Tu Tiquete Oficial de Reserva - DinamicaMaxRF (' + ticket + ')';
    MailApp.sendEmail(mailOptions);
    return { success: true, message: 'Correo enviado vía MailApp a ' + correo };
  }
}

function inicializarHojaNumeros(ss) {
  var sheet = ss.insertSheet('Numeros');
  var data = [['Numero', 'Estado']];
  for (var i = 0; i <= 99; i++) {
    var str = i < 10 ? ('0' + i) : ('' + i);
    data.push([str, 'disponible']);
  }
  sheet.getRange(1, 1, data.length, 2).setValues(data);
  return sheet;
}

function actualizarConfiguracion(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetConfig = obtenerHojaConfig(ss);
  
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet('Config');
    sheetConfig.appendRow(['Clave', 'Valor', 'Descripcion']);
  }
  
  var existing = sheetConfig.getDataRange().getValues();
  var keyRowMap = {};
  for (var i = 0; i < existing.length; i++) {
    var rawKey = String(existing[i][0] || '').trim();
    var cleanKey = rawKey.replace(/:+$/, '').trim().toLowerCase();
    if (cleanKey && cleanKey !== 'clave' && cleanKey !== 'key') {
      keyRowMap[cleanKey] = i + 1; // Fila 1-indexada en Sheets
    }
  }
  
  var updates = data.config || {};
  for (var k in updates) {
    var cleanK = String(k).trim().replace(/:+$/, '').toLowerCase();
    var val = updates[k];
    if (keyRowMap[cleanK]) {
      sheetConfig.getRange(keyRowMap[cleanK], 2).setValue(val);
    } else {
      sheetConfig.appendRow([k + ':', val, 'Configuracion Dinamica']);
      keyRowMap[cleanK] = sheetConfig.getLastRow();
    }
  }
  
  return { success: true, message: 'Configuracion guardada exitosamente en Google Sheets' };
}

function obtenerHojaConfig(ss) {
  var names = ['Config', 'config', 'CONFIG', 'Configuracion', 'Configuración', 'Parametros', 'Parámetros', 'Ajustes', 'Dinamica', 'Dinámica', 'Premio', 'Hoja 1', 'Sheet1'];
  for (var i = 0; i < names.length; i++) {
    var s = ss.getSheetByName(names[i]);
    if (s) return s;
  }
  var allSheets = ss.getSheets();
  for (var j = 0; j < allSheets.length; j++) {
    var sheetName = allSheets[j].getName().toLowerCase();
    if (sheetName.indexOf('config') !== -1 || sheetName.indexOf('dinamica') !== -1 || sheetName.indexOf('premio') !== -1 || sheetName.indexOf('ajuste') !== -1) {
      return allSheets[j];
    }
  }
  // Búsqueda inteligente por contenido en Columna A
  for (var k = 0; k < allSheets.length; k++) {
    var sh = allSheets[k];
    if (sh.getLastRow() >= 1) {
      var colA = sh.getRange(1, 1, Math.min(sh.getLastRow(), 15), 1).getValues();
      for (var r = 0; r < colA.length; r++) {
        var txt = String(colA[r][0] || '').toLowerCase();
        if (txt.indexOf('premio_titulo') !== -1 || txt.indexOf('precio_numero') !== -1) {
          return sh;
        }
      }
    }
  }
  return null;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Obtiene la carpeta de Google Drive donde reside la hoja 'Rifa Digital - Base de Datos'
 * (la carpeta 'Talonario'). Si no se detecta el contenedor, busca 'Talonario' en Drive.
 */
function obtenerCarpetaBaseTalonario(ss) {
  try {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var file = DriveApp.getFileById(ss.getId());
    var parents = file.getParents();
    if (parents.hasNext()) {
      return parents.next();
    }
  } catch (e) {
    Logger.log('Error obteniendo carpeta padre del Sheet: ' + e);
  }
  
  try {
    var folders = DriveApp.getFoldersByName('Talonario');
    if (folders.hasNext()) {
      return folders.next();
    }
  } catch (e2) {}
  
  return DriveApp.getRootFolder();
}

/**
 * Obtiene o crea una subcarpeta dentro de la carpeta 'Talonario' (junto a la hoja de cálculo).
 */
function obtenerSubcarpetaTalonario(ss, nombreSubcarpeta) {
  var baseFolder = obtenerCarpetaBaseTalonario(ss);
  var subfolders = baseFolder.getFoldersByName(nombreSubcarpeta);
  if (subfolders.hasNext()) {
    return subfolders.next();
  }
  var newFolder = baseFolder.createFolder(nombreSubcarpeta);
  try {
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (eShare) {}
  return newFolder;
}

/**
 * Autentica de manera segura al administrador comparando la clave en el Google Sheet.
 * La clave NUNCA se expone públicamente ni en GitHub ni en las peticiones web.
 */
function verificarLoginAdmin(data) {
  var email = String(data.email || '').trim().toLowerCase();
  var pin = String(data.pin || '').trim();

  if (!email || !pin) {
    return { success: false, message: 'Por favor ingresa tu correo y contraseña.' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetConfig = obtenerHojaConfig(ss);
  var secretPin = '';

  if (sheetConfig) {
    // 1. Revisar celda A23 / B23 (como solicitó el usuario)
    try {
      var valA23 = String(sheetConfig.getRange('A23').getValue() || '').trim();
      var valB23 = String(sheetConfig.getRange('B23').getValue() || '').trim();

      // Si A23 es la etiqueta (ej. admin_pin, clave, pin) y B23 es el valor:
      if (valB23 && (valA23.toLowerCase().indexOf('pin') !== -1 || valA23.toLowerCase().indexOf('clave') !== -1 || valA23.toLowerCase().indexOf('pass') !== -1 || valA23.toLowerCase().indexOf('admin') !== -1)) {
        secretPin = valB23;
      } else if (valA23 && !valB23) {
        // Si el usuario escribió la contraseña directamente en la celda A23:
        secretPin = valA23;
      } else if (valB23) {
        secretPin = valB23;
      }
    } catch (e23) {}

    // 2. Si no se encontró en A23/B23, buscar en toda la hoja Config por nombre de clave
    if (!secretPin && sheetConfig.getLastRow() >= 1) {
      var cData = sheetConfig.getDataRange().getValues();
      for (var i = 0; i < cData.length; i++) {
        var k = String(cData[i][0] || '').replace(/:+$/, '').trim().toLowerCase();
        if (k === 'admin_pin' || k === 'pin_admin' || k === 'clave_admin' || k === 'password_admin' || k === 'clave' || k === 'pin' || k === 'password') {
          var v = String(cData[i][1] || '').trim();
          if (v) {
            secretPin = v;
            break;
          }
        }
      }
    }
  }

  // Fallback si aún no se ha escrito en el Sheet
  if (!secretPin) {
    secretPin = 'maxrf2025';
  }

  var validEmails = ['maxrf2025@gmail.com', 'admin@maxrf.com', 'maxrf'];
  var emailOk = validEmails.indexOf(email) !== -1 || email.indexOf('maxrf') !== -1;
  var pinOk = (pin === secretPin);

  if (emailOk && pinOk) {
    return {
      success: true,
      message: 'Autenticación exitosa'
    };
  } else {
    return {
      success: false,
      message: 'Credenciales incorrectas. Verifica el correo y la contraseña de acceso.'
    };
  }
}

