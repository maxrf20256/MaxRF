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
  estado_rifa: 'activa'
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
  var reservadosMap = {};
  
  if (sheetPart && sheetPart.getLastRow() > 1) {
    var partData = sheetPart.getDataRange().getValues();
    var headers = partData[0].map(function(h){ return String(h).toLowerCase().trim(); });
    var numColIdx = -1;
    for (var c = 0; c < headers.length; c++) {
      if (headers[c].indexOf('nmero') !== -1 || headers[c].indexOf('numero') !== -1 || headers[c] === 'boleta' || headers[c] === '#') {
        numColIdx = c;
        break;
      }
    }
    if (numColIdx !== -1) {
      for (var r = 1; r < partData.length; r++) {
        var val = String(partData[r][numColIdx] || '').trim();
        if (val) {
          var splitNums = val.split(/[,;\s]+/);
          for (var k = 0; k < splitNums.length; k++) {
            var nStr = splitNums[k].trim();
            if (nStr !== '') {
              if (nStr.length === 1) nStr = '0' + nStr;
              reservadosMap[nStr] = true;
            }
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
    
    // Si hay hoja Participantes y el número no figura ahí, reconciliar a disponible
    if (sheetPart && sheetPart.getLastRow() > 1) {
      if (!reservadosMap[num] && estadoActual !== 'disponible') {
        estadoActual = 'disponible';
        dataNum[i][1] = 'disponible';
        updatesNeeded = true;
      } else if (reservadosMap[num] && estadoActual === 'disponible') {
        estadoActual = 'reservado';
        dataNum[i][1] = 'reservado';
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
        config[cleanK] = v;
        if (cleanK === 'premio_titulo') config['premio'] = v;
        if (cleanK === 'premio') config['premio_titulo'] = v;
      }
    }
  }
  
  return {
    success: true,
    config: config,
    numeros: listaNumeros
  };
}

/**
 * Procesa la reserva en el Sheet y envía el correo si se solicitó.
 */
function procesarReserva(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetPart = ss.getSheetByName('Participantes') || ss.insertSheet('Participantes');
  var sheetNum = ss.getSheetByName('Numeros') || ss.getSheetByName('Talonario');
  
  if (sheetPart.getLastRow() === 0) {
    sheetPart.appendRow([
      'Fecha', 'Nombre', 'Teléfono', 'Correo', 'Números', 
      'Total', 'Método Pago', 'Referencia', 'Comprobante URL', 'Código Tiquete'
    ]);
  }
  
  var numerosStr = (data.numeros || []).join(', ');
  var fecha = new Date();
  var ticketCode = data.ticket || ('MAXRF-TKT-' + Math.floor(100000 + Math.random() * 900000));
  
  var comprobanteUrl = '';
  if (data.comprobanteBase64 && data.comprobanteFilename) {
    try {
      var folderName = 'Comprobantes MaxRF';
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      var decoded = Utilities.base64Decode(data.comprobanteBase64);
      var blob = Utilities.newBlob(decoded, data.comprobanteMimetype || 'image/jpeg', data.comprobanteFilename);
      var file = folder.createFile(blob);
      comprobanteUrl = file.getUrl();
    } catch (e) {
      Logger.log('Error guardando en Drive: ' + e);
    }
  }
  
  sheetPart.appendRow([
    fecha,
    data.nombre || '',
    data.telefono || '',
    data.correo || '',
    numerosStr,
    data.total || 0,
    data.metodo_pago || '',
    data.referencia || '',
    comprobanteUrl,
    ticketCode
  ]);
  
  if (sheetNum) {
    var numData = sheetNum.getDataRange().getValues();
    var selMap = {};
    (data.numeros || []).forEach(function(n) {
      var s = String(n).trim();
      if (s.length === 1) s = '0' + s;
      selMap[s] = true;
    });
    
    for (var i = 1; i < numData.length; i++) {
      var cur = String(numData[i][0]).trim();
      if (cur.length === 1) cur = '0' + cur;
      if (selMap[cur]) {
        numData[i][1] = 'reservado';
      }
    }
    sheetNum.getDataRange().setValues(numData);
  }
  
  if (data.enviar_correo && data.correo) {
    try {
      enviarCorreoParticipante(data);
    } catch (errEmail) {
      Logger.log('Error enviando correo: ' + errEmail);
    }
  }
  
  return {
    success: true,
    ticket: ticketCode,
    message: 'Reserva procesada exitosamente'
  };
}

/**
 * Emite y envía el Tiquete Digital Oficial al correo del participante usando Gmail de maxrf2025@gmail.com
 */
function enviarCorreoParticipante(payload) {
  var correo = payload.correo;
  if (!correo || correo.indexOf('@') === -1) {
    return { success: false, message: 'Correo inválido' };
  }
  var nombre = payload.nombre || 'Participante';
  var ticket = payload.ticket || ('MAXRF-TKT-' + Math.floor(100000 + Math.random() * 900000));
  var numeros = payload.numeros || [];
  var total = payload.total || (numeros.length * (DEFAULT_CONFIG.precio_numero || 900));
  var metodo = payload.metodo_pago || 'Nequi';
  var referencia = payload.referencia || '—';
  var loteria = payload.loteria || 'Chontico Noche';
  var fechaTxt = Utilities.formatDate(new Date(), 'GMT-5', 'dd/MM/yyyy hh:mm a');
  
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
          '<p style="font-size:16px;color:#334155;margin-top:0;margin-bottom:18px;">Hola <strong>' + nombre + '</strong>,</p>' +
          '<p style="font-size:14px;color:#64748b;margin-bottom:24px;">' +
            'Tu participación ha quedado registrada exitosamente. A continuación encuentras tu tiquete oficial con tus números de la suerte para el sorteo de <strong>' + loteria + '</strong>.' +
          '</p>' +
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

  try {
    GmailApp.sendEmail(correo, '🍀 Tu Tiquete Oficial de Reserva - DinamicaMaxRF (' + ticket + ')', 'Tu tiquete oficial es: ' + ticket + ' con números: ' + numeros.join(', '), {
      htmlBody: htmlBody,
      name: 'DinamicaMaxRF Oficial'
    });
    return { success: true, message: 'Correo enviado a ' + correo };
  } catch (e) {
    MailApp.sendEmail({
      to: correo,
      subject: '🍀 Tu Tiquete Oficial de Reserva - DinamicaMaxRF (' + ticket + ')',
      htmlBody: htmlBody,
      name: 'DinamicaMaxRF Oficial'
    });
    return { success: true, message: 'Correo enviado vía MailApp' };
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
  var names = ['Config', 'config', 'CONFIG', 'Configuracion', 'Configuración', 'Hoja 1', 'Sheet1'];
  for (var i = 0; i < names.length; i++) {
    var s = ss.getSheetByName(names[i]);
    if (s) return s;
  }
  var allSheets = ss.getSheets();
  for (var j = 0; j < allSheets.length; j++) {
    if (allSheets[j].getName().toLowerCase().indexOf('config') !== -1) {
      return allSheets[j];
    }
  }
  return null;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
