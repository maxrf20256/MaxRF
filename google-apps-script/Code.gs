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
  precio_numero: 900,
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
      if (rawEstado.indexOf('pag') !== -1 || rawEstado.indexOf('conf') !== -1) {
        estadoFinal = 'vendido';
      } else if (rawEstado.indexOf('rech') !== -1 || rawEstado.indexOf('canc') !== -1) {
        estadoFinal = 'disponible';
      } else {
        if (rawRef.indexOf('pendiente') !== -1) {
          estadoFinal = 'reservado';
        } else if (rawRef.length > 0 && rawRef !== '0') {
          estadoFinal = 'vendido';
        } else {
          estadoFinal = 'reservado';
        }
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
      if (cleanK === 'clave' || cleanK === 'key' || cleanK === 'parametro' || cleanK === 'nombre') {
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
    for (var p = 1; p < pRows.length; p++) {
      var row = pRows[p];
      var rawTicket = String(row[9] || '').trim();
      if (!rawTicket) continue;
      var rawNums = String(row[4] || '');
      var arrNums = rawNums.split(/[,;\s]+/).map(function(s){return s.trim();}).filter(Boolean);
      var rawRef = String(row[7] || '').trim();
      var rawEstado = String(row[10] || '').trim();
      if (!rawEstado) {
        rawEstado = (rawRef.toLowerCase().indexOf('pendiente') !== -1) ? 'Pendiente' : 'Pagado';
      }
      listaParticipantes.push({
        fecha: row[0],
        nombre: row[1],
        telefono: row[2],
        correo: row[3],
        numeros: arrNums,
        total: row[5],
        metodo_pago: row[6],
        referencia_pago: row[7],
        comprobante_url: row[8],
        ticket: rawTicket,
        codigo_tiquete: rawTicket,
        estado: rawEstado,
        tiquete_imagen_url: row[11] || ''
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPart = ss.getSheetByName('Participantes') || ss.insertSheet('Participantes');
  var sheetNum = ss.getSheetByName('Numeros') || ss.getSheetByName('Talonario');
  
  if (sheetPart.getLastRow() === 0) {
    sheetPart.appendRow([
      'Fecha', 'Nombre', 'Teléfono', 'Correo', 'Números', 
      'Total', 'Método Pago', 'Referencia', 'Comprobante URL', 'Código Tiquete', 'Estado', 'Tiquete Drive URL'
    ]);
  }
  
  var numerosStr = (data.numeros || []).join(', ');
  var fecha = new Date();
  var ticketCode = data.ticket || data.codigo_tiquete || ('MAXRF-' + Math.floor(100000 + Math.random() * 900000));
  
  // 1. Guardar comprobante si se adjuntó imagen
  var compB64 = data.comprobante_base64 || data.comprobanteBase64;
  var compName = data.comprobante_filename || data.comprobanteFilename || 'comprobante.png';
  var compMime = data.comprobante_mimetype || data.comprobanteMimetype || 'image/png';
  var comprobanteUrl = '';
  if (compB64) {
    try {
      var folderName = 'Comprobantes MaxRF';
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
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

  // 2. Guardar imagen oficial del tiquete en Google Drive (Tiquetes Emitidos MaxRF)
  var tktB64 = data.tiquete_imagen_base64 || data.tiqueteImagenBase64;
  var tiqueteDriveUrl = '';
  if (tktB64) {
    try {
      var tktFolderName = 'Tiquetes Emitidos MaxRF';
      var tktFolders = DriveApp.getFoldersByName(tktFolderName);
      var tktFolder = tktFolders.hasNext() ? tktFolders.next() : DriveApp.createFolder(tktFolderName);
      tktFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
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

  // 3. Determinar estado inicial
  var refPago = String(data.referencia_pago || data.referencia || '').trim();
  var metPago = String(data.metodo_pago || '').trim();
  var esPendiente = refPago.toLowerCase().indexOf('pendiente') !== -1 || metPago.toLowerCase().indexOf('pendiente') !== -1;
  var estadoInicial = esPendiente ? 'Pendiente' : 'Pagado';

  sheetPart.appendRow([
    fecha,
    data.nombre || '',
    data.telefono || '',
    data.correo || '',
    numerosStr,
    data.total || 0,
    metPago,
    refPago,
    comprobanteUrl,
    ticketCode,
    estadoInicial,
    tiqueteDriveUrl
  ]);
  
  // 4. Marcar números en talonario
  if (sheetNum) {
    var numData = sheetNum.getDataRange().getValues();
    var selMap = {};
    (data.numeros || []).forEach(function(n) {
      var s = String(n).trim();
      if (s.length === 1) s = '0' + s;
      selMap[s] = true;
    });
    
    var estadoNum = esPendiente ? 'reservado' : 'vendido';
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
  for (var r = 1; r < pData.length; r++) {
    var row = pData[r];
    var ticketCode = String(row[9] || '').trim();
    var tel = String(row[2] || '').trim();
    var nombre = String(row[1] || '').trim();
    if (ticketCode.toLowerCase() === target || tel.toLowerCase() === target || (target.length >= 3 && nombre.toLowerCase().indexOf(target) !== -1)) {
      return {
        success: true,
        participante: {
          fecha: row[0],
          nombre: row[1],
          telefono: row[2],
          correo: row[3],
          numeros: String(row[4]).split(/[,;\s]+/).map(function(s){return s.trim();}).filter(Boolean),
          total: row[5],
          metodo_pago: row[6],
          referencia_pago: row[7],
          comprobante_url: row[8],
          ticket: row[9],
          codigo_tiquete: row[9],
          estado: row[10] || (String(row[7]).toLowerCase().indexOf('pendiente') !== -1 ? 'Pendiente' : 'Pagado'),
          tiquete_imagen_url: row[11] || ''
        }
      };
    }
  }
  return { success: false, message: 'Tiquete no encontrado.' };
}

/**
 * Actualiza el estado del tiquete (de Pendiente a Pagado, etc.), guarda el nuevo soporte en Drive y actualiza el talonario.
 */
function actualizarEstadoTiquete(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPart = ss.getSheetByName('Participantes') || ss.getSheetByName('Ventas');
  var sheetNum = ss.getSheetByName('Numeros') || ss.getSheetByName('Talonario');
  var targetTicket = String(data.ticket || data.codigo_tiquete || '').trim().toUpperCase();
  var nuevoEstado = String(data.nuevo_estado || data.estado || 'Pagado').trim();
  
  if (!sheetPart) {
    return { success: false, message: 'Hoja Participantes no encontrada' };
  }
  
  var pData = sheetPart.getDataRange().getValues();
  var rowIndex = -1;
  var rowData = null;
  for (var r = 1; r < pData.length; r++) {
    if (String(pData[r][9] || '').trim().toUpperCase() === targetTicket) {
      rowIndex = r + 1; // 1-indexado en Sheets
      rowData = pData[r];
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { success: false, message: 'No se encontró el tiquete ' + targetTicket };
  }
  
  // Guardar nueva imagen de soporte en Drive si se envió
  var nuevoDriveUrl = '';
  var tktB64 = data.tiquete_imagen_base64 || data.tiqueteImagenBase64;
  if (tktB64) {
    try {
      var tktFolderName = 'Tiquetes Emitidos MaxRF';
      var tktFolders = DriveApp.getFoldersByName(tktFolderName);
      var tktFolder = tktFolders.hasNext() ? tktFolders.next() : DriveApp.createFolder(tktFolderName);
      tktFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      if (tktB64.indexOf(',') !== -1) {
        tktB64 = tktB64.split(',')[1];
      }
      var tktDecoded = Utilities.base64Decode(tktB64);
      var tktBlob = Utilities.newBlob(tktDecoded, 'image/png', 'Soporte_' + nuevoEstado.toUpperCase() + '_' + targetTicket + '.png');
      var tktFile = tktFolder.createFile(tktBlob);
      tktFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      nuevoDriveUrl = tktFile.getUrl();
    } catch (eDrive) {
      Logger.log('Error actualizando imagen en Drive: ' + eDrive);
    }
  }
  
  // Actualizar columna Estado (Col 11) y Tiquete Drive URL (Col 12)
  sheetPart.getRange(rowIndex, 11).setValue(nuevoEstado);
  if (nuevoDriveUrl) {
    sheetPart.getRange(rowIndex, 12).setValue(nuevoDriveUrl);
  }
  
  // Actualizar estado en la hoja Numeros
  var numerosStr = String(rowData[4] || '');
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
    message: 'Tiquete ' + targetTicket + ' actualizado a ' + nuevoEstado,
    ticket: targetTicket,
    codigo_tiquete: targetTicket,
    nuevo_estado: nuevoEstado,
    tiquete_drive_url: nuevoDriveUrl || rowData[11] || ''
  };
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
  var total = payload.total || (numeros.length * (DEFAULT_CONFIG.precio_numero || 900));
  var metodo = payload.metodo_pago || 'Nequi';
  var referencia = payload.referencia_pago || payload.referencia || '—';
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
              '<tr><td style="padding:4px 0;color:#94a3b8;">Total:</td><td style="padding:4px 0;font-weight:900;text-align:right;color:#4f46e5;font-size:15px;">$' + Number(total).toLocaleString('es-CO') + ' COP</td></tr>' +
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
