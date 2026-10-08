/**
 * Apps Script de la planilla "Clientes potenciales".
 *
 * Qué hace: la web le manda a este script los datos de dos formularios y
 * este script los agrega como una fila nueva en la pestaña que corresponde:
 *   - Cotizaciones del auto  ->  pestaña "Clientes potenciales"
 *   - Avisos de siniestro    ->  pestaña "Siniestros" (en la misma planilla)
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

// Pestaña y columnas de las cotizaciones, en este orden exacto.
var NOMBRE_HOJA = 'Clientes potenciales';
var COLUMNAS = ['Fecha', 'Código', 'Nombre', 'Fecha de nacimiento', 'Teléfono', 'Vehículo', 'Cobertura'];
var ANCHOS = [130, 95, 190, 140, 110, 200, 230];

// Pestaña y columnas de los siniestros, en este orden exacto.
var NOMBRE_HOJA_SINIESTROS = 'Siniestros';
var COLUMNAS_SINIESTROS = ['Fecha de aviso', 'Nombre y apellido', 'Teléfono', 'Patente o N° de póliza', 'Cuándo ocurrió', 'Qué ocurrió', '¿Hubo heridos?'];
var ANCHOS_SINIESTROS = [130, 200, 130, 170, 120, 170, 120];

// Cuántos avisos como máximo se aceptan por minuto, entre todos los
// visitantes juntos. Frena a quien intente llenar la planilla de basura.
var MAX_POR_MINUTO = 15;

// Opciones válidas del formulario de siniestros.
var TIPOS_SINIESTRO = ['Choque', 'Robo o intento de robo', 'Granizo', 'Rotura de cristales', 'Incendio', 'Otro'];

/**
 * Se ejecuta automáticamente cada vez que la web manda datos.
 * "e" trae los datos que mandó la página, en formato JSON.
 */
function doPost(e) {
  var candado = LockService.getScriptLock();
  try {
    var crudo = e.postData.contents;
    if (crudo.length > 5000) {
      return respuesta({ ok: false, error: 'Mensaje demasiado largo' });
    }
    var datos = JSON.parse(crudo);

    // Si el token no coincide con el nuestro, no guardamos nada.
    if (datos.token !== TOKEN) {
      return respuesta({ ok: false, error: 'Token inválido' });
    }

    // Un solo aviso a la vez, para que el control de abajo sea confiable.
    candado.waitLock(10000);

    if (!pasaControlDeEnvios(crudo)) {
      return respuesta({ ok: false, error: 'Demasiados envíos' });
    }

    // Fecha y hora de ahora mismo, en formato día/mes/año hora:minuto,
    // con el huso horario de Argentina (para que no se desordene aunque
    // el servidor de Google esté en otro país).
    var fecha = Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm');

    if (datos.hoja === 'siniestro') {
      // Aviso de siniestro. Se revisa cada dato; si alguno no es válido,
      // no se guarda nada.
      if (!esNombre(datos.nombre) ||
          !/^[0-9+()\-\s]{6,20}$/.test(String(datos.telefono)) ||
          !/^[A-Za-z0-9\-\s]{2,20}$/.test(String(datos.patente)) ||
          !(datos.ocurrio === '' || esFecha(datos.ocurrio)) ||
          TIPOS_SINIESTRO.indexOf(datos.tipo) === -1 ||
          (datos.heridos !== 'Sí' && datos.heridos !== 'No')) {
        return respuesta({ ok: false, error: 'Datos inválidos' });
      }
      // El teléfono se guarda siempre como texto para que Sheets no le
      // quite ceros ni lo cambie de formato.
      obtenerHoja(NOMBRE_HOJA_SINIESTROS, COLUMNAS_SINIESTROS, ANCHOS_SINIESTROS).appendRow([
        fecha,
        limpiar(datos.nombre, 60),
        "'" + limpiar(datos.telefono, 20),
        limpiar(datos.patente, 20),
        limpiar(datos.ocurrio, 10),
        limpiar(datos.tipo, 40),
        limpiar(datos.heridos, 3)
      ]);
      return respuesta({ ok: true });
    }

    // Cotización de auto. La columna "Teléfono" se deja vacía a propósito:
    // la completan ustedes a mano después de hablar con el cliente.
    if (!/^FSP-\d{4}$/.test(String(datos.codigo)) ||
        !esNombre(datos.nombre) ||
        !(datos.nacimiento === '' || esFecha(datos.nacimiento)) ||
        String(datos.vehiculo).length < 2 || String(datos.vehiculo).length > 80 ||
        String(datos.cobertura).length < 2 || String(datos.cobertura).length > 220) {
      return respuesta({ ok: false, error: 'Datos inválidos' });
    }
    obtenerHoja(NOMBRE_HOJA, COLUMNAS, ANCHOS).appendRow([
      fecha,
      limpiar(datos.codigo, 8),
      limpiar(datos.nombre, 60),
      limpiar(datos.nacimiento, 10),
      '',
      limpiar(datos.vehiculo, 80),
      limpiar(datos.cobertura, 220)
    ]);

    return respuesta({ ok: true });
  } catch (error) {
    // Si algo sale mal (datos mal formados, etc.), devolvemos un aviso
    // genérico en vez de romper todo. La web no lee esta respuesta.
    return respuesta({ ok: false, error: 'Error' });
  } finally {
    try { candado.releaseLock(); } catch (x) {}
  }
}

