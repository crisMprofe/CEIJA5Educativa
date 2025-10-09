# 🔧 Guía de Migración de AlertaMens - Componentes Pendientes

Los siguientes componentes aún usan el sistema antiguo de AlertaMens y pueden beneficiarse de la migración al sistema unificado:

## ✅ Componentes Ya Migrados

- ✅ **ModalRegistrosPendientes.jsx** - Migrado al sistema unificado con useAlerts
- ✅ **GestorRegistrosWeb.jsx** - Migrado al sistema unificado con useAlerts

## 🔄 Componentes Pendientes de Migración

### 1. **LoginButton.jsx** - Sistema local de alertas

```jsx
// Actual (funciona pero se puede mejorar)
const [alerta, setAlerta] = useState({ text: "", variant: "" });
<AlertaMens text={alerta.text} variant={alerta.variant} />;

// Recomendado para migrar
const { showSuccess, showError, alerts, removeAlert } = useAlertContext();
showError("Mensaje de error");
<AlertaMens mode="floating" alerts={alerts} onCloseAlert={removeAlert} />;
```

### 2. **RegisterButton.jsx** - Sistema local de alertas

```jsx
// Similar a LoginButton - puede usar el mismo patrón de migración
```

### 3. **Dashboard.jsx** - Sistema local de alertas

```jsx
// Actual
<AlertaMens text={alerta.text} variant={alerta.variant} />;

// Recomendado
const { alerts, showSuccess, showError } = useAlertContext();
<AlertaMens mode="floating" alerts={alerts} />;
```

### 4. **ListaEstudiantes.jsx** - Sistema local de alertas

```jsx
// Tiene estado local de alertas que se puede unificar
```

### 5. **Componentes con uso incorrecto o limitado**:

#### **AreaEstudioSelector.jsx**

```jsx
// ❌ Uso incorrecto - prop 'mensaje' no existe
<AlertaMens mensaje={error} />

// ✅ Corrección inmediata
<AlertaMens text={error} variant="error" />

// 🚀 Migración recomendada
const { showError } = useAlertContext();;
showError(error);
```

#### **EstadoInscripcion.jsx**

```jsx
// ✅ Uso correcto actual - no requiere migración urgente
<AlertaMens text={errors.idEstadoInscripcion} variant="error" />
```

#### **GestionCRUD.jsx** y **FormularioModificar.jsx**

```jsx
// Revisar implementación actual y migrar si usan estado local
```

## 🎯 Patrón de Migración Recomendado

### Paso 1: Importar hook

```jsx
import { useAlerts } from "../hooks/useAlerts";
```

### Paso 2: Usar el hook

```jsx
const { alerts, modal, showSuccess, showError, removeAlert, closeModal } =
  useAlertContext();
```

### Paso 3: Reemplazar setState por funciones del hook

```jsx
// Antes
setAlerta({ text: "Error", variant: "error" });

// Después
showError("Error");
```

### Paso 4: Actualizar JSX

```jsx
// Antes
<AlertaMens text={alerta.text} variant={alerta.variant} />

// Después
<AlertaMens
    mode="floating"
    alerts={alerts}
    modal={modal}
    onCloseAlert={removeAlert}
    onCloseModal={closeModal}
/>
```

## 🚨 Correcciones Inmediatas Necesarias

### AreaEstudioSelector.jsx - PROP INCORRECTA

```jsx
// ❌ INCORRECTO - Esta línea causará error
<AlertaMens mensaje={error} />

// ✅ CORRECCIÓN
<AlertaMens text={error} variant="error" />
```

## 📋 Prioridades de Migración

1. **🔴 Alta Prioridad**:

   - AreaEstudioSelector.jsx (corregir prop incorrecta)
   - LoginButton.jsx y RegisterButton.jsx (páginas principales)

2. **🟡 Media Prioridad**:

   - Dashboard.jsx
   - ListaEstudiantes.jsx

3. **🟢 Baja Prioridad**:
   - EstadoInscripcion.jsx (funciona bien como está)
   - GestionCRUD.jsx, FormularioModificar.jsx (revisar si es necesario)

## 💡 Beneficios de la Migración

- **Consistencia**: Todas las alertas usan el mismo sistema
- **Mejores animaciones**: Alertas flotantes con animaciones suaves
- **Menos código**: No necesidad de manejar estado local de alertas
- **Más características**: Modales de confirmación, alertas de carga, etc.
- **Mejor UX**: Alertas no bloquean la interfaz, se posicionan correctamente

## 🔧 Comandos de Migración

Para migrar un componente específico, seguir este patrón:

```bash
# 1. Corregir imports
- import AlertaMens from './AlertaMens';
+ import { useAlertContext } from '../context/AlertContext';
+ import AlertaMens from './AlertaMens';

# 2. Reemplazar estado local
- const [alerta, setAlerta] = useState({ text: '', variant: '' });
+ const { alerts, showSuccess, showError, removeAlert } = useAlertContext();;

# 3. Cambiar calls de setState
- setAlerta({ text: 'Error', variant: 'error' });
+ showError('Error');

# 4. Actualizar JSX
- <AlertaMens text={alerta.text} variant={alerta.variant} />
+ <AlertaMens mode="floating" alerts={alerts} onCloseAlert={removeAlert} />
```

---

**Nota**: Los componentes pueden seguir usando el sistema anterior (modo legacy) sin problemas, pero la migración mejorará la experiencia de usuario y mantendrá la consistencia en toda la aplicación.
