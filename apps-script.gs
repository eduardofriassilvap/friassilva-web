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
var TOKEN = 'fsp2026secreto';

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
 * fila con los títulos de las columnas y le da formato prolijo.
 */
function obtenerHoja() {
  var planilla = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = planilla.getSheetByName(NOMBRE_HOJA);
  var esNueva = false;

  if (!hoja) {
    hoja = planilla.insertSheet(NOMBRE_HOJA);
    esNueva = true;
  }
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    esNueva = true;
  }
  if (esNueva) {
    formatearHoja(hoja);
  }
  return hoja;
}

/**
 * Le da formato prolijo a la hoja: encabezado en negrita con fondo de
 * color y letra blanca, fila de títulos fija arriba (no se mueve al
 * desplazarse hacia abajo), columnas con un ancho pensado para que se
 * lea todo sin achicar la letra, franjas de color alternadas fila por
 * fila para que sea más fácil de leer, y un filtro en el encabezado
 * para poder ordenar o buscar por cualquier columna.
 *
 * Está pensada para poder ejecutarse más de una vez sin romper nada
 * (por eso saca las franjas y el filtro viejos antes de poner los
 * nuevos).
 */
function formatearHoja(hoja) {
  var columnas = COLUMNAS.length;

  hoja.getRange(1, 1, 1, columnas)
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#12212F')
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center');
  hoja.setRowHeight(1, 34);
  hoja.setFrozenRows(1);

  // Orden de columnas: Fecha, Código, Nombre, Fecha de nacimiento,
  // Teléfono, Vehículo, Cobertura.
  var anchos = [130, 95, 190, 140, 110, 200, 230];
  for (var i = 0; i < anchos.length; i++) {
    hoja.setColumnWidth(i + 1, anchos[i]);
  }

  var bandeadosViejos = hoja.getBandings();
  for (var b = 0; b < bandeadosViejos.length; b++) bandeadosViejos[b].remove();
  hoja.getRange(1, 1, 1000, columnas)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);

  var filtroViejo = hoja.getFilter();
  if (filtroViejo) filtroViejo.remove();
  hoja.getRange(1, 1, hoja.getMaxRows(), columnas).createFilter();
}

/**
 * Esto NO lo usa la web ni se ejecuta solo. Es para vos: si alguna vez
 * querés volver a ordenar la planilla a mano (por ejemplo, la primera
 * vez, porque ya tenía filas de prueba cargadas antes de este cambio),
 * elegí esta función en el menú desplegable de arriba del editor
 * (al lado de "Depurar") y apretá el botón de Ejecutar (▶).
 */
function ordenarPlanillaAhora() {
  formatearHoja(obtenerHoja());
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
