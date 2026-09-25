/**
 * Apps Script de la planilla "Clientes potenciales".
 *
 * Qué hace: cuando alguien cotiza un auto en la web y toca "Enviar mi
 * cotización", la página le manda a este script los datos de esa consulta,
 * y este script los agrega como una fila nueva en la planilla.
 *
 * Cómo instalarlo: seguí los pasos de INSTRUCCIONES-PLANILLA.md. No hace
 * falta que entiendas todo el código para instalarlo, pero está comentado
 * por si querés mirarlo.
 */

// ─────────────────────────────────────────────────────────────────────────
// 1) Elegí acá tu propio token secreto (podés inventar cualquier palabra o
//    frase, sin espacios). Después tenés que poner ESTE MISMO valor en
//    TOKEN_PLANILLA, dentro de index.html. Sirve para que solo la web
//    pueda escribir filas, y no cualquiera que encuentre esta dirección.
var TOKEN = 'CAMBIAR_ESTE_TOKEN';

// Nombre de la pestaña (hoja) donde se guardan los datos.
var NOMBRE_HOJA = 'Clientes potenciales';

// Columnas de la planilla, en este orden exacto.
var COLUMNAS = ['Fecha', 'Código', 'Nombre', 'Fecha de nacimiento', 'Teléfono', 'Vehículo', 'Cobertura'];

/**
 * Se ejecuta automáticamente cada vez que la web manda una cotización.
 * "e" trae los datos que mandó la página, en formato JSON.
 */
function doPost(e) {
  try {
    var datos = JSON.parse(e.postData.contents);

    // Si el token no coincide con el nuestro, no guardamos nada.
    if (datos.token !== TOKEN) {
      return respuesta({ ok: false, error: 'Token inválido' });
    }

    var hoja = obtenerHoja();

    // Fecha y hora de ahora mismo, en formato día/mes/año hora:minuto,
    // con el huso horario de Argentina (para que no se desordene aunque
    // el servidor de Google esté en otro país).
    var fecha = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm');

    // Agrega la fila nueva al final de la planilla, en el mismo orden que
    // las columnas de arriba. La columna "Teléfono" se deja vacía a
    // propósito: la completan ustedes a mano después de hablar con el
    // cliente.
    hoja.appendRow([
      fecha,
      datos.codigo || '',
      datos.nombre || '',
      datos.nacimiento || '',
      '',
      datos.vehiculo || '',
      datos.cobertura || ''
    ]);

    return respuesta({ ok: true });
  } catch (error) {
    // Si algo sale mal (datos mal formados, etc.), devolvemos el motivo
    // en vez de romper todo. La web no lee esta respuesta, pero sirve
    // para probar el script a mano mientras lo instalás.
    return respuesta({ ok: false, error: String(error) });
  }
}

/**
 * Busca la pestaña "Clientes potenciales" dentro de la planilla. Si no
 * existe, la crea. Y si está vacía (recién creada), escribe primero la
 * fila con los títulos de las columnas.
 */
function obtenerHoja() {
  var planilla = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = planilla.getSheetByName(NOMBRE_HOJA);

  if (!hoja) {
    hoja = planilla.insertSheet(NOMBRE_HOJA);
  }
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
  }
  return hoja;
}

/** Arma una respuesta simple en formato JSON. */
function respuesta(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Esto NO lo usa la web. Es solo para que, si alguna vez pegás la URL del
 * script en el navegador para probar que está bien implementado, te
 * aparezca un mensaje en vez de una página de error.
 */
function doGet(e) {
  return ContentService.createTextOutput('El script de la planilla está andando. Para guardar datos hay que mandarle un POST, no se usa así.');
}