/**
 * Limpia un texto antes de escribirlo en la planilla: le saca caracteres
 * raros, lo recorta al largo máximo y, si empieza con = + - o @ (que
 * Sheets tomaría como una fórmula), le antepone un apóstrofo para que
 * quede como texto común.
 */
function limpiar(valor, largoMaximo) {
  var texto = String(valor === null || valor === undefined ? '' : valor)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, largoMaximo);
  if (/^[=+\-@]/.test(texto)) {
    texto = "'" + texto;
  }
  return texto;
}

/** Nombre y apellido: solo letras (con acentos y ñ), espacios, guion y apóstrofo. */
function esNombre(valor) {
  var texto = String(valor).trim();
  return texto.length >= 4 && texto.length <= 60 &&
    /^[A-Za-zÀ-ÿÑñ][A-Za-zÀ-ÿÑñ'\- ]*[A-Za-zÀ-ÿÑñ]$/.test(texto) &&
    /\s/.test(texto);
}

/** Fecha con formato día/mes/año, por ejemplo 20/09/2026. */
function esFecha(valor) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(String(valor));
}

/**
 * Control anti-abuso. Devuelve false si se superó el máximo de avisos por
 * minuto, o si llegó exactamente el mismo aviso hace menos de un minuto
 * (un doble clic, o alguien repitiendo el envío una y otra vez).
 */
function pasaControlDeEnvios(contenido) {
  var cache = CacheService.getScriptCache();

  var huella = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, contenido));
  if (cache.get('dup_' + huella)) {
    return false;
  }

  var clave = 'min_' + Math.floor(new Date().getTime() / 60000);
  var cantidad = Number(cache.get(clave) || 0);
  if (cantidad >= MAX_POR_MINUTO) {
    return false;
  }

  cache.put(clave, String(cantidad + 1), 120);
  cache.put('dup_' + huella, '1', 60);
  return true;
}

/**
 * Busca la pestaña con ese nombre dentro de la planilla. Si no existe, la
 * crea. Y si está vacía (recién creada), escribe primero la fila con los
 * títulos de las columnas y le da formato prolijo.
 */
function obtenerHoja(nombre, columnas, anchos) {
  var planilla = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = planilla.getSheetByName(nombre);
  var esNueva = false;

  if (!hoja) {
    hoja = planilla.insertSheet(nombre);
    esNueva = true;
  }
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(columnas);
    esNueva = true;
  }
  if (esNueva) {
    formatearHoja(hoja, columnas, anchos);
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
function formatearHoja(hoja, columnas, anchos) {
  var cantidad = columnas.length;

  hoja.getRange(1, 1, 1, cantidad)
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#12212F')
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center');
  hoja.setRowHeight(1, 34);
  hoja.setFrozenRows(1);

  for (var i = 0; i < anchos.length; i++) {
    hoja.setColumnWidth(i + 1, anchos[i]);
  }

  var bandeadosViejos = hoja.getBandings();
  for (var b = 0; b < bandeadosViejos.length; b++) bandeadosViejos[b].remove();
  hoja.getRange(1, 1, 1000, cantidad)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);

  var filtroViejo = hoja.getFilter();
  if (filtroViejo) filtroViejo.remove();
  hoja.getRange(1, 1, hoja.getMaxRows(), cantidad).createFilter();
}

/**
 * Esto NO lo usa la web ni se ejecuta solo. Es para vos: si alguna vez
 * querés volver a ordenar las pestañas a mano, elegí esta función en el
 * menú desplegable de arriba del editor (al lado de "Depurar") y apretá
 * el botón de Ejecutar (▶). También sirve para crear la pestaña
 * "Siniestros" la primera vez, antes de que llegue el primer aviso.
 */
function ordenarPlanillaAhora() {
  formatearHoja(obtenerHoja(NOMBRE_HOJA, COLUMNAS, ANCHOS), COLUMNAS, ANCHOS);
  formatearHoja(obtenerHoja(NOMBRE_HOJA_SINIESTROS, COLUMNAS_SINIESTROS, ANCHOS_SINIESTROS), COLUMNAS_SINIESTROS, ANCHOS_SINIESTROS);
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
