# Cómo conectar el cotizador con la planilla "Clientes potenciales"

Esto lo hacés una sola vez. Son todos pasos dentro de tu cuenta de Google
(la misma con la que usás Gmail/Drive). Te va a llevar unos 10 minutos.

## 1. Crear la planilla

1. Andá a [sheets.google.com](https://sheets.google.com) y creá una planilla nueva en blanco.
2. Arriba a la izquierda, donde dice "Hoja de cálculo sin título", escribí:
   **Clientes potenciales**
3. No hace falta que cargues nada más: las columnas las va a escribir el
   sistema solas la primera vez que llegue una cotización.

## 2. Pegar el código

1. Con la planilla abierta, andá al menú **Extensiones → Apps Script**.
2. Se abre una pestaña nueva con un editor de código. Vas a ver un archivo
   que dice algo como `function myFunction() { }` — borrá todo ese
   contenido.
3. Abrí el archivo `apps-script.gs` (está en la carpeta del sitio web) y
   copiá **todo** su contenido.
4. Pegalo en el editor de Apps Script, donde borraste el código anterior.
5. Arriba a la izquierda, hacé clic en el ícono del **disquete** (Guardar
   proyecto), o usá Ctrl+S.

## 3. Elegir tu token secreto

El "token" es como una contraseña chica que hace que solo tu propia web
pueda guardar filas en la planilla.

1. Dentro del código que pegaste, buscá esta línea, cerca del principio:
   ```
   var TOKEN = 'CAMBIAR_ESTE_TOKEN';
   ```
2. Reemplazá `CAMBIAR_ESTE_TOKEN` por cualquier palabra o frase que
   elijas, sin espacios. Por ejemplo:
   ```
   var TOKEN = 'fsp2026secreto';
   ```
3. Guardá de nuevo (ícono del disquete).
4. **Anotá este mismo valor en algún lado** — lo vas a necesitar en el
   paso 6, para pegarlo también en `index.html`.

## 4. Implementar como aplicación web

1. Arriba a la derecha, hacé clic en el botón azul **Implementar**.
2. Elegí **Nueva implementación**.
3. Al lado de "Seleccionar tipo", hacé clic en el ícono del engranaje ⚙️ y
   elegí **Aplicación web**.
4. Completá:
   - **Ejecutar como:** `Yo (tu correo de Google)`
   - **Quién tiene acceso:** `Cualquier persona`
5. Hacé clic en **Implementar**.

## 5. Autorizar los permisos

La primera vez, Google te va a pedir autorización para que el script
pueda escribir en tu planilla. Es un paso normal de seguridad de Google,
no de este script:

1. Te va a aparecer una ventana pidiendo que seleccione tu cuenta de
   Google. Elegí la tuya.
2. Después va a aparecer una pantalla que dice algo como **"Google no
   verificó esta app"**. Esto es esperado, porque es un script tuyo,
   hecho por vos, no una app pública. Hacé clic en **Configuración
   avanzada** (abajo a la izquierda) y después en **Ir a [nombre del
   proyecto] (no seguro)**.
3. Por último aparece una pantalla pidiendo permiso para "Ver, editar,
   crear y eliminar tus hojas de cálculo de Google Sheets". Hacé clic en
   **Permitir**.

## 6. Copiar la URL y pegarla en la web

1. Después de implementar, se abre un cuadro que muestra una **URL de la
   aplicación web** (empieza con `https://script.google.com/macros/...`).
   Copiala con el botón de copiar que está al lado.
2. Abrí el archivo `index.html` del sitio y buscá, cerca del principio
   del bloque de JavaScript, estas dos líneas:
   ```
   var URL_PLANILLA = 'REEMPLAZAR_CON_LA_URL_DE_APPS_SCRIPT';
   var TOKEN_PLANILLA = 'REEMPLAZAR_CON_TU_TOKEN';
   ```
3. Reemplazá:
   - `REEMPLAZAR_CON_LA_URL_DE_APPS_SCRIPT` por la URL que copiaste en el
     paso 1 de esta sección (entre comillas, tal cual).
   - `REEMPLAZAR_CON_TU_TOKEN` por el mismo token que elegiste en el
     paso 3 de la sección anterior.
4. Guardá el archivo y subilo al sitio (o pedile a Claude que lo suba).

## Listo

De ahora en más, cada vez que alguien complete el cotizador y toque
"Enviar mi cotización", además de abrirse WhatsApp como siempre, va a
aparecer una fila nueva en la planilla "Clientes potenciales" con la
fecha, el código (por ejemplo `FSP-4821`), el nombre, la fecha de
nacimiento, el vehículo (marca y modelo) y la cobertura elegida. La
columna "Teléfono" queda vacía para que la completes vos a mano.

Ese mismo código (`FSP-4821`) también aparece al principio del mensaje
de WhatsApp que te llega, así podés buscarlo en la planilla y saber
exactamente de qué cotización se trata.

## Si algo no funciona

- **No aparece ninguna fila nueva:** revisá que la URL y el token en
  `index.html` sean exactamente los mismos que pusiste en el script (sin
  espacios de más, con las comillas).
- **Cambiaste el código de `apps-script.gs` después de implementarlo:**
  tenés que volver a `Implementar → Gestionar implementaciones`, editar
  la implementación (ícono del lápiz) y elegir "Nueva versión" para que
  los cambios se apliquen. La URL no cambia.
- Si igual no lo podés hacer andar, no pasa nada: el cotizador sigue
  funcionando igual y el WhatsApp se sigue abriendo normalmente, aunque
  la planilla no reciba nada.
