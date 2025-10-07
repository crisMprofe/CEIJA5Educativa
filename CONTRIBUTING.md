# Guía de Contribución

¡Gracias por tu interés en contribuir a CEIJA5 Educativa! Esta guía te ayudará a empezar.

## Código de Conducta

### Nuestro Compromiso

Nos comprometemos a hacer de la participación en nuestro proyecto una experiencia libre de acoso para todos, independientemente de edad, tamaño corporal, discapacidad, etnia, identidad de género, nivel de experiencia, nacionalidad, apariencia personal, raza, religión o identidad y orientación sexual.

### Comportamiento Esperado

- Usar lenguaje acogedor e inclusivo
- Ser respetuoso con diferentes puntos de vista y experiencias
- Aceptar críticas constructivas con gracia
- Enfocarse en lo mejor para la comunidad
- Mostrar empatía hacia otros miembros de la comunidad

## ¿Cómo Contribuir?

### Reportar Errores

Si encuentras un error, por favor:

1. Verifica que no haya sido reportado previamente
2. Abre un nuevo issue en GitHub
3. Incluye:
   - Descripción clara del problema
   - Pasos para reproducir el error
   - Comportamiento esperado vs. observado
   - Capturas de pantalla (si aplica)
   - Información del navegador/sistema

### Sugerir Mejoras

Para proponer nuevas características:

1. Abre un issue describiendo la mejora
2. Explica por qué sería útil
3. Proporciona ejemplos de uso
4. Espera retroalimentación antes de implementar

### Contribuir Código

#### Proceso de Pull Request

1. **Fork el repositorio**
   ```bash
   # Haz click en "Fork" en GitHub
   git clone https://github.com/TU-USUARIO/CEIJA5Educativa.git
   ```

2. **Crea una rama para tu característica**
   ```bash
   git checkout -b feature/nombre-caracteristica
   ```

3. **Realiza tus cambios**
   - Sigue las convenciones de código
   - Escribe código limpio y documentado
   - Agrega comentarios cuando sea necesario

4. **Prueba tus cambios**
   - Verifica que todo funcione correctamente
   - Prueba en diferentes navegadores
   - Asegúrate de no romper funcionalidad existente

5. **Commit de tus cambios**
   ```bash
   git add .
   git commit -m "feat: descripción breve de los cambios"
   ```

6. **Push a tu fork**
   ```bash
   git push origin feature/nombre-caracteristica
   ```

7. **Abre un Pull Request**
   - Describe claramente los cambios
   - Referencia issues relacionados
   - Adjunta capturas de pantalla si hay cambios visuales

## Estándares de Código

### HTML

- Usa indentación de 4 espacios
- Cierra todas las etiquetas
- Usa semántica HTML5
- Incluye atributos `alt` en imágenes

```html
<!-- Bien -->
<section class="hero">
    <h1>Título</h1>
    <p>Descripción</p>
</section>

<!-- Mal -->
<div class="hero">
<h1>Título
<p>Descripción</div>
```

### CSS

- Usa indentación de 4 espacios
- Un selector por línea
- Propiedades en orden alfabético (preferible)
- Usa nombres de clase descriptivos

```css
/* Bien */
.card {
    background-color: #fff;
    border-radius: 8px;
    padding: 1rem;
}

/* Mal */
.c{background:#fff;border-radius:8px;padding:1rem;}
```

### JavaScript

- Usa indentación de 4 espacios
- Usa `const` y `let`, no `var`
- Nombres de variables descriptivos
- Funciones con nombres claros
- Comentarios para lógica compleja

```javascript
// Bien
const obtenerProyectos = () => {
    return proyectos.filter(p => p.estado === 'activo');
};

// Mal
function gp(){return proyectos.filter(p=>p.estado=='activo')}
```

### Mensajes de Commit

Usa el formato de Conventional Commits:

- `feat:` Nueva característica
- `fix:` Corrección de error
- `docs:` Cambios en documentación
- `style:` Formato de código (sin cambio de lógica)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

Ejemplos:
```
feat: agregar filtro de búsqueda de proyectos
fix: corregir error en formulario de contacto
docs: actualizar guía de usuario
```

## Documentación

### Escribir Documentación

- Usa Markdown para documentación
- Sé claro y conciso
- Incluye ejemplos cuando sea posible
- Mantén actualizada la documentación existente

### Comentarios en Código

```javascript
// Bien: Explica el "por qué"
// Calculamos el promedio ponderado porque algunos proyectos tienen mayor prioridad
const promedio = calcularPromedioPonderado(proyectos);

// Mal: Explica el "qué" (es obvio)
// Asigna el valor a la variable promedio
const promedio = calcularPromedioPonderado(proyectos);
```

## Testing

Aunque actualmente no hay tests automatizados, cuando contribuyas:

1. Prueba manualmente todas las funcionalidades
2. Verifica responsive design
3. Prueba en múltiples navegadores:
   - Chrome
   - Firefox
   - Safari
   - Edge

## Prioridades del Proyecto

### Alta Prioridad
- Correcciones de seguridad
- Bugs críticos
- Mejoras de accesibilidad

### Media Prioridad
- Nuevas características solicitadas
- Mejoras de rendimiento
- Refactorización de código

### Baja Prioridad
- Mejoras estéticas menores
- Optimizaciones micro

## Preguntas

Si tienes preguntas:

1. Revisa la documentación existente
2. Busca en issues cerrados
3. Abre un nuevo issue con la etiqueta "question"
4. Usa el formulario de contacto

## Reconocimientos

Todos los contribuidores serán reconocidos en el README y en la sección de agradecimientos.

## Licencia

Al contribuir, aceptas que tus contribuciones se licenciarán bajo la misma licencia MIT del proyecto.

---

¡Gracias por contribuir a CEIJA5 Educativa!
