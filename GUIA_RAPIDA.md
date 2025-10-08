# Guía Rápida - Correcciones Realizadas

## 🎯 ¿Qué se corrigió?

### Problema 1: Rutas duplicadas en el backend
**Antes:**
```javascript
// Había DOS rutas PUT para /:dni en registrosPendientes.js
router.put('/:dni', async (req, res) => { /* versión 1 */ });
// ... 100 líneas después ...
router.put('/:dni', upload.any(), async (req, res) => { /* versión 2 */ });
```

**Después:**
```javascript
// Ahora hay UNA sola ruta que maneja ambos casos
router.put('/:dni', upload.any(), async (req, res) => {
  // Maneja actualización con archivos y sin archivos
});
```

### Problema 2: Orden incorrecto de rutas
**Antes:**
```javascript
router.get('/');           // GET /api/registros-pendientes
router.get('/:dni');       // GET /api/registros-pendientes/:dni
router.get('/stats');      // ❌ Nunca funciona porque "stats" es capturado por /:dni
```

**Después:**
```javascript
router.get('/');           // GET /api/registros-pendientes
router.get('/stats');      // ✅ GET /api/registros-pendientes/stats
router.get('/:dni');       // GET /api/registros-pendientes/:dni
```

### Problema 3: Uso de fetch en lugar de axios
**Antes (serviceRegistrosWeb.js):**
```javascript
const response = await fetch(`${API_BASE_URL}/registros-web`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
});

if (!response.ok) {
    throw new Error(`Error ${response.status}`);
}

const registros = await response.json();
```

**Después:**
```javascript
import axios from 'axios';

const response = await axios.get(`${API_BASE_URL}/registros-web`);
const registros = response.data;
```

## 📁 Archivos Modificados

1. **Backend Routes:**
   - ✅ `routes/registrosWeb.js` - Orden de rutas corregido
   - ✅ `routes/registrosPendientes.js` - Duplicados eliminados, orden corregido

2. **Frontend Services:**
   - ✅ `src/services/serviceRegistrosWeb.js` - Convertido a axios
   - ✅ `src/services/serviceRegistrosPendientes.js` - Convertido a axios
   - ✅ `src/services/registrosPendientesService.js` - Convertido a axios

## 🔄 Flujos de Trabajo

### Flujo 1: Registro Web → Base de Datos
```
Usuario web completa formulario
         ↓
POST /api/registros-web (crea registro web en JSON)
         ↓
Admin revisa en dashboard
         ↓
POST /api/registros-web/:id/procesar (con destinoBD=true)
         ↓
Datos guardados en base de datos MySQL
```

### Flujo 2: Registro Web → Pendientes → Base de Datos
```
Usuario web completa formulario PARCIALMENTE
         ↓
POST /api/registros-web (crea registro web)
         ↓
Admin detecta falta documentación
         ↓
POST /api/registros-web/:id/mover-pendiente
         ↓
Registro movido a Registros_Pendientes.json
         ↓
Usuario completa documentación
         ↓
PUT /api/registros-pendientes/:dni (actualizar)
         ↓
POST /api/completar-documentacion/:dni
         ↓
Datos guardados en base de datos MySQL
```

### Flujo 3: Registro Admin Directo
```
Admin crea registro pendiente directamente
         ↓
POST /api/registros-pendientes
         ↓
Registro guardado en Registros_Pendientes.json
         ↓
Cuando esté completo:
POST /api/completar-documentacion/:dni
         ↓
Datos guardados en base de datos MySQL
```

## 🛠️ Cómo Usar los Servicios

### Desde un Componente React

```javascript
import registrosWebService from '@/services/serviceRegistrosWeb';
import registrosPendientesService from '@/services/serviceRegistrosPendientes';

function MiComponente() {
  // Obtener registros web
  const obtenerRegistros = async () => {
    try {
      const registros = await registrosWebService.obtenerRegistrosWeb();
      console.log('Registros:', registros);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Crear registro web con archivos
  const crearRegistro = async (datos, archivos) => {
    try {
      const formData = new FormData();
      
      // Agregar datos
      Object.keys(datos).forEach(key => {
        formData.append(key, datos[key]);
      });
      
      // Agregar archivos
      Object.keys(archivos).forEach(key => {
        formData.append(key, archivos[key]);
      });
      
      const resultado = await registrosWebService.crearRegistroWeb(formData);
      console.log('Registro creado:', resultado);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Mover a pendientes
  const moverAPendientes = async (id) => {
    try {
      await registrosWebService.moverRegistroWebAPendientes(
        id,
        'Falta archivo DNI'
      );
      console.log('Movido a pendientes');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <div>...</div>;
}
```

## ✅ Verificación

Para verificar que todo funciona correctamente:

1. **Backend**: Iniciar el servidor
   ```bash
   cd backend
   npm start
   # Servidor corriendo en http://localhost:5000
   ```

2. **Frontend**: Verificar que axios está instalado
   ```bash
   cd frontend
   npm list axios
   # Debería mostrar: axios@1.7.7
   ```

3. **Probar rutas**: Usar el script de verificación
   ```bash
   node /tmp/test-routes.js
   ```

## 🐛 Solución de Problemas Comunes

### Error: "stats" no funciona
**Causa:** La ruta `/stats` está después de `/:dni` o `/:id`  
**Solución:** Ya corregido - `/stats` ahora está antes

### Error: "Cannot find module 'axios'"
**Causa:** axios no está instalado  
**Solución:**
```bash
npm install axios
```

### Error: "Duplicate route PUT /:dni"
**Causa:** Había dos definiciones de la misma ruta  
**Solución:** Ya corregido - eliminada la duplicación

### Error: "TypeError: response.json is not a function"
**Causa:** Axios devuelve `response.data` directamente  
**Solución:** Ya corregido - todos los servicios usan `response.data`

## 📊 Resumen de Cambios

| Archivo | Cambios | Estado |
|---------|---------|--------|
| `routes/registrosWeb.js` | Orden de rutas corregido | ✅ |
| `routes/registrosPendientes.js` | Duplicados eliminados + orden | ✅ |
| `src/services/serviceRegistrosWeb.js` | fetch → axios | ✅ |
| `src/services/serviceRegistrosPendientes.js` | fetch → axios | ✅ |
| `src/services/registrosPendientesService.js` | fetch → axios | ✅ |

## 🎉 Resultado Final

Ahora tienes:
- ✅ Rutas backend sin duplicados
- ✅ Orden correcto de rutas (stats antes de :id/:dni)
- ✅ Todos los servicios usando axios
- ✅ Manejo consistente de errores
- ✅ Mejor integración entre frontend y backend

## 📚 Documentación Adicional

Ver `RUTAS_DOCUMENTACION.md` para:
- Tabla completa de todas las rutas disponibles
- Ejemplos de uso detallados
- Configuración avanzada
- Próximos pasos y mejoras
