# Documentación de Rutas - Registro Web y Registros Pendientes

## 🔧 Problemas Resueltos

### 1. **Rutas Backend Duplicadas**
- ✅ Se eliminó la duplicación de la ruta `PUT /:dni` en `registrosPendientes.js`
- ✅ Se unificó en una sola ruta que maneja actualización con y sin archivos

### 2. **Orden de Rutas Incorrecto**
- ✅ Las rutas `/stats` se movieron ANTES de las rutas con parámetros (`:id`, `:dni`)
- ✅ Esto evita que Express interprete "stats" como un ID o DNI

### 3. **Conversión de Fetch a Axios**
- ✅ Se convirtieron todos los servicios frontend de `fetch` a `axios`
- ✅ Archivos actualizados:
  - `src/services/serviceRegistrosWeb.js`
  - `src/services/serviceRegistrosPendientes.js`
  - `src/services/registrosPendientesService.js`

## 📋 Rutas Backend Disponibles

### Registros Web (`/api/registros-web`)

| Método | Ruta | Descripción | Body/Params |
|--------|------|-------------|-------------|
| GET | `/` | Obtener todos los registros web | - |
| GET | `/stats` | Obtener estadísticas | - |
| POST | `/` | Crear registro web | FormData con archivos |
| PUT | `/:id` | Actualizar registro web | `{ estado, observaciones }` |
| DELETE | `/:id` | Eliminar registro web | - |
| POST | `/:id/procesar` | Procesar registro (enviar a BD o pendientes) | FormData con archivos |
| POST | `/:id/mover-pendiente` | Mover a pendientes | `{ motivoPendiente }` |

### Registros Pendientes (`/api/registros-pendientes`)

| Método | Ruta | Descripción | Body/Params |
|--------|------|-------------|-------------|
| GET | `/` | Obtener todos los registros pendientes | - |
| GET | `/stats` | Obtener estadísticas | - |
| GET | `/:dni` | Obtener registro por DNI | DNI en URL |
| POST | `/` | Crear registro pendiente | FormData con archivos |
| PUT | `/:dni` | Actualizar registro pendiente | FormData o JSON |
| DELETE | `/:dni` | Eliminar registro pendiente | - |

## 🎯 Uso de Servicios Frontend

### Ejemplo con Axios en `serviceRegistrosWeb.js`

```javascript
import registrosWebService from '@/services/serviceRegistrosWeb';

// Obtener todos los registros web
const registros = await registrosWebService.obtenerRegistrosWeb();

// Crear un nuevo registro web
const nuevoRegistro = await registrosWebService.crearRegistroWeb({
  nombre: 'Juan',
  apellido: 'Pérez',
  dni: '12345678',
  // ... más datos
});

// Actualizar registro
await registrosWebService.actualizarRegistroWeb(id, {
  estado: 'PROCESADO',
  observaciones: 'Documentación completa'
});

// Procesar registro (enviar a BD)
await registrosWebService.procesarRegistroWeb(
  id,
  datosFormulario,
  documentos,
  true // destinoBD
);

// Mover a pendientes
await registrosWebService.moverRegistroWebAPendientes(
  id,
  'Falta documentación'
);
```

### Ejemplo con Axios en `serviceRegistrosPendientes.js`

```javascript
import registrosPendientesService from '@/services/serviceRegistrosPendientes';

// Obtener todos los registros pendientes
const registros = await registrosPendientesService.obtenerRegistrosPendientes();

// Actualizar con archivos
await registrosPendientesService.actualizarRegistroPendiente(
  dni,
  { nombre: 'Juan', apellido: 'Pérez' },
  { archivo_dni: { file: archivoFile } }
);

// Completar documentación (enviar a BD)
const formData = new FormData();
formData.append('dni', '12345678');
formData.append('archivo_dni', archivoFile);
await registrosPendientesService.completarRegistro(formData);

// Enviar notificación por email
await registrosPendientesService.enviarNotificacion(dni);
```

## 🔍 Ventajas de Usar Axios

### Antes (con fetch)
```javascript
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message);
}

const resultado = await response.json();
```

### Ahora (con axios)
```javascript
const response = await axios.post(url, data);
const resultado = response.data;
// El manejo de errores es automático
```

### Beneficios:
- ✅ Manejo automático de JSON
- ✅ Interceptores para autenticación
- ✅ Manejo de errores simplificado
- ✅ Mejor soporte para FormData
- ✅ Cancelación de peticiones
- ✅ Timeout configurables

## 🛠️ Configuración del Backend

Las rutas están registradas en `server.js`:

```javascript
app.use('/api/registros-web', require('./routes/registrosWeb'));
app.use('/api/registros-pendientes', require('./routes/registrosPendientes'));
```

### Orden de las Rutas (IMPORTANTE)
```javascript
// ✅ CORRECTO - /stats antes de /:id
router.get('/');
router.get('/stats');  // Específica
router.get('/:id');    // Genérica con parámetro

// ❌ INCORRECTO - /stats después de /:id
router.get('/');
router.get('/:id');    // Captura TODO, incluyendo "stats"
router.get('/stats');  // Nunca se alcanza
```

## 📂 Estructura de Archivos

```
backend/
├── routes/
│   ├── registrosWeb.js          # Rutas para registros web
│   └── registrosPendientes.js   # Rutas para registros pendientes
├── server.js                    # Configuración del servidor
└── data/
    ├── Registro_Web.json        # Almacén de registros web
    └── Registros_Pendientes.json # Almacén de registros pendientes

frontend/
└── src/
    └── services/
        ├── serviceRegistrosWeb.js           # Servicio para registros web
        ├── serviceRegistrosPendientes.js    # Servicio default export
        └── registrosPendientesService.js    # Servicio named export
```

## ⚠️ Notas Importantes

1. **Archivos Subidos**: Los registros web guardan archivos en `archivosDocWeb/`, mientras que los registros pendientes usan `archivosPendientes/`

2. **IDs vs DNI**: Los registros web usan un `id` generado (timestamp), mientras que los registros pendientes usan el `dni` como identificador

3. **Estados**: Los registros pueden tener estados como:
   - `PENDIENTE`
   - `PROCESADO`
   - `MOVIDO_A_PENDIENTES`
   - `ANULADO`

4. **FormData**: Al usar axios con FormData, el header `Content-Type: multipart/form-data` se configura automáticamente

## 🧪 Testing

Para probar las rutas, puedes usar:

```bash
# Desde el directorio backend
node /tmp/test-routes.js
```

O usar herramientas como Postman/Insomnia con las rutas documentadas arriba.

## 🚀 Próximos Pasos

- [ ] Implementar validación de datos más robusta
- [ ] Agregar autenticación y autorización
- [ ] Implementar logging más detallado
- [ ] Agregar tests unitarios y de integración
- [ ] Implementar paginación para listas grandes
- [ ] Agregar filtros y búsqueda

## 📞 Soporte

Si encuentras algún problema con las rutas o servicios, verifica:
1. Que el servidor backend esté corriendo en el puerto correcto (5000)
2. Que axios esté instalado en el frontend
3. Que las rutas estén en el orden correcto (stats antes de :id/:dni)
4. Que no haya rutas duplicadas
